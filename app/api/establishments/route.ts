import { NextResponse } from "next/server"
import { db, storage } from "@/lib/firebase"
import { collection, addDoc, getDocs, query, where, updateDoc, doc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { jwtDecode } from "jwt-decode"

import type { SessionToken } from "@/types/session"

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

    if (session.userType !== "partner") {
      return NextResponse.json(
        { error: "Apenas parceiros podem cadastrar estabelecimentos" },
        { status: 403 }
      )
    }

    // Receber os dados do estabelecimento e a imagem em base64
    const { name, description, images, ...establishmentData } = await request.json()

    // Array para armazenar as URLs das imagens
    const imageUrls = []

    // Processar cada imagem
    for (const imageBase64 of images) {
      try {
        // Converter base64 para blob
        const imageBlob = await fetch(imageBase64).then(r => r.blob())
        
        // Criar referência única para a imagem
        const imageRef = ref(storage, `establishments/${session.uid}/${Date.now()}-${Math.random().toString(36).substring(7)}`)
        
        // Fazer upload da imagem
        await uploadBytes(imageRef, imageBlob)
        
        // Obter URL da imagem
        const imageUrl = await getDownloadURL(imageRef)
        
        imageUrls.push(imageUrl)
      } catch (error) {
        console.error("Erro ao fazer upload da imagem:", error)
      }
    }

    // Criar documento do estabelecimento com as URLs das imagens
    const establishmentRef = await addDoc(collection(db, "establishments"), {
      name,
      description,
      images: imageUrls,
      partnerId: session.uid,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...establishmentData
    })

    return NextResponse.json({
      success: true,
      establishment: {
        id: establishmentRef.id,
        name,
        description,
        images: imageUrls,
        ...establishmentData
      }
    })

  } catch (error) {
    console.error("Erro ao cadastrar estabelecimento:", error)
    return NextResponse.json(
      { 
        error: "Erro ao cadastrar estabelecimento",
        details: error instanceof Error ? error.message : "Erro desconhecido"
      },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const partnerId = searchParams.get("partnerId")
    const memberId = searchParams.get("memberId")

    let establishmentsQuery

    if (partnerId) {
      // Buscar estabelecimentos de um parceiro específico
      establishmentsQuery = query(
        collection(db, "establishments"), 
        where("partnerId", "==", partnerId)
      )
    } else if (memberId) {
      // Buscar estabelecimentos dos parceiros que o membro é assinante
      const subscriptionsRef = collection(db, "subscriptions")
      const subscriptionsQuery = query(subscriptionsRef, where("memberId", "==", memberId))
      const subscriptionsSnapshot = await getDocs(subscriptionsQuery)
      
      const partnerIds = subscriptionsSnapshot.docs.map(doc => doc.data().partnerId)
      
      if (partnerIds.length === 0) {
        return NextResponse.json([])
      }

      establishmentsQuery = query(
        collection(db, "establishments"), 
        where("partnerId", "in", partnerIds)
      )
    } else {
      // Buscar todos os estabelecimentos
      establishmentsQuery = collection(db, "establishments")
    }

    const querySnapshot = await getDocs(establishmentsQuery)
    const establishments = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    return NextResponse.json(establishments)

  } catch (error) {
    console.error("Erro ao buscar estabelecimentos:", error)
    return NextResponse.json(
      { error: "Erro ao buscar estabelecimentos" },
      { status: 500 }
    )
  }
}

// Rota para atualizar estabelecimento
export async function PUT(request: Request) {
  try {
    const sessionToken = request.headers.get("x-session-token")
    
    if (!sessionToken) {
      return NextResponse.json(
        { error: "Sessão inválida" },
        { status: 403 }
      )
    }

    const session = jwtDecode<SessionToken>(sessionToken)

    if (session.userType !== "partner") {
      return NextResponse.json(
        { error: "Apenas parceiros podem atualizar estabelecimentos" },
        { status: 403 }
      )
    }

    const { id, name, description, images, ...establishmentData } = await request.json()

    // Array para armazenar as URLs das imagens
    const imageUrls = []

    // Processar apenas novas imagens (em base64)
    for (const image of images) {
      if (image.startsWith('data:image')) {
        try {
          const imageBlob = await fetch(image).then(r => r.blob())
          const imageRef = ref(storage, `establishments/${session.uid}/${Date.now()}-${Math.random().toString(36).substring(7)}`)
          await uploadBytes(imageRef, imageBlob)
          const imageUrl = await getDownloadURL(imageRef)
          imageUrls.push(imageUrl)
        } catch (error) {
          console.error("Erro ao fazer upload da imagem:", error)
        }
      } else {
        // Se não é base64, é uma URL existente
        imageUrls.push(image)
      }
    }

    // Atualizar documento do estabelecimento
    const establishmentRef = doc(db, "establishments", id)
    await updateDoc(establishmentRef, {
      name,
      description,
      images: imageUrls,
      updatedAt: new Date().toISOString(),
      ...establishmentData
    })

    return NextResponse.json({
      success: true,
      establishment: {
        id,
        name,
        description,
        images: imageUrls,
        ...establishmentData
      }
    })

  } catch (error) {
    console.error("Erro ao atualizar estabelecimento:", error)
    return NextResponse.json(
      { 
        error: "Erro ao atualizar estabelecimento",
        details: error instanceof Error ? error.message : "Erro desconhecido"
      },
      { status: 500 }
    )
  }
}
