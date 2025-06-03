import { NextResponse } from "next/server"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

/**
 * Retorna o link de pagamento padrão do sistema
 */
export async function GET() {
  try {
    console.log("Buscando link padrão para disponibilização...")
    
    // Buscar link com flag isDefault = true
    const defaultLinkQuery = query(
      collection(db, "partnerLinks"),
      where("isDefault", "==", true)
    )
    
    const querySnapshot = await getDocs(defaultLinkQuery)
    
    if (querySnapshot.empty) {
      console.log("Nenhum link padrão encontrado")
      return NextResponse.json({ error: "Link padrão não encontrado" }, { status: 404 })
    }
    
    const docData = querySnapshot.docs[0]
    console.log("Link padrão encontrado:", docData.id)
    
    // Retornar dados do link padrão
    return NextResponse.json({
      id: docData.id,
      ...docData.data()
    })
  } catch (error) {
    console.error("Erro ao buscar link padrão:", error)
    return NextResponse.json({ error: "Erro ao buscar link padrão" }, { status: 500 })
  }
} 