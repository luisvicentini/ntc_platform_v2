"use client"

import { useState } from "react"
import { PlusIcon } from "lucide-react"
import { cn } from "@/lib/utils/utils"

interface StoryCreateButtonProps {
  onClick: () => void
}

export function StoryCreateButton({ onClick }: StoryCreateButtonProps) {
  const [isHovered, setIsHovered] = useState(false)
  
  return (
    <div 
      className="flex flex-col items-center gap-1 mr-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        onClick={onClick}
        className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center cursor-pointer transition-transform",
          isHovered && "transform scale-105",
          "border-2 border-dashed border-zinc-400"
        )}
      >
        <PlusIcon className="h-7 w-7 text-zinc-400" />
      </button>
      
      <span className="text-xs text-center text-zinc-600">
        Criar Story
      </span>
    </div>
  )
} 