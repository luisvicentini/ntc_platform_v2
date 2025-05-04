import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Obter URL do vídeo da query
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    
    if (!url) {
      return new NextResponse("URL do vídeo é obrigatória", {
        status: 400,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
    
    // Extrair extensão do arquivo
    const getFileExtension = (url: string): string => {
      try {
        const pathname = new URL(url).pathname;
        const lastDotIndex = pathname.lastIndexOf('.');
        if (lastDotIndex === -1) return '';
        return pathname.substring(lastDotIndex + 1).toLowerCase();
      } catch (e) {
        const lastDotIndex = url.lastIndexOf('.');
        if (lastDotIndex === -1) return '';
        return url.substring(lastDotIndex + 1).toLowerCase();
      }
    };
    
    // Determinar o tipo MIME com base na extensão
    const getMimeType = (url: string): string => {
      const ext = getFileExtension(url);
      switch (ext) {
        case 'mp4': return 'video/mp4';
        case 'webm': return 'video/webm';
        case 'ogg': return 'video/ogg';
        case 'mov': return 'video/quicktime';
        case 'm4v': return 'video/mp4';
        default: return 'video/mp4';
      }
    };
    
    // Gerar HTML para reprodução
    const html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reprodutor de Vídeo</title>
        <style>
          body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; background: #000; }
          .video-container {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
          }
          video {
            max-width: 100%;
            max-height: 100%;
            width: auto;
            height: auto;
            object-fit: contain;
          }
          .error {
            color: white;
            text-align: center;
            font-family: sans-serif;
            padding: 20px;
          }
          .fallback-player {
            width: 100%;
            height: 100%;
            position: absolute;
            top: 0;
            left: 0;
          }
        </style>
      </head>
      <body>
        <div class="video-container">
          <!-- Player primário -->
          <video id="videoPlayer" autoplay muted playsinline>
            <source src="${url}" type="${getMimeType(url)}">
            <!-- Sources alternativas com extensões diferentes -->
            <source src="${url.replace(/\.[^.]+$/, '.mp4')}" type="video/mp4">
            <source src="${url.replace(/\.[^.]+$/, '.webm')}" type="video/webm">
            <!-- Conteúdo exibido se o vídeo não puder ser reproduzido -->
            <div class="error">
              Não foi possível reproduzir este vídeo.
            </div>
          </video>
          
          <!-- Fallback para iframe com embed.ly ou outro serviço -->
          <div id="fallbackContainer" style="display: none;">
            <iframe 
              id="fallbackPlayer"
              class="fallback-player"
              frameborder="0"
              allowfullscreen
            ></iframe>
          </div>
        </div>
        
        <script>
          // Função para tentar reproduzir o vídeo
          document.addEventListener('DOMContentLoaded', function() {
            const video = document.getElementById('videoPlayer');
            const fallbackContainer = document.getElementById('fallbackContainer');
            const fallbackPlayer = document.getElementById('fallbackPlayer');
            
            // Tentar reproduzir o vídeo
            const playPromise = video.play();
            
            if (playPromise !== undefined) {
              playPromise.catch(error => {
                console.error('Erro ao reproduzir vídeo:', error);
                
                // Tentar métodos alternativos
                fallbackContainer.style.display = 'block';
                
                // Tentar embed.ly como último recurso
                const videoUrl = encodeURIComponent('${url}');
                fallbackPlayer.src = \`https://cdn.embedly.com/widgets/media.html?src=\${videoUrl}&dntp=1\`;
                
                // Se falhar embedly, tentar vídeos locais
                fallbackPlayer.onerror = function() {
                  fallbackPlayer.src = '/videos/fallback-video.mp4';
                };
              });
            }
          });
        </script>
      </body>
      </html>
    `;
    
    // Retornar HTML
    return new NextResponse(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });
  } catch (error: any) {
    console.error("Erro ao gerar player de vídeo:", error);
    
    // Retornar erro
    return new NextResponse(`Erro: ${error.message}`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
} 