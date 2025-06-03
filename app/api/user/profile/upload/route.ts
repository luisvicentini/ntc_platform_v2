import { NextRequest, NextResponse } from "next/server"
import { doc, updateDoc } from "firebase/firestore"
import { ref, uploadString, getDownloadURL } from "firebase/storage"
import { db, storage } from "@/lib/firebase"
import { revalidateTag } from "next/cache"

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { userId, imageBase64 } = data

    if (!userId || !imageBase64) {
      return NextResponse.json(
        { error: "User ID and image are required" },
        { status: 400 }
      )
    }

    console.log('Verificando dados da imagem...')
    console.log('Formato da imagem:', imageBase64.substring(0, 50) + '...')

    // Criar nome único para o arquivo
    const timestamp = Date.now()
    const filename = `profile_${timestamp}.jpg`
    // Usar um caminho mais simples para debug
    const filePath = `avatars/${userId}.jpg`
    console.log('Caminho do arquivo:', filePath)
    
    // Verificar configuração do Storage
    console.log('Storage bucket:', storage.app.options.storageBucket)
    
    // Upload usando Firebase Client
    console.log('Iniciando upload...')
    console.log('Storage bucket:', storage.app.options.storageBucket)
    console.log('Caminho do arquivo:', filePath)
    
    const storageRef = ref(storage, filePath)
    
    try {
      console.log('Storage reference criado')

      // Verificar se o bucket existe
      if (!storage.app.options.storageBucket) {
        throw new Error('Storage bucket não configurado. Por favor, crie um bucket no Firebase Console.')
      }
      
      console.log('Fazendo upload da imagem...')
      await uploadString(storageRef, imageBase64, 'data_url')
    } catch (uploadError: any) {
      console.error('Erro detalhado do upload:', {
        error: uploadError,
        message: uploadError.message,
        code: uploadError.code,
        serverResponse: uploadError.serverResponse
      })
      throw uploadError
    }
    console.log('Upload concluído com sucesso')
    
    console.log('Obtendo URL de download...')
    const imageUrl = await getDownloadURL(storageRef)
    console.log('URL obtida:', imageUrl)
    
    // Atualizar o perfil do usuário com a nova URL da imagem
    console.log('Atualizando perfil do usuário...')
    const userRef = doc(db, "users", userId)
    await updateDoc(userRef, {
      photoURL: imageUrl,
      updatedAt: new Date().toISOString()
    })
    console.log('Perfil atualizado com sucesso')

    // Revalidar os dados
    revalidateTag("user")
    revalidateTag(`user-${userId}`)
    revalidateTag("profile")

    return NextResponse.json({
      success: true,
      photoURL: imageUrl
    })
  } catch (error: any) {
    console.error("Error uploading profile image:", {
      error,
      message: error.message,
      code: error.code,
      name: error.name
    })
    return NextResponse.json(
      { 
        error: "Failed to upload profile image",
        details: error.message
      },
      { status: 500 }
    )
  }
}
