"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { ChevronLeft, ChevronRight, X, Volume2, VolumeX, ImageIcon, Film } from "lucide-react"
import { StoryProgressBar } from "./story-progress-bar"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { AvailableEstablishment } from "@/types/establishment"
import { EstablishmentSheet } from "@/components/establishment-sheet"
import { useMediaQuery } from "@/hooks/use-media-query"

// Objeto com cores para as letras do alfabeto
const avatarColors = {
  A: "bg-red-500 text-white",     // Vermelho
  B: "bg-blue-500 text-white",    // Azul
  C: "bg-green-500 text-white",   // Verde
  D: "bg-yellow-500 text-black",  // Amarelo
  E: "bg-purple-500 text-white",  // Roxo
  F: "bg-pink-500 text-white",    // Rosa
  G: "bg-indigo-500 text-white",  // Índigo
  H: "bg-orange-500 text-white",  // Laranja
  I: "bg-teal-500 text-white",    // Teal
  J: "bg-red-500 text-white",     // Vermelho
  K: "bg-blue-500 text-white",    // Azul
  L: "bg-green-500 text-white",   // Verde
  M: "bg-yellow-500 text-black",  // Amarelo
  N: "bg-purple-500 text-white",  // Roxo
  O: "bg-pink-500 text-white",    // Rosa
  P: "bg-indigo-500 text-white",  // Índigo
  Q: "bg-orange-500 text-white",  // Laranja
  R: "bg-teal-500 text-white",    // Teal
  S: "bg-cyan-500 text-white",    // Ciano
  T: "bg-lime-500 text-black",    // Lima
  U: "bg-red-500 text-white",     // Vermelho
  V: "bg-blue-500 text-white",    // Azul
  W: "bg-green-500 text-white",   // Verde
  X: "bg-yellow-500 text-black",  // Amarelo
  Y: "bg-purple-500 text-white",  // Roxo
  Z: "bg-pink-500 text-white",    // Rosa
};

// Função para obter a classe de cor com base na primeira letra do nome
const getAvatarColorClass = (name: string | undefined | null): string => {
  if (!name) return "bg-zinc-500 text-white"; // Cor padrão
  const firstChar = name.charAt(0).toUpperCase() as keyof typeof avatarColors;
  return avatarColors[firstChar] || "bg-zinc-500 text-white"; // Retorna a cor correspondente ou a cor padrão
};

// Função para verificar se a URL parece válida
const isValidURL = (url: string): boolean => {
  if (!url) return false;
  if (url === 'undefined' || url === 'null') return false;
  return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:');
};

// Função para extrair a extensão de uma URL
const getFileExtension = (url: string): string => {
  if (!url) return '';
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

// Função para determinar o tipo MIME com base na extensão do arquivo
const getMimeType = (url: string): string => {
  const ext = getFileExtension(url);
  switch (ext) {
    case 'mp4':
      return 'video/mp4';
    case 'webm':
      return 'video/webm';
    case 'ogg':
      return 'video/ogg';
    case 'mov':
      return 'video/quicktime';
    case 'm4v':
      return 'video/mp4';
    case 'avi':
      return 'video/x-msvideo';
    case '3gp':
      return 'video/3gpp';
    case 'wmv':
      return 'video/x-ms-wmv';
    case 'ts':
      return 'video/mp2t';
    case 'flv':
      return 'video/x-flv';
    default:
      return 'video/mp4'; // Default fallback
  }
};

// Função para adicionar um parâmetro de cache à URL
// Mas evita gerar novas versões para não causar loops
const addCacheParam = (url: string, storyId: string): string => {
  if (!isValidURL(url)) return url;
  
  // Usar o ID do story como parte do parâmetro de cache
  // Em vez de usar um timestamp aleatório
  return url.includes('?') ? `${url}&_cache=${storyId}` : `${url}?_cache=${storyId}`;
};

export interface Story {
  id: string
  userId: string
  userName: string
  userAvatar: string
  mediaUrl: string
  mediaType: "image" | "video"
  createdAt: Date
  expiresAt?: Date
  durationDays?: number
  daysRemaining?: number
  linkedEstablishment?: AvailableEstablishment | null
}

interface StoryViewerProps {
  stories: Story[]
  initialStoryIndex: number
  onClose: () => void
}

export function StoryViewer({ 
  stories, 
  initialStoryIndex = 0, 
  onClose 
}: StoryViewerProps) {
  // Verificar se há stories antes de qualquer processamento
  if (!stories || stories.length === 0) {
    console.warn("StoryViewer: Não há stories para exibir");
    return null; // Retorna nulo se não houver stories para evitar erros
  }

  const [currentStoryIndex, setCurrentStoryIndex] = useState(
    initialStoryIndex >= 0 && initialStoryIndex < stories.length ? initialStoryIndex : 0
  );
  const [isPaused, setIsPaused] = useState(false);
  const [showEstablishment, setShowEstablishment] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [mediaError, setMediaError] = useState(false);
  const [mediaLoading, setMediaLoading] = useState(true);
  const [avatarError, setAvatarError] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const videoRef = useRef<HTMLVideoElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  
  // Referência para controlar se o componente está montado
  const isMounted = useRef(true);

  const [videoAttempts, setVideoAttempts] = useState(0);
  const [videoPlaybackFailed, setVideoPlaybackFailed] = useState(false);
  const [useIframePlayer, setUseIframePlayer] = useState(false);

  // Garantir que temos um story válido antes de continuar
  if (currentStoryIndex >= stories.length) {
    console.error("Índice de story inválido:", currentStoryIndex, "Total de stories:", stories.length);
    useEffect(() => {
      onClose();
    }, []);
    return null;
  }

  const currentStory = stories[currentStoryIndex];
  
  // Verificar se o story atual existe
  if (!currentStory) {
    console.error("Story atual é indefinido");
    useEffect(() => {
      onClose();
    }, []);
    return null;
  }

  const isVideo = currentStory.mediaType === "video";
  
  // Use o ID do story para o parâmetro de cache em vez de um timestamp que muda continuamente
  const mediaUrl = isValidURL(currentStory.mediaUrl) 
    ? addCacheParam(currentStory.mediaUrl, currentStory.id)
    : "";
  
  // Obter a classe de cor com base no nome do usuário
  const avatarColorClass = getAvatarColorClass(currentStory.userName);
  const userInitial = currentStory.userName?.charAt(0)?.toUpperCase() || "U";
  
  // Log para debug dos stories - apenas na primeira renderização deste story
  useEffect(() => {
    // Verifica se a URL é uma URL de placeholder
    const isPlaceholderUrl = currentStory.mediaUrl.includes('placehold.co') || 
                             currentStory.mediaUrl.includes('placeholder');
    
    console.log("StoryViewer - Story atual:", {
      id: currentStory.id,
      index: currentStoryIndex,
      url: currentStory.mediaUrl,
      isPlaceholder: isPlaceholderUrl,
      type: currentStory.mediaType,
      totalStories: stories.length
    });
    
    // Se for placeholder, podemos mostrar um aviso
    if (isPlaceholderUrl) {
      console.warn("ATENÇÃO: Este story está usando uma URL de placeholder em vez da URL real da mídia.");
      console.warn("Isso pode ocorrer quando houve um erro no upload para o Firebase Storage.");
    }
  }, [currentStoryIndex]); // Dependência apenas do índice do story, não da URL completa
  
  // Formatar a data para "há X tempo atrás"
  const formattedTime = formatDistanceToNow(
    typeof currentStory.createdAt === 'object' ? 
      currentStory.createdAt : 
      new Date(currentStory.createdAt), 
    { 
      locale: ptBR,
      addSuffix: true 
    }
  );
  
  // Preparar string de dias restantes
  const daysRemainingText = (() => {
    if (currentStory.daysRemaining === undefined) return '';
    if (currentStory.daysRemaining === 0) return 'Expira hoje';
    return currentStory.daysRemaining === 1 
      ? 'Expira amanhã' 
      : `Expira em ${currentStory.daysRemaining} dias`;
  })();
  
  // Função para avançar ao próximo story com verificações de segurança
  const handleNext = useCallback(() => {
    // Usar setTimeout para evitar o erro de update durante render
    setTimeout(() => {
      if (!isMounted.current) return;
      
      if (currentStoryIndex < stories.length - 1) {
        setCurrentStoryIndex(prev => prev + 1);
        setMediaError(false);
        setMediaLoading(true);
        setAvatarError(false);
      } else {
        onClose();
      }
    }, 0);
  }, [currentStoryIndex, stories.length, onClose]);
  
  // Função para voltar ao story anterior com verificações de segurança
  const handlePrevious = useCallback(() => {
    // Usar setTimeout para evitar o erro de update durante render
    setTimeout(() => {
      if (!isMounted.current) return;
      
      if (currentStoryIndex > 0) {
        setCurrentStoryIndex(prev => prev - 1);
        setMediaError(false);
        setMediaLoading(true);
        setAvatarError(false);
      }
    }, 0);
  }, [currentStoryIndex]);
  
  const handleEstablishmentClick = () => {
    setIsPaused(true);
    setShowEstablishment(true);
  };
  
  const handleEstablishmentClose = () => {
    setShowEstablishment(false);
    setIsPaused(false);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  };
  
  const handleMediaError = useCallback(() => {
    if (!isMounted.current) return;
    
    // Log detalhado para ajudar na depuração
    console.error("Erro ao carregar mídia:", {
      id: currentStory.id,
      url: mediaUrl,
      type: currentStory.mediaType,
      videoElement: isVideo ? {
        error: videoRef.current?.error ? {
          code: videoRef.current.error.code,
          message: videoRef.current.error.message
        } : 'Sem erro reportado',
        networkState: videoRef.current?.networkState,
        readyState: videoRef.current?.readyState
      } : 'Não é vídeo'
    });
    
    if (isVideo) {
      // Marcar como falha apenas após várias tentativas
      if (videoAttempts >= 2) {
        // Tentar usar o player de iframe como última opção
        if (!useIframePlayer) {
          console.log("Tentando usar player de iframe como último recurso");
          setUseIframePlayer(true);
          setVideoAttempts(0);
          return;
        }
        
        setVideoPlaybackFailed(true);
        setMediaError(true);
      } else {
        // Incrementar contador de tentativas
        setVideoAttempts(prev => prev + 1);
        
        // Tentar carregar novamente após um breve atraso
        setTimeout(() => {
          if (isMounted.current && videoRef.current) {
            console.log(`Tentativa ${videoAttempts + 1} de reproduzir o vídeo`);
            try {
              videoRef.current.load();
            } catch (e) {
              console.error("Erro ao recarregar vídeo:", e);
              setMediaError(true);
            }
          }
        }, 1000);
        
        return; // Não definir erro ainda
      }
    } else {
      setMediaError(true);
    }
    
    setMediaLoading(false);
  }, [currentStory, mediaUrl, isVideo, videoAttempts, useIframePlayer]);
  
  const handleMediaLoad = useCallback(() => {
    if (!isMounted.current) return;
    
    console.log(`Mídia carregada com sucesso (${currentStory.mediaType}):`, mediaUrl);
    setMediaLoading(false);
    setMediaError(false);
  }, [currentStory.mediaType, mediaUrl]);
  
  const handleAvatarError = useCallback(() => {
    if (!isMounted.current) return;
    
    console.error("Erro ao carregar avatar:", currentStory.userAvatar);
    setAvatarError(true);
  }, [currentStory.userAvatar]);
  
  // Marcar componente como desmontado quando for destruído
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Carregar imagem uma vez quando o componente montar ou quando mudar de story
  useEffect(() => {
    if (isVideo || !isValidURL(mediaUrl)) return;
    
    // Definir carregando apenas se estiver montado
    if (isMounted.current) {
      setMediaLoading(true);
    }
    
    // Esta flag evita atualizações de estado após desmontagem
    let isEffectActive = true;
    
    // Pré-carregar a imagem
    const img = new Image();
    img.onload = () => {
      if (isEffectActive && isMounted.current) {
        setMediaLoading(false);
        setMediaError(false);
      }
    };
    img.onerror = () => {
      if (isEffectActive && isMounted.current) {
        setMediaLoading(false);
        setMediaError(true);
      }
    };
    img.src = mediaUrl;
    
    return () => {
      // Limpar event listeners e marcar efeito como inativo
      img.onload = null;
      img.onerror = null;
      isEffectActive = false;
    };
  }, [currentStoryIndex, isVideo, mediaUrl]); // Removi mediaUrl da dependência para evitar loops
  
  // Resetar contadores quando mudar de story
  useEffect(() => {
    setVideoAttempts(0);
    setVideoPlaybackFailed(false);
    setMediaError(false);
    setMediaLoading(true);
    setUseIframePlayer(false);
    
    // Log de diagnóstico para arquivos de vídeo
    if (stories[currentStoryIndex]?.mediaType === 'video') {
      const videoUrl = stories[currentStoryIndex].mediaUrl;
      console.log("Diagnóstico de vídeo:", {
        url: videoUrl,
        fileExtension: getFileExtension(videoUrl),
        mimeType: getMimeType(videoUrl),
        hasValidExtension: ['mp4', 'webm', 'ogg', 'mov', 'm4v'].includes(getFileExtension(videoUrl))
      });
    }
  }, [currentStoryIndex, stories]);

  // Efeito para reiniciar vídeo quando mudar de story
  useEffect(() => {
    if (isVideo && videoRef.current) {
      // Resetar configurações antes de carregar novo vídeo
      videoRef.current.currentTime = 0;
      videoRef.current.muted = isMuted;
      
      // Certifique-se de que a fonte é válida antes de tentar carregar
      if (isValidURL(mediaUrl)) {
        console.log(`Tentando carregar vídeo (tentativa ${videoAttempts + 1}):`, mediaUrl);
        
        try {
          // Forçar recarregamento do vídeo
          videoRef.current.load();
          
          // Adicionar um evento de um único uso para detectar quando o vídeo estiver pronto
          const onCanPlay = () => {
            if (videoRef.current && isMounted.current) {
              console.log("Vídeo pronto para reprodução:", mediaUrl);
              
              // Tentar iniciar a reprodução após confirmação de que está pronto
              videoRef.current.play()
                .then(() => {
                  console.log("Reprodução iniciada com sucesso");
                  setMediaLoading(false);
                })
                .catch(err => {
                  console.error("Erro ao iniciar reprodução:", err);
                  
                  // Tentar novamente com mudo ativado (pode contornar restrições de autoplay)
                  if (!isMuted && videoRef.current) {
                    console.log("Tentando reproduzir novamente com mudo ativado");
                    videoRef.current.muted = true;
                    setIsMuted(true);
                    videoRef.current.play()
                      .then(() => {
                        console.log("Reprodução iniciada com sucesso (mudo)");
                        setMediaLoading(false);
                      })
                      .catch(err2 => {
                        console.error("Falha na segunda tentativa:", err2);
                        handleMediaError();
                      });
                  } else {
                    handleMediaError();
                  }
                });
            }
            
            // Remover o ouvinte após uso
            videoRef.current?.removeEventListener('canplay', onCanPlay);
          };
          
          videoRef.current.addEventListener('canplay', onCanPlay, { once: true });
          
          // Timeout de segurança - se o vídeo não carregar em 8 segundos, mostrar erro
          const timeoutId = setTimeout(() => {
            if (isMounted.current && mediaLoading) {
              console.warn("Timeout no carregamento do vídeo:", mediaUrl);
              handleMediaError();
            }
          }, 8000);
          
          return () => clearTimeout(timeoutId);
        } catch (err) {
          console.error("Erro ao manipular o elemento de vídeo:", err);
          setMediaError(true);
          setMediaLoading(false);
        }
      } else {
        console.error("URL de vídeo inválida:", mediaUrl);
        setMediaError(true);
        setMediaLoading(false);
      }
    }
    
    // Resetar o estado de erro do avatar quando mudar de story
    if (isMounted.current) {
      setAvatarError(false);
    }
  }, [currentStoryIndex, isVideo, mediaUrl, isMuted, videoAttempts, handleMediaError, mediaLoading]);
  
  // Manipuladores de eventos para navegação via teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrevious();
      } else if (e.key === "Escape") {
        onClose();
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrevious, onClose]);
  
  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
      {/* Botão de fechar */}
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 z-20 text-white p-2 hover:bg-white/10 rounded-full"
      >
        <X className="h-6 w-6" />
      </button>
      
      {/* Barra de progresso superior */}
      <div className="absolute top-0 left-0 right-0 p-4 z-10">
        <StoryProgressBar 
          count={stories.length}
          currentIndex={currentStoryIndex}
          duration={isVideo ? 0 : 5000} // Se for vídeo, usar a duração do vídeo
          onComplete={handleNext}
          isPaused={isPaused || mediaLoading}
        />
      </div>
      
      {/* Informações do usuário */}
      <div className="absolute top-12 left-4 z-10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white">
          {avatarError || !isValidURL(currentStory.userAvatar) ? (
            <div className={`w-full h-full flex items-center justify-center font-medium ${avatarColorClass}`}>
              {userInitial}
            </div>
          ) : (
            <img 
              src={currentStory.userAvatar} 
              alt={currentStory.userName}
              className="w-full h-full object-cover"
              onError={handleAvatarError}
            />
          )}
        </div>
        <div className="text-white">
          <p className="font-medium text-sm">{currentStory.userName}</p>
          <div className="flex items-center gap-2">
            <p className="text-xs opacity-75">{formattedTime}</p>
            {daysRemainingText && (
              <>
                <span className="text-xs opacity-50">•</span>
                <p className="text-xs opacity-75">{daysRemainingText}</p>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Conteúdo do Story */}
      <div 
        className="relative w-full h-full md:w-[400px] md:h-[calc(100vh-120px)] md:rounded-xl overflow-hidden"
        onClick={() => !isVideo && handleNext()}
      >
        {mediaLoading ? (
          // Estado de carregamento
          <div className="w-full h-full flex items-center justify-center bg-zinc-900">
            <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : mediaError || !isValidURL(mediaUrl) ? (
          // Estado de erro na mídia
          <div className="w-full h-full flex items-center justify-center bg-zinc-900">
            <div className="text-center p-8">
              <ImageIcon className="h-16 w-16 text-white/50 mx-auto mb-4" />
              <p className="text-white mb-3">Não foi possível carregar a mídia</p>
              <button 
                onClick={handleNext}
                className="bg-white/10 text-white px-4 py-2 rounded-lg"
              >
                Próximo
              </button>
            </div>
          </div>
        ) : isVideo ? (
          // Vídeo
          <div className="w-full h-full bg-zinc-900 relative">
            {videoPlaybackFailed ? (
              // Alternativa quando a reprodução falha completamente
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                <div className="bg-black/50 p-6 rounded-xl text-center max-w-[400px]">
                  <Film className="h-12 w-12 text-white/70 mx-auto mb-3" />
                  <p className="text-white mb-4">Não foi possível reproduzir este vídeo</p>
                  <p className="text-white/70 text-sm mb-4">
                    O vídeo pode estar em um formato não suportado ou houve um problema de conexão.
                  </p>
                  <button 
                    onClick={handleNext}
                    className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Pular para o próximo
                  </button>
                </div>
              </div>
            ) : useIframePlayer ? (
              // Player alternativo baseado em iframe como último recurso
              <div className="w-full h-full bg-black flex items-center justify-center">
                <iframe 
                  src={`/api/video-player?url=${encodeURIComponent(mediaUrl)}`}
                  className="w-full h-full"
                  allow="autoplay; encrypted-media; fullscreen"
                  allowFullScreen
                  loading="eager"
                  onLoad={() => {
                    if (isMounted.current) {
                      console.log("Iframe de vídeo carregado");
                      setMediaLoading(false);
                    }
                  }}
                  onError={() => {
                    if (isMounted.current) {
                      console.error("Erro ao carregar iframe de vídeo");
                      setVideoPlaybackFailed(true);
                    }
                  }}
                />
              </div>
            ) : (
              <>
                {/* Vídeo primário com múltiplas sources para melhor compatibilidade */}
                <video
                  ref={videoRef}
                  className="w-full h-full object-contain"
                  onEnded={handleNext}
                  autoPlay
                  muted={isMuted}
                  playsInline
                  controls={false}
                  controlsList="nodownload noremoteplayback"
                  crossOrigin="anonymous"
                  loop={false}
                  preload="auto"
                  poster={isValidURL(mediaUrl) ? mediaUrl.replace(/\.(mp4|mov|webm|ogg)$/i, '.jpg') : undefined}
                  onLoadStart={() => {
                    console.log("Vídeo - início do carregamento:", mediaUrl);
                    if (isMounted.current) setMediaLoading(true);
                  }}
                  onLoadedData={() => {
                    if (isMounted.current) {
                      console.log("Vídeo - dados carregados:", mediaUrl);
                    }
                  }}
                  onCanPlay={() => {
                    if (isMounted.current) {
                      console.log("Vídeo - pode reproduzir:", mediaUrl);
                    }
                  }}
                  onPlaying={() => {
                    if (isMounted.current) {
                      console.log("Vídeo - reproduzindo:", mediaUrl);
                      setMediaLoading(false);
                    }
                  }}
                  onWaiting={() => {
                    if (isMounted.current) {
                      console.log("Vídeo - aguardando buffer:", mediaUrl);
                      setMediaLoading(true);
                    }
                  }}
                  onError={handleMediaError}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Pausar/reproduzir ao clicar no vídeo
                    if (videoRef.current) {
                      if (videoRef.current.paused) {
                        videoRef.current.play()
                          .catch(err => console.error("Erro ao retomar vídeo:", err));
                        setIsPaused(false);
                      } else {
                        videoRef.current.pause();
                        setIsPaused(true);
                      }
                    }
                  }}
                >
                  {/* Múltiplas sources para melhor compatibilidade */}
                  <source src={mediaUrl} type={getMimeType(mediaUrl)} />
                  {/* Adicionar source alternativa para MP4 se a extensão original não for MP4 */}
                  {getFileExtension(mediaUrl) !== 'mp4' && (
                    <source src={mediaUrl.replace(/\.[^.]+$/, '.mp4')} type="video/mp4" />
                  )}
                  {/* Adicionar source alternativa para WEBM se a extensão original não for WEBM */}
                  {getFileExtension(mediaUrl) !== 'webm' && (
                    <source src={mediaUrl.replace(/\.[^.]+$/, '.webm')} type="video/webm" />
                  )}
                  Seu navegador não suporta a reprodução deste vídeo.
                </video>
                
                {/* Overlay quando pausado */}
                {isPaused && !mediaLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="bg-white/20 p-4 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    </div>
                  </div>
                )}
                
                {/* Botão de mudo/som */}
                <button 
                  onClick={toggleMute}
                  className="absolute bottom-5 right-5 z-10 bg-black/30 p-2 rounded-full"
                >
                  {isMuted ? (
                    <VolumeX className="h-5 w-5 text-white" />
                  ) : (
                    <Volume2 className="h-5 w-5 text-white" />
                  )}
                </button>
              </>
            )}
          </div>
        ) : (
          // Imagem
          <div className="w-full h-full bg-zinc-900">
            <img 
              ref={imgRef}
              src={mediaUrl} 
              alt={`Story de ${currentStory.userName}`}
              className="w-full h-full object-contain"
              onLoad={handleMediaLoad}
              onError={handleMediaError}
            />
          </div>
        )}
        
        {/* Estabelecimento vinculado (card) */}
        {currentStory.linkedEstablishment && (
          <div 
            className="absolute bottom-6 left-0 right-0 px-4"
            onClick={(e) => {
              e.stopPropagation()
              handleEstablishmentClick()
            }}
          >
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 flex items-center gap-3 border border-white/20">
              <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                <img 
                  src={currentStory.linkedEstablishment.images && currentStory.linkedEstablishment.images.length > 0 
                    ? currentStory.linkedEstablishment.images[0] 
                    : "/placeholder.svg"
                  } 
                  alt={currentStory.linkedEstablishment.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error("Erro ao carregar imagem do estabelecimento");
                    (e.target as HTMLImageElement).src = "/placeholder.svg";
                  }}
                />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">{currentStory.linkedEstablishment.name}</p>
                <p className="text-white/70 text-sm">
                  {currentStory.linkedEstablishment.type?.type || ""} 
                  {currentStory.linkedEstablishment.address?.city && (
                    <>
                      {" • "}
                      {currentStory.linkedEstablishment.address.city}
                    </>
                  )}
                </p>
                <p className="text-emerald-400 text-sm mt-1">Ver cupom</p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Botões de navegação (apenas desktop) */}
      {isDesktop && (
        <>
          <button 
            onClick={handlePrevious}
            disabled={currentStoryIndex === 0}
            className="absolute left-8 top-1/2 -translate-y-1/2 z-10 text-white p-3 rounded-full bg-black/30 hover:bg-black/50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          
          <button 
            onClick={handleNext}
            className="absolute right-8 top-1/2 -translate-y-1/2 z-10 text-white p-3 rounded-full bg-black/30 hover:bg-black/50"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}
      
      {/* Sheet do estabelecimento */}
      {currentStory.linkedEstablishment && showEstablishment && (
        <EstablishmentSheet
          establishment={{
            ...currentStory.linkedEstablishment,
            // Garantir que rating exista (o principal erro)
            rating: typeof currentStory.linkedEstablishment.rating === 'number' ? currentStory.linkedEstablishment.rating : 0,
            // Garantir que o phone esteja no formato correto
            phone: {
              ddi: "55", // Valor padrão para Brasil
              phone: typeof currentStory.linkedEstablishment.phone === 'object' 
                ? currentStory.linkedEstablishment.phone.phone || '' 
                : String(currentStory.linkedEstablishment.phone || '')
            },
            // Garantir que address tenha todas as propriedades necessárias
            address: {
              cep: currentStory.linkedEstablishment.address?.cep || '',
              street: currentStory.linkedEstablishment.address?.street || '',
              number: currentStory.linkedEstablishment.address?.number || '',
              complement: currentStory.linkedEstablishment.address?.complement || '',
              neighborhood: currentStory.linkedEstablishment.address?.neighborhood || '',
              city: currentStory.linkedEstablishment.address?.city || '',
              state: currentStory.linkedEstablishment.address?.state || ''
            },
            // Garantir que type tenha as propriedades necessárias
            type: {
              type: currentStory.linkedEstablishment.type?.type || "Sem categoria",
              category: currentStory.linkedEstablishment.type?.category || "Sem categoria"
            },
            // Garantir outros campos obrigatórios
            totalRatings: currentStory.linkedEstablishment.totalRatings || 0,
            isFeatured: !!currentStory.linkedEstablishment.isFeatured,
            status: currentStory.linkedEstablishment.status || "active",
            createdAt: currentStory.linkedEstablishment.createdAt || new Date().toISOString(),
            updatedAt: currentStory.linkedEstablishment.updatedAt || new Date().toISOString(),
            // Garantir a propriedade subscription
            subscription: currentStory.linkedEstablishment.subscription || {
              partnerId: currentStory.linkedEstablishment.partnerId
            },
            // Garantir que images seja um array
            images: Array.isArray(currentStory.linkedEstablishment.images) 
              ? currentStory.linkedEstablishment.images 
              : [],
            // Campos adicionais que podem estar faltando
            voucherAvailability: currentStory.linkedEstablishment.voucherAvailability || "unlimited",
            voucherQuantity: currentStory.linkedEstablishment.voucherQuantity || 0,
            voucherCooldown: currentStory.linkedEstablishment.voucherCooldown || 0,
            voucherExpiration: currentStory.linkedEstablishment.voucherExpiration || 0,
          }}
          isOpen={showEstablishment}
          onClose={handleEstablishmentClose}
        />
      )}
    </div>
  )
} 