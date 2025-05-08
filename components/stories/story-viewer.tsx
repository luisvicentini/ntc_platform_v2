"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { ChevronLeft, ChevronRight, X, Volume2, VolumeX, ImageIcon, Film, ThumbsUp, ThumbsDown, Heart, Flame, Trash2 } from "lucide-react"
import { StoryProgressBar } from "./story-progress-bar"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { AvailableEstablishment } from "@/types/establishment"
import { EstablishmentSheet } from "@/components/establishment-sheet"
import { useMediaQuery } from "@/hooks/use-media-query"
import ReactPlayer from "react-player"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

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
  reactions?: {
    likes?: number
    dislikes?: number
    hearts?: number
    fires?: number
  }
  userReaction?: 'like' | 'dislike' | 'heart' | 'fire' | null
}

interface StoryViewerProps {
  stories: Story[]
  initialStoryIndex: number
  onClose: () => void
  onRemoveStory?: (storyId: string) => void
}

export function StoryViewer({ 
  stories, 
  initialStoryIndex = 0, 
  onClose,
  onRemoveStory
}: StoryViewerProps) {
  // Garantir que stories é um array válido
  const validStories = Array.isArray(stories) ? stories : [];
  const safeInitialIndex = initialStoryIndex < validStories.length ? initialStoryIndex : 0;
  
  // 1. TODOS OS USESTATES PRIMEIRO
  // Estados básicos
  const [currentStoryIndex, setCurrentStoryIndex] = useState(safeInitialIndex);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [mediaLoading, setMediaLoading] = useState(true);
  const [mediaError, setMediaError] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [showEstablishment, setShowEstablishment] = useState(false);
  const [userReactions, setUserReactions] = useState<Record<string, string>>({});
  const [isReacting, setIsReacting] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoProgress, setVideoProgress] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  
  // 2. TODOS OS USECONTEXTS
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { user } = useAuth();
  
  // 3. TODOS OS USEREFS
  // Referências para elementos DOM e estado
  const isMounted = useRef(true);
  const playerRef = useRef<ReactPlayer>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);
  
  // Verificar se temos stories válidos - não interrompa o fluxo de hooks
  const hasValidStories = validStories.length > 0;
  const currentStory = hasValidStories ? validStories[currentStoryIndex] : null;
  
  // 4. DADOS DERIVADOS (não são hooks, então vêm depois dos hooks)
  // Determinar tipo de mídia e URL com validação
  const isVideo = currentStory?.mediaType === "video";
  const rawMediaUrl = currentStory && isValidURL(currentStory.mediaUrl) ? currentStory.mediaUrl : "";
  // Processar URL para vídeos (usar proxy)
  const mediaUrl = isVideo ? processVideoUrl(rawMediaUrl) : rawMediaUrl;
  
  // Criar uma referência local para as contagens de reações que pode ser atualizada imediatamente
  const [localReactions, setLocalReactions] = useState<Record<string, number>>({});
  
  // Usar o useEffect para atualizar localReactions quando o story muda
  useEffect(() => {
    if (currentStory?.reactions) {
      setLocalReactions({
        likes: currentStory.reactions.likes || 0,
        dislikes: currentStory.reactions.dislikes || 0,
        hearts: currentStory.reactions.hearts || 0,
        fires: currentStory.reactions.fires || 0
      });
    }
  }, [currentStoryIndex, currentStory?.reactions]);
  
  // Obter dados de avatar com validação
  const avatarColorClass = getAvatarColorClass(currentStory?.userName);
  const userInitial = currentStory?.userName?.charAt(0)?.toUpperCase() || "U";
  
  // Formatação de data com validação
  const formattedTime = formatDistanceToNow(
    currentStory?.createdAt && typeof currentStory.createdAt === 'object' ? 
      currentStory.createdAt : 
      new Date(currentStory?.createdAt || Date.now()), 
    { 
      locale: ptBR,
      addSuffix: true 
    }
  );
  
  // Texto de dias restantes com validação
  const daysRemainingText = (() => {
    if (!currentStory || currentStory.daysRemaining === undefined) return '';
    if (currentStory.daysRemaining === 0) return 'Expira hoje';
    return currentStory.daysRemaining === 1 
      ? 'Expira amanhã' 
      : `Expira em ${currentStory.daysRemaining} dias`;
  })();
  
  // 5. TODOS OS USEEFFECTS NO MESMO LUGAR
  // Verificar se tem stories válidos e fechar se não tiver
  useEffect(() => {
    if (!hasValidStories) {
      onClose();
    }
  }, [hasValidStories, onClose]);
  
  // Marcar componente como montado/desmontado
  useEffect(() => {
    isMounted.current = true;
    console.log("StoryViewer montado");
    
    return () => {
      console.log("StoryViewer desmontado");
      isMounted.current = false;
    };
  }, []);
  
  // Navegação via teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isMounted.current) return;
      
      if (e.key === "ArrowRight") {
        if (currentStoryIndex < validStories.length - 1) {
          setCurrentStoryIndex(prev => prev + 1);
          setMediaError(false);
          setMediaLoading(true);
        } else {
          onClose();
        }
      } else if (e.key === "ArrowLeft") {
        if (currentStoryIndex > 0) {
          setCurrentStoryIndex(prev => prev - 1);
          setMediaError(false);
          setMediaLoading(true);
        }
      } else if (e.key === "Escape") {
        onClose();
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentStoryIndex, validStories.length, onClose]);
  
  // 6. TODOS OS USECALLBACKS - reorganizados para evitar problemas de ordem
  // Funções para lidar com erros de mídia - mover para antes de serem usadas
  const handleMediaLoad = useCallback(() => {
    if (!isMounted.current) return;
    setMediaLoading(false);
    setMediaError(false);
  }, []);
  
  const handleMediaError = useCallback(() => {
    if (!isMounted.current) return;
    setMediaError(true);
    setMediaLoading(false);
    
    console.error("Erro ao carregar mídia:", {
      id: currentStory?.id || 'desconhecido',
      url: mediaUrl || 'desconhecida',
      type: currentStory?.mediaType || 'desconhecido'
    });
  }, [mediaUrl]);
  
  // Resetar estados quando o story muda - agora após a declaração dos callbacks
  useEffect(() => {
    if (!isMounted.current || !currentStory) return;
    
    setMediaError(false);
    setMediaLoading(true);
    setAvatarError(false);
    
    console.log("Mudando para story:", {
      id: currentStory?.id || "unknown",
      mediaType: currentStory?.mediaType || "unknown",
      mediaUrl: mediaUrl || "unknown"
    });
    
    // Para imagens, pré-carregar
    if (!isVideo && isValidURL(mediaUrl)) {
      const img = new Image();
      img.onload = () => {
        if (isMounted.current) {
          // Inline as funções em vez de usar callbacks
          setMediaLoading(false);
          setMediaError(false);
        }
      };
      img.onerror = () => {
        if (isMounted.current) {
          // Inline as funções em vez de usar callbacks
          setMediaError(true);
          setMediaLoading(false);
          console.error("Erro ao carregar mídia:", {
            id: currentStory?.id || 'desconhecido',
            url: mediaUrl || 'desconhecida',
            type: currentStory?.mediaType || 'desconhecido'
          });
        }
      };
      img.src = mediaUrl;
    }
  }, [currentStoryIndex, isVideo, mediaUrl]); // Remover callbacks da dependência
  
  // Verificar se o usuário atual é o dono do story ou um admin
  const canRemoveStory = useCallback(() => {
    // No ambiente de desenvolvimento, sempre permitir a remoção para facilitar testes
    if (process.env.NODE_ENV === 'development') return true;
    
    if (!user) return false;
    
    // Verificar se é o criador do story
    const isOwner = user.uid === currentStory?.userId;
    
    // Verificar se é um produtor de conteúdo ou admin
    const isContentProducer = (user as any)?.isContentProducer === true;
    const isAdmin = (user as any)?.role === "admin" || 
                   ((user as any)?.roles && (user as any).roles.includes("admin"));
    
    return isOwner || isContentProducer || isAdmin;
  }, [user]);
  
  // Função para avançar para o próximo story
  const handleNext = useCallback(() => {
    if (!isMounted.current) return;
    
    if (currentStoryIndex < validStories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
      setMediaError(false);
      setMediaLoading(true);
    } else {
      onClose();
    }
  }, [currentStoryIndex, validStories.length, onClose]);
  
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
  const handleEstablishmentClick = useCallback(() => {
    setIsPaused(true);
    setShowEstablishment(true);
  }, []);
  
  const handleEstablishmentClose = useCallback(() => {
    setShowEstablishment(false);
    setIsPaused(false);
  }, []);
  
  // Função para alternar o mudo
  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
  }, [isMuted]);
  
  const handleAvatarError = useCallback(() => {
    if (!isMounted.current) return;
    setAvatarError(true);
  }, []);
  
  // Funções para lidar com eventos de vídeo
  const handleVideoDuration = useCallback((duration: number) => {
    if (!isMounted.current) return;
    console.log("Duração do vídeo:", duration);
    setVideoDuration(duration);
  }, []);
  
  const handleVideoProgress = useCallback((state: { played: number; playedSeconds: number; loaded: number; loadedSeconds: number }) => {
    if (!isMounted.current) return;
    setVideoProgress(state.played * 100);
  }, []);
  
  // 7. DEFINIR OUTRAS FUNÇÕES DEPOIS DOS HOOKS E CALLBACKS
  // Tratadores de gesto para arrastar para baixo
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    
    const touchY = e.touches[0].clientY;
    const diff = touchY - touchStartY.current;
    
    // Se arrastar para baixo mais de 100px, fechar
    if (diff > 100) {
      touchStartY.current = null;
      onClose();
    }
  };
  
  const handleTouchEnd = () => {
    touchStartY.current = null;
  };
  
  // Função para lidar com cliques nas áreas laterais para navegação
  const handleAreaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Não ativar para mobile em modo paisagem (eles já têm botões visíveis)
    if (isDesktop) return;
    
    // Não proceder se estiver em um elemento interativo
    if ((e.target as HTMLElement).closest('button')) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    
    // Dividir a tela em 3 áreas: 25% esquerda, 50% centro, 25% direita
    if (x < width * 0.25) {
      handlePrevious();
    } else if (x > width * 0.75) {
      handleNext();
    }
    // A área central não faz nada (ou pode pausar/resumir)
  };
  
  // Funções para lidar com reações
  const getReactionCount = (reaction: string): number => {
    // Mapear o nome da reação para o campo correspondente no objeto
    const reactionField = 
      reaction === 'like' ? 'likes' : 
      reaction === 'dislike' ? 'dislikes' : 
      reaction === 'heart' ? 'hearts' : 
      reaction === 'fire' ? 'fires' : reaction;
    
    // Primeiro tentar obter do estado local (que é atualizado imediatamente)
    if (localReactions && reactionField in localReactions) {
      return localReactions[reactionField];
    }
    
    // Se não estiver no estado local, obter do story
    switch (reaction) {
      case 'like': return currentStory?.reactions?.likes || 0;
      case 'dislike': return currentStory?.reactions?.dislikes || 0;
      case 'heart': return currentStory?.reactions?.hearts || 0;
      case 'fire': return currentStory?.reactions?.fires || 0;
      default: return 0;
    }
  };
  
  // Verificar se o usuário já reagiu a este story
  const hasUserReacted = (storyId: string): string | null => {
    return userReactions[storyId] || currentStory?.userReaction || null;
  };
  
  // Função para enviar reação para o servidor
  const sendReaction = async (reaction: string) => {
    try {
      setIsReacting(true);
      
      // Obter a reação atual antes da mudança
      const currentUserReaction = hasUserReacted(currentStory?.id || '');
      
      // Atualizar imediatamente o estado local para feedback instantâneo ao usuário
      // Mapear nomes de reações para campos no objeto reactions
      const reactionFields: Record<string, string> = {
        'like': 'likes',
        'dislike': 'dislikes',
        'heart': 'hearts',
        'fire': 'fires'
      };
      
      // Atualizar reações localmente (decrementar antiga e incrementar nova)
      setLocalReactions(prev => {
        const updated = { ...prev };
        
        // Se havia uma reação anterior e ela é diferente da nova, decrementar
        if (currentUserReaction && currentUserReaction !== reaction && currentUserReaction in reactionFields) {
          const prevField = reactionFields[currentUserReaction];
          updated[prevField] = Math.max(0, (updated[prevField] || 0) - 1);
        }
        
        // Incrementar a nova reação se for diferente da anterior
        if (!currentUserReaction || currentUserReaction !== reaction) {
          const newField = reactionFields[reaction];
          updated[newField] = (updated[newField] || 0) + 1;
        }
        
        return updated;
      });
      
      // Atualizar o estado local de userReactions para feedback imediato
      setUserReactions(prev => ({
        ...prev,
        [currentStory?.id || '']: reaction
      }));
      
      const response = await fetch('/api/stories/reaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storyId: currentStory?.id,
          reaction: reaction
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Falha ao salvar reação');
      }
      
      // Processar resposta da API para obter contagens atualizadas
      const responseData = await response.json();
      
      // Atualizar as contagens locais com os valores exatos do servidor
      if (responseData.reactions) {
        setLocalReactions({
          likes: responseData.reactions.likes || 0,
          dislikes: responseData.reactions.dislikes || 0,
          hearts: responseData.reactions.hearts || 0,
          fires: responseData.reactions.fires || 0
        });
      }
      
      // Atualizar a contagem de reações com os valores retornados pela API
      if (responseData.reactions && currentStory) {
        // Criar uma cópia do story atual com as contagens de reações atualizadas
        const updatedStory = {
          ...currentStory,
          reactions: responseData.reactions,
          userReaction: reaction
        };
        
        // Atualizar a lista de stories com o story modificado
        const updatedStories = validStories.map(story => 
          story.id === currentStory.id ? updatedStory : story
        );
        
        // Se tiver acesso a uma função para atualizar os stories, use-a
        if (onRemoveStory && typeof window !== 'undefined') {
          // Emitir evento para que o componente pai atualize as reações
          const event = new CustomEvent('storyReactionUpdated', {
            detail: {
              storyId: currentStory.id,
              reactions: responseData.reactions
            }
          });
          window.dispatchEvent(event);
        }
      }
    } catch (error) {
      console.error('Erro ao salvar reação:', error);
      toast.error('Não foi possível salvar sua reação');
    } finally {
      setIsReacting(false);
    }
  };
  
  const handleReactionClick = (reaction: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Enviar reação
    sendReaction(reaction);
  };
  
  // Função para remover o story
  const handleRemoveStory = async () => {
    if (!currentStory || !currentStory.id) return;
    
    try {
      setIsRemoving(true);
      
      // Simplificar para usar apenas o ID do usuário
      const headers = {
        'Content-Type': 'application/json',
        'x-session-user-id': user?.uid || 'anonymous'
      };
      
      console.log("Enviando requisição para remover story com ID de usuário:", user?.uid);
      
      const response = await fetch('/api/stories/remove', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          storyId: currentStory.id
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        let errorMessage = "Falha ao remover o story";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // Ignorar erro de parsing se ocorrer
        }
        throw new Error(errorMessage);
      }
      
      toast.success('Story removido com sucesso');
      
      // Fechar diálogo de confirmação
      setShowDeleteConfirm(false);
      
      // Se houver um callback onRemoveStory, chamá-lo para atualizar a lista de stories
      if (onRemoveStory) {
        onRemoveStory(currentStory.id);
      }
      
      // Se estiver no último story, fechar o viewer, senão passar para o próximo
      if (currentStoryIndex >= stories.length - 1) {
        onClose();
      } else {
        handleNext();
      }
    } catch (error) {
      console.error('Erro ao remover story:', error);
      toast.error(error instanceof Error ? error.message : 'Não foi possível remover o story');
    } finally {
      setIsRemoving(false);
    }
  };
  
  // Verificar se o usuário já tem alguma reação
  const currentUserReaction = hasUserReacted(currentStory?.id || '');
  
  // Se não houver stories válidos, retornar null mas manter a mesma estrutura de hooks
  if (!hasValidStories || !currentStory) {
    return null;
  }
  
  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
      {/* Botão de fechar */}
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 z-20 text-white p-2 hover:bg-white/10 rounded-full"
      >
        <X className="h-6 w-6" />
      </button>
      
      {/* Botão de remover (apenas para o dono do story ou admin) */}
      {canRemoveStory() && (
        <button 
          onClick={() => setShowDeleteConfirm(true)}
          className="absolute top-14 right-4 z-20 text-white p-2 hover:bg-red-500/30 rounded-full"
          title="Remover story"
        >
          <Trash2 className="h-6 w-6" />
        </button>
      )}
      
      {/* Barra de progresso superior */}
      <div className="absolute top-0 left-0 right-0 p-4 z-10">
        <StoryProgressBar 
          count={validStories.length}
          currentIndex={currentStoryIndex}
          duration={isVideo ? 0 : 5000} // Se for vídeo, usar progresso específico
          videoProgress={isVideo ? videoProgress : undefined}
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
        ref={containerRef}
        className="relative w-full h-full md:w-[400px] md:h-[calc(100vh-120px)] md:rounded-xl overflow-hidden bg-zinc-900"
        onClick={handleAreaClick}
        onTouchStart={isMounted.current ? handleTouchStart : undefined}
        onTouchMove={isMounted.current ? handleTouchMove : undefined}
        onTouchEnd={isMounted.current ? handleTouchEnd : undefined}
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
                onEnded={() => {
                  if (isMounted.current) handleNext();
                }}
                onStart={() => {
                  if (isMounted.current) {
                  console.log("ReactPlayer - reprodução iniciada");
                  setMediaLoading(false);
                  }
                }}
                onPlay={() => {
                  if (isMounted.current) {
                  console.log("ReactPlayer - reproduzindo");
                  setMediaLoading(false);
                  }
                }}
                onPause={() => {
                  if (isMounted.current) setIsPaused(true);
                }}
                onBuffer={() => {
                  if (isMounted.current) {
                  console.log("ReactPlayer - buffering");
                  setMediaLoading(true);
                  }
                }}
                onBufferEnd={() => {
                  if (isMounted.current) {
                  console.log("ReactPlayer - buffer concluído");
                  setMediaLoading(false);
                  }
                }}
                onReady={() => {
                  if (isMounted.current) {
                  console.log("ReactPlayer - pronto");
                  setMediaLoading(false);
                  }
                }}
                onDuration={(duration) => {
                  if (isMounted.current) handleVideoDuration(duration);
                }}
                onProgress={(state) => {
                  if (isMounted.current) handleVideoProgress(state);
                }}
                onError={(e) => {
                  if (!isMounted.current) return;
                  
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
                  if (!isMounted.current) return;
                  
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
        
        {/* Barra de reações */}
        <div className={`absolute ${currentStory.linkedEstablishment ? 'bottom-32' : 'bottom-16'} right-1 z-20`}>
          <div className="flex items-center justify-between flex flex-col h-auto w-20 mx-auto">
            {/* Botão Curtir */}
            <button 
              onClick={handleReactionClick('like')}
              disabled={isReacting}
              className={`flex flex-col items-center px-3 py-2 rounded-lg transition-colors ${
                currentUserReaction === 'like' 
                  ? 'bg-emerald-500/30 text-white' 
                  : 'text-white/80 hover:bg-white/10'
              }`}
            >
              <span className={`text-2xl ${currentUserReaction === 'like' ? 'text-emerald-400' : 'text-white/80'}`}>👍</span>
              <span className="text-xs mt-1 font-medium">{getReactionCount('like')}</span>
            </button>
            
            
            {/* Botão Coração */}
            <button 
              onClick={handleReactionClick('heart')}
              disabled={isReacting}
              className={`flex flex-col items-center px-3 py-2 rounded-lg transition-colors ${
                currentUserReaction === 'heart' 
                  ? 'bg-pink-500/30 text-white' 
                  : 'text-white/80 hover:bg-white/10'
              }`}
            >
              <span className={`text-2xl ${currentUserReaction === 'heart' ? 'text-pink-400' : 'text-white/80'}`}>🍔</span>
              <span className="text-xs mt-1 font-medium">{getReactionCount('heart')}</span>
            </button>
            
            {/* Botão Fogo */}
            <button 
              onClick={handleReactionClick('fire')}
              disabled={isReacting}
              className={`flex flex-col items-center px-3 py-2 rounded-lg transition-colors ${
                currentUserReaction === 'fire' 
                  ? 'bg-orange-500/30 text-white' 
                  : 'text-white/80 hover:bg-white/10'
              }`}
            >
              <span className={`text-2xl ${currentUserReaction === 'fire' ? 'text-orange-400' : 'text-white/80'}`}>🔥</span>
              <span className="text-xs mt-1 font-medium">{getReactionCount('fire')}</span>
            </button>
          </div>
        </div>
        
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
        
        {/* Área de clique para navegação em dispositivos móveis */}
        <div className="absolute inset-y-0 left-0 w-1/4 z-5" onClick={(e) => { e.stopPropagation(); handlePrevious(); }}></div>
        <div className="absolute inset-y-0 right-0 w-1/4 z-5" onClick={(e) => { e.stopPropagation(); handleNext(); }}></div>
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
      
      {/* Dialog de confirmação de remoção */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Story</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este story? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRemoveStory}
              disabled={isRemoving}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isRemoving ? 'Removendo...' : 'Sim, remover'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 