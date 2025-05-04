import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Obter URL do vídeo da query
  const { searchParams } = new URL(request.url);
  const videoUrl = searchParams.get('url');
  
  if (!videoUrl) {
    return new NextResponse('URL do vídeo é obrigatória', { 
      status: 400 
    });
  }
  
  try {
    // Fazer fetch do vídeo usando o servidor Next.js (que não tem restrições CORS)
    const response = await fetch(videoUrl, {
      headers: {
        // Simular um navegador para evitar ser bloqueado
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Referer': 'https://naotemchef.com.br/'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar vídeo: ${response.status} ${response.statusText}`);
    }
    
    // Obter o tipo de conteúdo
    const contentType = response.headers.get('content-type') || 'video/mp4';
    
    // Converter a resposta para um array buffer
    const arrayBuffer = await response.arrayBuffer();
    
    // Retornar os dados do vídeo com os cabeçalhos apropriados
    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(arrayBuffer.byteLength),
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  } catch (error) {
    console.error('Erro no proxy de vídeo:', error);
    return new NextResponse(`Erro ao processar o vídeo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, {
      status: 500
    });
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
} 