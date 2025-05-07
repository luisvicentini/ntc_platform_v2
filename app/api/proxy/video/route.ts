import { NextRequest, NextResponse } from 'next/server';

export const config = {
  api: {
    responseLimit: false,
    bodyParser: false,
  },
};

export async function GET(request: NextRequest) {
  try {
    // Obter a URL do parâmetro de consulta
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return new NextResponse('URL de vídeo não fornecida', { status: 400 });
    }

    // Verificar se a URL é válida e pertence ao Firebase Storage
    if (!url.includes('firebasestorage.googleapis.com') && 
        !url.includes('storage.googleapis.com')) {
      return new NextResponse('URL não autorizada', { status: 403 });
    }

    // Fazer a requisição para o vídeo original
    const response = await fetch(url, {
      headers: {
        'Range': request.headers.get('Range') || '',
        'If-Range': request.headers.get('If-Range') || '',
      },
    });

    // Se a resposta não for bem-sucedida, retornar o erro
    if (!response.ok && response.status !== 206) {
      console.error(`Erro ao buscar vídeo: ${response.status} - ${response.statusText}`);
      return new NextResponse(`Erro ao buscar vídeo: ${response.status}`, { status: response.status });
    }

    // Obter os headers da resposta original
    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      // Copiar headers relevantes
      if (
        key.toLowerCase() === 'content-type' ||
        key.toLowerCase() === 'content-length' ||
        key.toLowerCase() === 'content-range' ||
        key.toLowerCase() === 'accept-ranges' ||
        key.toLowerCase() === 'cache-control' ||
        key.toLowerCase() === 'etag'
      ) {
        responseHeaders.set(key, value);
      }
    });

    // Definir CORS e headers de cache
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    if (!responseHeaders.has('Cache-Control')) {
      responseHeaders.set('Cache-Control', 'public, max-age=86400'); // Cache por 1 dia
    }

    // Criar stream para a resposta
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    
    // Processar a resposta em chunks
    const reader = response.body?.getReader();
    if (!reader) {
      return new NextResponse('Não foi possível ler o conteúdo do vídeo', { status: 500 });
    }

    // Função para processar os chunks
    async function processStream() {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          await writer.write(value);
        }
      } catch (error) {
        console.error('Erro ao processar stream de vídeo:', error);
      } finally {
        await writer.close();
      }
    }

    // Iniciar processamento em segundo plano
    processStream();

    // Retornar a resposta com o status e headers apropriados
    return new NextResponse(readable, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Erro no proxy de vídeo:', error);
    return new NextResponse('Erro interno ao processar o vídeo', { status: 500 });
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