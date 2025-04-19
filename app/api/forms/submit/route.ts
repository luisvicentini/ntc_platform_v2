import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Aqui você pode adicionar a lógica para salvar os dados no seu banco de dados
    // Por exemplo, usando o Supabase ou Firebase
    
    // Por enquanto, vamos apenas retornar sucesso
    return NextResponse.json({ 
      success: true, 
      message: 'Formulário enviado com sucesso' 
    })
    
  } catch (error) {
    console.error('Erro ao processar formulário:', error)
    return NextResponse.json(
      { error: 'Erro ao processar formulário' },
      { status: 500 }
    )
  }
} 