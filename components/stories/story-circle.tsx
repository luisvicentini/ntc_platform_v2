"use client"

import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils/utils"
import { Film, ImageIcon, PlayCircle, Loader2 } from "lucide-react"

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

// Função simples para verificar se a URL é válida
const isValidURL = (url: string): boolean => {
  if (!url) return false;
  if (url === 'undefined' || url === 'null') return false;
  return url.startsWith('http://') || url.startsWith('https://');
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
    
    // URL encodeada para o proxy
    return `${baseUrl}/api/proxy/video?url=${encodeURIComponent(url)}`;
  }
  
  return url;
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
  const isVideo = mediaType === "video"
  const isMounted = useRef(true)
  
  // Verificação simplificada: URL válida?
  const isValidThumbnail = isValidURL(thumbnail);
  
  // Obter a classe de cor com base no nome do usuário
  const avatarColorClass = getAvatarColorClass(userName);
  const userInitial = userName?.charAt(0)?.toUpperCase() || "U";
  
  // Para vídeos - Manipuladores de eventos específicos
  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    // Se o vídeo passar de 2 segundos, voltar para o início
    if (video.currentTime > 2) {
      video.currentTime = 0;
    }
  };
  
  // Limpar flag ao desmontar
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Função para lidar com erro ao carregar avatar
  const handleAvatarError = () => {
    if (!isMounted.current) return;
    setAvatarError(true);
  };
  
  // Função para lidar com erro ao carregar a thumbnail
  const handleImageError = () => {
    if (!isMounted.current) return;
    setImageError(true);
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
          "p-[3px]", // Borda interna
          hasSeen ? "bg-zinc-300" : "bg-gradient-to-tr from-emerald-200 to-green-500"
        )}
      >
        <div className="w-full h-full overflow-hidden rounded-full bg-white">
          <div className="w-full h-full relative">
            {!isValidThumbnail ? (
              // Placeholder para URLs inválidas
              <div className="w-full h-full bg-zinc-100 flex items-center justify-center">
                {isVideo ? (
                  <Film className="h-8 w-8 text-zinc-400" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-zinc-400" />
                )}
              </div>
            ) : isVideo ? (
              // Vídeo em loop de 2 segundos para stories de vídeo
              <div className="w-full h-full overflow-hidden">
                <video 
                  key={`video-${id}`}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                  onTimeUpdate={handleTimeUpdate}
                  onError={handleImageError}
                  src={processVideoUrl(thumbnail)}
                />
                
                {/* Overlay com ícone de vídeo */}
                {/* <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <Film className="h-5 w-5 text-white" />
                </div> */}
              </div>
            ) : (
              // Imagem para stories de imagem - abordagem simplificada
              <div className="w-full h-full">
                {imageError ? (
                  <div className="w-full h-full bg-zinc-100 flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-zinc-400" />
                  </div>
                ) : (
                  <img 
                    src={thumbnail} 
                    alt={`Story de ${userName}`}
                    className="w-full h-full object-cover"
                    onError={handleImageError}
                  />
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Avatar do usuário */}
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full overflow-hidden border-2 border-white">
          {avatarError || !userAvatar || !isValidURL(userAvatar) ? (
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