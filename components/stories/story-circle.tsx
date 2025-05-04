"use client"

import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils/utils"
import { Film, ImageIcon } from "lucide-react"

// Objeto com cores para as letras do alfabeto (importado do header.tsx)
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
  return url.startsWith('http://') || url.startsWith('https://');
};

// Função para verificar se é uma URL de placeholder
const isPlaceholderUrl = (url: string): boolean => {
  return url.includes('placehold.co') || url.includes('placeholder');
};

interface StoryCircleProps {
  id: string
  userId: string
  userName: string
  userAvatar: string
  thumbnail: string
  mediaType?: "image" | "video"
  hasSeen: boolean
  onClick: () => void
}

export function StoryCircle({
  id,
  userId,
  userName,
  userAvatar,
  thumbnail,
  mediaType = "image",
  hasSeen,
  onClick
}: StoryCircleProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [avatarError, setAvatarError] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const isVideo = mediaType === "video"
  const isMounted = useRef(true)
  
  // Verificar se a URL é de placeholder ou inválida
  const isPlaceholder = isPlaceholderUrl(thumbnail);
  const isValidThumbnail = isValidURL(thumbnail) && !isPlaceholder;
  
  // Verificar se o avatar é uma URL válida
  const isValidAvatar = isValidURL(userAvatar);
  
  // Obter a classe de cor com base no nome do usuário
  const avatarColorClass = getAvatarColorClass(userName);
  const userInitial = userName?.charAt(0)?.toUpperCase() || "U";

  // Uso de useEffect para garantir tempo de carregamento máximo
  useEffect(() => {
    // Se a URL não for válida, não tentar carregar
    if (!isValidThumbnail) {
      setImageError(true);
      setIsLoading(false);
      return;
    }
    
    // Apenas para vídeos, iniciar em loading
    if (isVideo) {
      setIsLoading(true);
      
      // Timeout de segurança para vídeos (3 segundos)
      const timeoutId = setTimeout(() => {
        if (isMounted.current && isLoading) {
          console.log(`StoryCircle ${id} - Timeout para vídeo, mostrando ícone padrão`);
          setIsLoading(false);
        }
      }, 3000);
      
      return () => clearTimeout(timeoutId);
    }
    
    // Imagens - verificar carregamento
    if (!isVideo && isValidThumbnail) {
      const img = new Image();
      let isActive = true;
      
      img.onload = () => {
        if (isActive && isMounted.current) {
          setIsLoading(false);
          setImageError(false);
        }
      };
      
      img.onerror = () => {
        if (isActive && isMounted.current) {
          setIsLoading(false);
          setImageError(true);
        }
      };
      
      img.src = thumbnail;
      
      return () => {
        isActive = false;
        img.onload = null;
        img.onerror = null;
      };
    }
  }, [id, thumbnail, isValidThumbnail, isPlaceholder, isVideo, isLoading]);

  // Mostrar logs apenas uma vez para debugging
  useEffect(() => {
    console.log(`StoryCircle ${id} - Status:`, {
      thumbnail: thumbnail?.substring(0, 30) + '...',
      isValidThumbnail,
      isPlaceholder,
      isVideo,
      userName
    });
    
    // Limpar flag ao desmontar
    return () => {
      isMounted.current = false;
    };
  }, [id, thumbnail, isValidThumbnail, isPlaceholder, userName, isVideo]);
  
  // Função para lidar com erro ao carregar avatar
  const handleAvatarError = () => {
    if (!isMounted.current) return;
    setAvatarError(true);
  };
  
  // Função para lidar com erro ao carregar a thumbnail
  const handleImageError = () => {
    if (!isMounted.current) return;
    setImageError(true);
    setIsLoading(false);
  };
  
  return (
    <div 
      className="flex flex-col items-center gap-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        onClick={onClick}
        className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center relative cursor-pointer transition-transform",
          isHovered && "transform scale-105",
          "p-[2px]", // Borda interna
          hasSeen ? "bg-zinc-300" : "bg-gradient-to-tr from-emerald-500 to-yellow-400"
        )}
      >
        <div className="w-full h-full overflow-hidden rounded-full bg-white">
          <div className="w-full h-full relative">
            {isLoading ? (
              // Estado de carregamento
              <div className="w-full h-full bg-zinc-100 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : imageError || !isValidThumbnail ? (
              // Estado de erro na imagem ou placeholder
              <div className="w-full h-full bg-zinc-100 flex items-center justify-center">
                {isVideo ? (
                  <Film className="h-8 w-8 text-zinc-400" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-zinc-400" />
                )}
              </div>
            ) : (
              // Imagem carregada com sucesso - para imagens e usando a URL direta para vídeos (possivelmente um frame do vídeo)
              <img 
                src={thumbnail} 
                alt={`Story de ${userName}`}
                className="w-full h-full object-cover"
                onLoad={() => setIsLoading(false)}
                onError={handleImageError}
              />
            )}
            
            {/* Indicador de vídeo */}
            {isVideo && !imageError && isValidThumbnail && !isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <Film className="h-5 w-5 text-white" />
              </div>
            )}
          </div>
        </div>
        
        {/* Avatar do usuário */}
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full overflow-hidden border-2 border-white">
          {avatarError || !userAvatar || !isValidAvatar ? (
            <div className={`w-full h-full flex items-center justify-center font-medium text-sm ${avatarColorClass}`}>
              {userInitial}
            </div>
          ) : (
            <img 
              src={userAvatar} 
              alt={userName}
              className="w-full h-full object-cover"
              onError={handleAvatarError}
            />
          )}
        </div>
      </button>
      
      <span className="text-xs text-center text-zinc-600 max-w-[70px] truncate">
        {userName}
      </span>
    </div>
  )
} 