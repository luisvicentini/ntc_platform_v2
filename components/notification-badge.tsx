"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface NotificationBadgeProps {
  userName: string
}

export function NotificationBadge({ userName }: NotificationBadgeProps) {
  const [showNotification, setShowNotification] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Simular a geração de um voucher após 5 segundos
    const timer = setTimeout(() => {
      setShowNotification(true)
    }, 5000)

    return () => clearTimeout(timer)
  }, [])

  const handleDismiss = () => {
    setShowNotification(false)
    setIsOpen(false)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-zinc-500" />
          {showNotification && <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 bg-zinc-100 border-zinc-200 text-zinc-500">
        <div className="space-y-4">
          <h4 className="font-medium text-lg">Avalie sua experiência</h4>
          <p className="text-zinc-400">
            Olá {userName}, você gerou um voucher recentemente. Que tal avaliar o estabelecimento?
          </p>
          <div className="flex justify-between">
            <Button
              onClick={handleDismiss}
              variant="outline"
              className="bg-zinc-100 text-zinc-500 border-primary hover:bg-primary hover:text-zinc-500"
            >
              Avaliar depois
            </Button>
            <Button onClick={handleDismiss} className="bg-primary text-zinc-500 hover:bg-[#a85fdd]">
              Avaliar agora
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

