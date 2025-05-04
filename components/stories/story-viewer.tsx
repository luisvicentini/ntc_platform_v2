"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { ChevronLeft, ChevronRight, X, Volume2, VolumeX, ImageIcon, Film } from "lucide-react"
import { StoryProgressBar } from "./story-progress-bar"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { AvailableEstablishment } from "@/types/establishment"
import { EstablishmentSheet } from "@/components/establishment-sheet"
import { useMediaQuery } from "@/hooks/use-media-query"
import ReactPlayer from "react-player"

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

// Função simplificada para verificar se a URL é válida
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

// Função para processar a URL do vídeo e usar o proxy se necessário
const processVideoUrl = (url: string): string => {
  if (!url) return "";
  
  // Se for URL do Firebase Storage, usar o proxy
  if (url.includes('firebasestorage.googleapis.com')) {
    // Obter a base URL atual
    const baseUrl = typeof window !== 'undefined' 
      ? `${window.location.protocol}//${window.location.host}`
      : '';
    
    // URL encodeada para o proxy - com URL completa
    return `${baseUrl}/api/proxy/video?url=${encodeURIComponent(url)}`;
  }
  
  return url;
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
  // Estados básicos
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialStoryIndex);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [mediaLoading, setMediaLoading] = useState(true);
  const [mediaError, setMediaError] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [showEstablishment, setShowEstablishment] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  
  // Referência para controlar o estado de montagem do componente
  const isMounted = useRef(true);
  const playerRef = useRef<ReactPlayer>(null);
  
  // Verificar se temos stories válidos
  if (!stories || stories.length === 0) {
    return null;
  }
  
  // Obter o story atual
  const currentStory = stories[currentStoryIndex];
  if (!currentStory) {
    useEffect(() => { onClose(); }, []);
    return null;
  }
  
  // Determinar tipo de mídia e URL
  const isVideo = currentStory.mediaType === "video";
  const rawMediaUrl = isValidURL(currentStory.mediaUrl) ? currentStory.mediaUrl : "";
  // Processar URL para vídeos (usar proxy)
  const mediaUrl = isVideo ? processVideoUrl(rawMediaUrl) : rawMediaUrl;
  
  // Obter dados de avatar
  const avatarColorClass = getAvatarColorClass(currentStory.userName);
  const userInitial = currentStory.userName?.charAt(0)?.toUpperCase() || "U";
  
  // Formatação de data
  const formattedTime = formatDistanceToNow(
    typeof currentStory.createdAt === 'object' ? 
      currentStory.createdAt : 
      new Date(currentStory.createdAt), 
    { 
      locale: ptBR,
      addSuffix: true 
    }
  );
  
  // Texto de dias restantes
  const daysRemainingText = (() => {
    if (currentStory.daysRemaining === undefined) return '';
    if (currentStory.daysRemaining === 0) return 'Expira hoje';
    return currentStory.daysRemaining === 1 
      ? 'Expira amanhã' 
      : `Expira em ${currentStory.daysRemaining} dias`;
  })();
  
  // Função para avançar para o próximo story
  const handleNext = useCallback(() => {
    if (!isMounted.current) return;
    
    if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
      setMediaError(false);
      setMediaLoading(true);
    } else {
      onClose();
    }
  }, [currentStoryIndex, stories.length, onClose]);
  
  // Função para voltar ao story anterior
  const handlePrevious = useCallback(() => {
    if (!isMounted.current) return;
    
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
      setMediaError(false);
      setMediaLoading(true);
    }
  }, [currentStoryIndex]);
  
  // Funções para manipular o estabelecimento
  const handleEstablishmentClick = () => {
    setIsPaused(true);
    setShowEstablishment(true);
  };
  
  const handleEstablishmentClose = () => {
    setShowEstablishment(false);
    setIsPaused(false);
  };
  
  // Função para alternar o mudo
  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
  };
  
  // Funções para lidar com erros de mídia
  const handleMediaError = useCallback(() => {
    if (!isMounted.current) return;
    setMediaError(true);
    setMediaLoading(false);
    
    console.error("Erro ao carregar mídia:", {
      id: currentStory.id || 'desconhecido',
      url: mediaUrl || 'desconhecida',
      type: currentStory.mediaType || 'desconhecido'
    });
  }, [currentStory, mediaUrl]);
  
  const handleMediaLoad = useCallback(() => {
    if (!isMounted.current) return;
    setMediaLoading(false);
    setMediaError(false);
  }, []);
  
  const handleAvatarError = useCallback(() => {
    if (!isMounted.current) return;
    setAvatarError(true);
  }, [currentStory.userAvatar]);
  
  // Marcar componente como montado/desmontado
  useEffect(() => {
    isMounted.current = true;
    console.log("StoryViewer montado");
    
    return () => {
      console.log("StoryViewer desmontado");
      isMounted.current = false;
    };
  }, []);
  
  // Resetar estados quando o story muda
  useEffect(() => {
    setMediaError(false);
    setMediaLoading(true);
    setAvatarError(false);
    
    console.log("Mudando para story:", {
      id: currentStory.id,
      mediaType: currentStory.mediaType,
      mediaUrl
    });
    
    // Para imagens, pré-carregar
    if (!isVideo && isValidURL(mediaUrl)) {
      const img = new Image();
      img.onload = () => {
        if (isMounted.current) {
          handleMediaLoad();
        }
      };
      img.onerror = () => {
        if (isMounted.current) {
          handleMediaError();
        }
      };
      img.src = mediaUrl;
    }
  }, [currentStoryIndex, isVideo, mediaUrl, handleMediaLoad, handleMediaError]);
  
  // Navegação via teclado
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
        className="relative w-full h-full md:w-[400px] md:h-[calc(100vh-120px)] md:rounded-xl overflow-hidden bg-zinc-900"
        onClick={() => !isVideo && handleNext()}
      >
        {mediaLoading && (
          // Estado de carregamento
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-900">
            <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        {mediaError || !isValidURL(mediaUrl) ? (
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
          // Vídeo com fallback
          <div className="w-full h-full relative">
            {mediaError ? (
              // Player básico caso o ReactPlayer falhe
              <div className="w-full h-full">
                <video
                  className="w-full h-full object-contain bg-black"
                  src={mediaUrl}
                  controls
                  autoPlay
                  playsInline
                  muted={isMuted}
                  onEnded={handleNext}
                  onLoadStart={() => {
                    console.log("Video nativo - carregando");
                    setMediaLoading(true);
                  }}
                  onPlaying={() => {
                    console.log("Video nativo - reproduzindo");
                    setMediaLoading(false);
                  }}
                  onError={(e) => {
                    console.error("Video nativo - erro:", e.currentTarget.error);
                    setMediaLoading(false);
                  }}
                />
                
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <div className="text-center p-8">
                    <Film className="h-16 w-16 text-white/50 mx-auto mb-4" />
                    <p className="text-white mb-3">
                      Clique para tentar reproduzir o vídeo diretamente
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              // ReactPlayer - player principal
              <ReactPlayer
                ref={playerRef}
                url={mediaUrl}
                width="100%"
                height="100%"
                playing={!isPaused}
                muted={isMuted}
                playsinline
                controls={false}
                onEnded={handleNext}
                onStart={() => {
                  console.log("ReactPlayer - reprodução iniciada");
                  setMediaLoading(false);
                }}
                onPlay={() => {
                  console.log("ReactPlayer - reproduzindo");
                  setMediaLoading(false);
                }}
                onPause={() => setIsPaused(true)}
                onBuffer={() => {
                  console.log("ReactPlayer - buffering");
                  setMediaLoading(true);
                }}
                onBufferEnd={() => {
                  console.log("ReactPlayer - buffer concluído");
                  setMediaLoading(false);
                }}
                onReady={() => {
                  console.log("ReactPlayer - pronto");
                  setMediaLoading(false);
                }}
                onError={(e) => {
                  console.error("ReactPlayer - erro:", e);
                  // Log detalhado para diagnóstico
                  try {
                    console.error("Detalhes do erro:", JSON.stringify(e, null, 2));
                  } catch (err) {
                    console.error("Erro ao serializar detalhes:", err);
                  }
                  handleMediaError();
                }}
                onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                  e.stopPropagation();
                  setIsPaused(!isPaused);
                }}
                config={{
                  file: {
                    attributes: {
                      controlsList: "nodownload",
                      crossOrigin: "anonymous",
                    },
                    forceVideo: true,
                  },
                  youtube: {
                    playerVars: { 
                      modestbranding: 1,
                      playsinline: 1,
                      controls: 0
                    }
                  }
                }}
                style={{ objectFit: "contain", background: "#000" }}
              />
            )}
            
            {/* Overlay quando pausado */}
            {isPaused && !mediaLoading && !mediaError && (
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
          </div>
        ) : (
          // Imagem
          <div className="w-full h-full">
            <img 
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
              e.stopPropagation();
              handleEstablishmentClick();
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
  );
} 