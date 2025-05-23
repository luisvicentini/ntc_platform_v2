"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, MapPin, Clock, Phone, Ticket, CircleAlert, Siren } from "lucide-react"
import { useNotification } from "@/contexts/NotificationContext"
import { useEstablishment } from "@/contexts/EstablishmentContext"
import { useAuth } from "@/contexts/auth-context"
import { FeaturedBadge } from "@/components/ui/featured-badge"
import type { AvailableEstablishment } from "@/types/establishment"
import { toast } from "sonner"
import { useCountdown } from "@/hooks/use-countdown"

interface EstablishmentSheetProps {
  establishment: AvailableEstablishment | null
  isOpen: boolean
  onClose: () => void
}

type VoucherState = {
  code: string;
  expiresAt: Date;
}

export function EstablishmentSheet({ establishment, isOpen, onClose }: EstablishmentSheetProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const { generateVoucher } = useEstablishment()
  const [voucherStates, setVoucherStates] = useState<Record<string, VoucherState>>({})
  const [countdownSeconds, setCountdownSeconds] = useState(0)
  const { timeLeft, startCountdown } = useCountdown(countdownSeconds)
  const { addNotification } = useNotification()
  const { user } = useAuth()

  useEffect(() => {
    if (!establishment || !user) return

    const checkCooldown = async () => {
      try {
        const response = await fetch(`/api/vouchers/cooldown?establishmentId=${establishment.id}`, {
          credentials: "include"
        })

        if (!response.ok) return

        const data = await response.json()
        if (!data.canGenerate && data.nextAvailable) {
          const nextTime = new Date(data.nextAvailable)
          const now = new Date()
          const diff = Math.floor((nextTime.getTime() - now.getTime()) / 1000)
          if (diff > 0) {
            startCountdown(diff)
          }
        }
      } catch (error) {
        console.error("Erro ao verificar cooldown:", error)
      }
    }

    checkCooldown()
  }, [establishment, user, startCountdown])

  useEffect(() => {
    if (!establishment) return

    const savedState = localStorage.getItem(`voucher_${establishment.id}`)
    if (savedState) {
      try {
        const { code, expiresAt } = JSON.parse(savedState)
        const expirationDate = new Date(expiresAt)
        
        if (expirationDate > new Date()) {
          setVoucherStates(prev => ({
            ...prev,
            [establishment.id]: { code, expiresAt: expirationDate }
          }))
          
          const secondsLeft = Math.floor((expirationDate.getTime() - Date.now()) / 1000)
          setCountdownSeconds(secondsLeft)
        } else {
          localStorage.removeItem(`voucher_${establishment.id}`)
        }
      } catch (error) {
        console.error("Erro ao carregar estado do voucher:", error)
        localStorage.removeItem(`voucher_${establishment.id}`)
      }
    }
  }, [establishment, user])

  // Efeito para transição automática
  useEffect(() => {
    if (!establishment) return
    
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => 
        prev === establishment.images.length - 1 ? 0 : prev + 1
      )
    }, 3000) // 3 segundos

    return () => clearInterval(timer)
  }, [establishment])

  const handleGenerateVoucher = async () => {
    if (!establishment) return

    try {
      const code = await generateVoucher(establishment.id)
      if (code) {
        const expirationHours = Number(establishment.voucherExpiration) || 24
        console.log('Tempo de expiração em horas:', expirationHours)

        const expiresAt = new Date(Date.now() + (expirationHours * 60 * 60 * 1000))
        const newState = { code, expiresAt }
        
        setVoucherStates(prev => ({
          ...prev,
          [establishment.id]: newState
        }))
        
        localStorage.setItem(
          `voucher_${establishment.id}`,
          JSON.stringify(newState)
        )
        
        const secondsToExpire = expirationHours * 60 * 60
        console.log('Segundos para expirar:', secondsToExpire)
        setCountdownSeconds(secondsToExpire)
      }
    } catch (error: any) {
      console.error('Erro ao gerar voucher:', error)
      toast.error(error.message)
    }
  }

  const nextImage = () => {
    if (establishment) {
      setCurrentImageIndex((prev) => (prev + 1) % establishment.images.length)
    }
  }

  const prevImage = () => {
    if (establishment) {
      setCurrentImageIndex((prev) => (prev === 0 ? establishment.images.length - 1 : prev - 1))
    }
  }

  const formatTimeLeft = () => {
    if (timeLeft <= 0) return ''
    
    const hours = Math.floor(timeLeft / 3600)
    const minutes = Math.floor((timeLeft % 3600) / 60)
    const seconds = timeLeft % 60
    
    return `${hours}h ${minutes}m ${seconds}s`
  }

  if (!establishment) return null

  const currentVoucher = establishment.id ? voucherStates[establishment.id] : null

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px] bg-white border-l-zinc-200 flex flex-col p-0 overflow-y-auto space-y-0">
        <div className="border-b border-zinc-200 space-y-4 -mb-8">
          <SheetHeader className="pt-4 space-y-0 px-4">
            <SheetTitle className="text-zinc-500">{establishment.name}</SheetTitle>
            <SheetDescription className="text-zinc-400">
              {establishment.type.type} • {establishment.address.city}
            </SheetDescription>
          </SheetHeader>

          {/* Carrossel de imagens */}
          <div className="relative aspect-video overflow-hidden">
            {establishment.images.map((image, index) => (
              <img
                key={index}
                src={image || "/placeholder.svg"}
                alt={`${establishment.name} - Imagem ${index + 1}`}
                className={`absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-500 ${
                  currentImageIndex === index ? "opacity-100" : "opacity-0"
                }`}
              />
            ))}
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 text-white bg-black/0 hover:bg-black/80 hover:text-white"
              onClick={prevImage}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white bg-black/0 hover:bg-black/80 hover:text-white"
              onClick={nextImage}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            
            {/* Indicadores */}
            <div className="absolute bottom-[30px] left-0 right-0 flex justify-center gap-2">
              {establishment.images.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    currentImageIndex === index 
                      ? "bg-white w-4" 
                      : "bg-white/50 hover:bg-white/75"
                  }`}
                  onClick={() => setCurrentImageIndex(index)}
                />
              ))}
            </div>

            {/* Avaliação e badge de destaque */}
            <div className="absolute top-2 left-2 flex flex-col space-y-2 items-start">
              <div className="bg-black/75 text-white pl-2 pr-1 py-1 rounded-full text-sm flex items-center space-x-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-4 h-4 text-yellow-400"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{establishment.rating.toFixed(1)}</span>
                <span>{establishment.isFeatured && <FeaturedBadge />}</span>
              </div>
              
            </div>
          </div>

        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white rounded-t-xl z-50 ">
          {/* Descrição do cupom */}
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg flex items-center space-x-4">
            <Ticket className="h-8 w-8 text-emerald-500" />
            <div>
              <p className="text-xl font-bold text-emerald-500">{establishment.discountValue} de desconto</p>
              <p className="text-sm text-emerald-800 font-sm">{establishment.voucherDescription}</p>
            </div>
          </div>

          {/* Endereço e horários */}
          <div className="space-y-4">
            <div className="flex items-center text-zinc-500 space-x-2">
              <MapPin className="h-6 w-6" />
              <span className="text-sm">{establishment.address.street}, {establishment.address.number} - {establishment.address.neighborhood}, {establishment.address.city}/{establishment.address.state}</span>
            </div>
            <div className="flex items-center text-zinc-500 space-x-2">
              <Clock className="h-4 w-6" />
              <span className="text-sm">{establishment.openingHours}</span>
            </div>
            <div className="flex items-center text-zinc-500 space-x-2">
              <Phone className="h-4 w-6" />
              <span className="text-sm">
                {establishment.phone && typeof establishment.phone === 'object' 
                  ? `+${establishment.phone.ddi || ''} ${establishment.phone.phone || ''}`
                  : establishment.phone || ''}
              </span>
            </div>
          </div>

          {/* Descrição do estabelecimento */}
          <div className="space-y-2">
            <h3 className="font-semibold text-zinc-500">Descrição</h3>
            <p className="text-zinc-400 text-sm">{establishment.description}</p>
          </div>

          {/* Regras do cupom */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
            <p className="text-amber-700 text-sm font-medium flex items-center gap-4">
              <CircleAlert className="h-6 w-8" />
              {establishment.discountRules}
            </p>
            <p className="text-amber-700 text-sm font-medium flex items-center gap-4">
              <Siren className="h-6 w-6" />
              Limite de uso: {establishment.usageLimit}
            </p>
          </div>
        </div>

        {/* Botão de geração de voucher */}
        <div className="p-6 border-t border-zinc-200">
          {!currentVoucher ? (
            <div className="space-y-2">
              <Button 
                onClick={handleGenerateVoucher}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
              >
                Gerar Voucher
              </Button>
            </div>
          ) : (
            <Card className="bg-zinc-100 border border-zinc-200">
              <CardContent className="p-2 text-center">
                <h3 className="text-lg font-semibold text-zinc-400 mb-1">Seu Voucher</h3>
                <p className="text-3xl font-bold text-primary mb-2">{currentVoucher.code}</p>
                {timeLeft > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Expira em: {formatTimeLeft()}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
