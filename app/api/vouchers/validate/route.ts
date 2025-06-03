import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, where, doc, updateDoc, getDoc, Timestamp, addDoc, runTransaction } from "firebase/firestore"
import { jwtDecode } from "jwt-decode"
import type { SessionToken } from "@/types/session"
import type { Voucher } from "@/types/voucher"

export async function POST(request: Request) {
  try {
    const sessionToken = request.headers.get("x-session-token")
    
    if (!sessionToken) {
      return NextResponse.json(
        { error: "Sessão inválida" },
        { status: 403 }
      )
    }

    const session = jwtDecode<SessionToken>(sessionToken)

    if (session.userType !== "business") {
      return NextResponse.json(
        { error: "Apenas estabelecimentos podem validar vouchers" },
        { status: 403 }
      )
    }

    const { code } = await request.json()

    // Buscar voucher pelo código
    const vouchersRef = collection(db, "vouchers")
    const voucherQuery = query(vouchersRef, where("code", "==", code))
    const voucherSnap = await getDocs(voucherQuery)

    if (voucherSnap.empty) {
      return NextResponse.json({
        valid: false,
        message: "Voucher não encontrado"
      })
    }

    const voucherDoc = voucherSnap.docs[0]
    const voucher = { id: voucherDoc.id, ...voucherDoc.data() }

    // Buscar dados do estabelecimento para pegar a imagem
    const establishmentRef = doc(db, "establishments", voucher.establishmentId)
    const establishmentSnap = await getDoc(establishmentRef)

    if (!establishmentSnap.exists()) {
      return NextResponse.json({
        valid: false,
        message: "Estabelecimento não encontrado"
      })
    }

    const establishmentData = establishmentSnap.data()

    // Verificar se o voucher está expirado
    const expirationTime = voucher.expiresAt?.seconds ? 
      new Date(voucher.expiresAt.seconds * 1000) : 
      new Date(voucher.expiresAt)

    if (expirationTime < new Date() && 
        voucher.status !== "verified" && 
        voucher.status !== "used") {
      // Se estiver expirado e não estiver verificado ou utilizado, 
      // atualizar o status no banco
      const voucherRef = doc(db, "vouchers", voucherDoc.id)
      await updateDoc(voucherRef, {
        status: "expired"
      })

      return NextResponse.json({
        valid: false,
        message: "Este voucher está expirado"
      })
    }

    // Verificar se o voucher já está marcado como expirado
    if (voucher.status === "expired") {
      return NextResponse.json({
        valid: false,
        message: "Este voucher está expirado"
      })
    }

    // Verificar se o voucher já foi utilizado
    if (voucher.status === "used") {
      return NextResponse.json({
        valid: false,
        message: "Este voucher já foi utilizado"
      })
    }

    // Buscar dados do Assinante - versão corrigida
    let memberSnap;
    let memberData;

    // Primeiro, tenta buscar pelo memberId
    const memberRef = doc(db, "users", voucher.memberId)
    memberSnap = await getDoc(memberRef)

    // Se não encontrar, tenta buscar por uma consulta alternativa
    if (!memberSnap.exists()) {
      console.log(`Membro não encontrado diretamente pelo ID: ${voucher.memberId}, tentando buscar por query...`);
      
      // Tente verificar se o memberId armazenado pode ser o uid do Firebase Auth
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("firebaseUid", "==", voucher.memberId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // Encontrou o usuário pela consulta
        memberSnap = querySnapshot.docs[0];
        memberData = memberSnap.data();
      } else {
        // Ainda não encontrou - última tentativa: verificar pelo email
        if (voucher.memberEmail) {
          const emailQuery = query(usersRef, where("email", "==", voucher.memberEmail));
          const emailSnapshot = await getDocs(emailQuery);
          
          if (!emailSnapshot.empty) {
            memberSnap = emailSnapshot.docs[0];
            memberData = memberSnap.data();
          } else {
            return NextResponse.json({
              valid: false,
              message: "Assinante não encontrado"
            });
          }
        } else {
          return NextResponse.json({
            valid: false,
            message: "Assinante não encontrado"
          });
        }
      }
    } else {
      memberData = memberSnap.data();
    }

    // Atualizar status para verificado
    await updateDoc(doc(db, "vouchers", voucherDoc.id), {
      status: "verified",
      verifiedAt: Timestamp.now(),
      verifiedBy: session.uid
    })

    return NextResponse.json({
      valid: true,
      voucher: {
        ...voucher,
        member: {
          name: memberData.displayName,
          phone: memberData.phoneNumber || memberData.phone,
          email: memberData.email,
          photoURL: memberData.photoURL
        },
        establishmentImage: establishmentData.images?.[0] || "/placeholder.svg"
      }
    })

  } catch (error) {
    console.error("Erro ao validar voucher:", error)
    return NextResponse.json(
      { error: "Erro ao validar voucher" },
      { status: 500 }
    )
  }
}

// Rota para realizar o check-in
export async function PATCH(request: Request) {
  try {
    const sessionToken = request.headers.get("x-session-token")
    
    if (!sessionToken) {
      return NextResponse.json(
        { error: "Sessão inválida" },
        { status: 403 }
      )
    }

    const session = jwtDecode<SessionToken>(sessionToken)

    if (session.userType !== "business") {
      return NextResponse.json(
        { error: "Apenas estabelecimentos podem realizar check-in" },
        { status: 403 }
      )
    }

    const { code } = await request.json()

    // Buscar voucher pelo código
    const vouchersRef = collection(db, "vouchers")
    const voucherQuery = query(vouchersRef, where("code", "==", code))
    const voucherSnap = await getDocs(voucherQuery)

    if (voucherSnap.empty) {
      return NextResponse.json(
        { error: "Voucher não encontrado" },
        { status: 404 }
      )
    }

    const voucherDoc = voucherSnap.docs[0]
    const voucher = voucherDoc.data()

    if (voucher.status !== "verified") {
      return NextResponse.json(
        { error: "Voucher não foi verificado" },
        { status: 400 }
      )
    }

    // Buscar dados do estabelecimento para incluir na notificação
    const establishmentRef = doc(db, "establishments", voucher.establishmentId)
    const establishmentSnap = await getDoc(establishmentRef)
    
    if (!establishmentSnap.exists()) {
      return NextResponse.json(
        { error: "Estabelecimento não encontrado" },
        { status: 404 }
      )
    }

    const establishment = establishmentSnap.data()

    try {
      // Realizar check-in e criar notificação em uma transação
      await runTransaction(db, async (transaction) => {
        // Atualiza o status do voucher
        transaction.update(doc(db, "vouchers", voucherDoc.id), {
          status: "used",
          usedAt: Timestamp.now(),
          usedBy: session.uid
        })
        
        // Cria a notificação de avaliação
        const notificationsRef = collection(db, "notifications")
        const notificationData = {
          type: "rating",
          memberId: voucher.memberId,
          establishmentId: voucher.establishmentId,
          establishmentName: establishment.name,
          voucherId: voucherDoc.id,
          createdAt: Timestamp.now(),
          status: "pending"
        }
        
        transaction.set(doc(notificationsRef), notificationData)
      })

      return NextResponse.json({
        success: true,
        message: "Check-in realizado com sucesso"
      })

    } catch (error) {
      console.error("Erro na transação:", error)
      return NextResponse.json(
        { error: "Erro ao realizar check-in" },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error("Erro ao realizar check-in:", error)
    return NextResponse.json(
      { error: "Erro ao realizar check-in" },
      { status: 500 }
    )
  }
}
