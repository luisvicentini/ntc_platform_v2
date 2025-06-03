"use client"

import { useState, useEffect } from "react"

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)
  
  useEffect(() => {
    if (typeof window === "undefined") return
    
    const media = window.matchMedia(query)
    const updateMatches = () => setMatches(media.matches)
    
    // Verificação inicial
    updateMatches()
    
    // Adicionar listener
    if (media.addEventListener) {
      media.addEventListener("change", updateMatches)
      return () => media.removeEventListener("change", updateMatches)
    } else {
      // Fallback para navegadores mais antigos
      media.addListener(updateMatches)
      return () => media.removeListener(updateMatches)
    }
  }, [query])
  
  return matches
} 