"use client"

import { useEffect, useState, useCallback } from "react"
import { cn } from "@/lib/utils/utils"

interface StoryProgressBarProps {
  count: number
  currentIndex: number
  duration: number
  videoProgress?: number // Progresso do vídeo (0-100)
  onComplete: () => void
  isPaused: boolean
}

export function StoryProgressBar({
  count,
  currentIndex,
  duration,
  videoProgress,
  onComplete,
  isPaused
}: StoryProgressBarProps) {
  const [progress, setProgress] = useState(0)
  
  // Resetar o progresso quando o índice muda
  useEffect(() => {
    setProgress(0)
  }, [currentIndex])
  
  // Chamar onComplete de maneira segura, usando useCallback para evitar recriações
  const handleComplete = useCallback(() => {
    // Usar setTimeout para evitar chamadas durante o render
    setTimeout(() => {
      onComplete();
    }, 10);
  }, [onComplete]);
  
  // Atualizar progresso com base em videoProgress, se fornecido (para vídeos)
  useEffect(() => {
    if (videoProgress !== undefined) {
      setProgress(videoProgress);
      if (videoProgress >= 99.5) {
        handleComplete();
      }
    }
  }, [videoProgress, handleComplete]);
  
  // Gerenciar a progressão da barra (para imagens)
  useEffect(() => {
    // Se tivermos um videoProgress definido, usar esse modo em vez deste efeito
    if (videoProgress !== undefined) return;
    // Se pausado ou duração inválida, não fazer nada
    if (isPaused || duration <= 0) return;
    
    const interval = 10; // Atualiza a cada 10ms para uma animação suave
    const increment = (interval / duration) * 100;
    
    const timer = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + increment;
        if (newProgress >= 100) {
          clearInterval(timer);
          // Chamar o complete apenas quando o progresso realmente terminar
          handleComplete();
          return 100; // Garantir que o valor máximo seja 100
        }
        return newProgress;
      });
    }, interval);
    
    return () => clearInterval(timer);
  }, [currentIndex, duration, handleComplete, isPaused, videoProgress]);
  
  return (
    <div className="flex w-full gap-1">
      {Array.from({ length: count }).map((_, index) => (
        <div 
          key={index} 
          className={cn(
            "h-[3px] rounded-full bg-white/30 flex-1 overflow-hidden"
          )}
        >
          {index === currentIndex && (
            <div 
              className="h-full bg-white transition-all duration-0 ease-linear" 
              style={{ width: `${progress}%` }}
            />
          )}
          
          {index < currentIndex && (
            <div className="h-full bg-white w-full" />
          )}
        </div>
      ))}
    </div>
  )
} 