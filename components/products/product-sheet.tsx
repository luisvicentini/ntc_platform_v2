"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, Calendar, Phone, Ticket, ExternalLink, Copy, Check } from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow, format, isAfter } from "date-fns"
import { ptBR } from "date-fns/locale"
import ReactPlayer from "react-player"
import type { Product } from "./product-carousel"

interface ProductSheetProps {
  product: Product | null
  isOpen: boolean
  onClose: () => void
}

export function ProductSheet({ product, isOpen, onClose }: ProductSheetProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [copied, setCopied] = useState(false)
  const [isPlaying, setIsPlaying] = useState(true)

  // Reset do estado quando o modal é fechado
  useEffect(() => {
    if (!isOpen) {
      setCurrentImageIndex(0)
      setCopied(false)
    } else {
      setIsPlaying(true)
    }
  }, [isOpen])

  if (!product) return null

  const handleCopyVoucher = () => {
    navigator.clipboard.writeText(product.voucher)
      .then(() => {
        setCopied(true)
        toast.success("Código copiado para a área de transferência!")
        
        // Registrar o clique no banco de dados
        registerProductClick(product.id)
          .catch(error => {
            console.error("Erro ao registrar clique:", error)
            // Não exibimos erro ao usuário pois não afeta a funcionalidade principal
          })
        
        setTimeout(() => setCopied(false), 3000)
      })
      .catch(() => {
        toast.error("Erro ao copiar código. Tente novamente.")
      })
  }

  // Função para registrar o clique na API
  const registerProductClick = async (productId: string) => {
    try {
      const response = await fetch('/api/products/clicks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId })
      });

      if (!response.ok) {
        throw new Error('Falha ao registrar clique');
      }

      return await response.json();
    } catch (error) {
      console.error("Erro ao registrar clique:", error);
      throw error;
    }
  };

  const handleOpenStore = () => {
    if (product.link) {
      window.open(product.link, "_blank")
    } else {
      toast.error("Link da loja não disponível")
    }
  }

  const formatValidUntil = () => {
    try {
      const validDate = new Date(product.validUntil)
      return format(validDate, "dd/MM/yyyy", { locale: ptBR })
    } catch (error) {
      return "Data não disponível"
    }
  }

  const isValid = () => {
    try {
      const validDate = new Date(product.validUntil)
      return isAfter(validDate, new Date())
    } catch (error) {
      return false
    }
  }

  const isVideo = product.mediaType === "video"

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px] bg-white border-l-zinc-200 flex flex-col p-0 overflow-y-auto space-y-0">
        <div className="border-b border-zinc-200 space-y-4 -mb-8">
          <SheetHeader className="pt-4 space-y-0 px-4">
            <SheetTitle className="text-zinc-500">{product.name}</SheetTitle>
            <SheetDescription className="text-zinc-400">
              {isValid() 
                ? `Válido até ${formatValidUntil()}` 
                : "Oferta expirada"
              }
            </SheetDescription>
          </SheetHeader>

          {/* Mídia do produto */}
          <div className="relative aspect-video overflow-hidden">
            {isVideo ? (
              <ReactPlayer
                url={product.image}
                width="100%"
                height="100%"
                playing={isPlaying}
                muted={true}
                loop={true}
                controls={false}
                config={{
                  file: {
                    attributes: {
                      controlsList: "nodownload",
                      disablePictureInPicture: true,
                    },
                  },
                }}
                style={{ objectFit: "cover" }}
                onError={(e) => console.error("Erro ao reproduzir vídeo:", e)}
              />
            ) : (
              <img
                src={product.image || "/placeholder.svg"}
                alt={product.name}
                className="absolute top-0 left-0 w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/placeholder.svg";
                }}
              />
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white rounded-t-xl z-50 ">
          {/* Código do cupom */}
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-center space-x-4">
            <Ticket className="h-8 w-8 text-amber-500" />
            <div>
              <p className="text-sm font-medium text-amber-500">Código promocional</p>
              <p className="text-xl text-amber-800 font-bold tracking-wider">{product.voucher}</p>
            </div>
          </div>

          {/* Descrição do produto */}
          <div className="space-y-2">
            <h3 className="font-semibold text-zinc-500">Descrição</h3>
            <p className="text-zinc-400 text-sm">{product.description}</p>
          </div>

          {/* Informações adicionais */}
          <div className="space-y-4">
            {product.phone && product.phone.phone && (
              <div className="flex items-center text-zinc-500 space-x-2">
                <Phone className="h-4 w-6" />
                <span className="text-sm">
                  +{product.phone.ddi || "55"} {product.phone.phone}
                </span>
              </div>
            )}
            <div className="flex items-center text-zinc-500 space-x-2">
              <Calendar className="h-4 w-6" />
              <span className="text-sm">
                {isValid() 
                  ? `Válido até ${formatValidUntil()}` 
                  : "Oferta expirada"
                }
              </span>
            </div>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="p-6 border-t border-zinc-200 space-y-3">
          <Button 
            onClick={handleCopyVoucher}
            className="w-full bg-primary hover:bg-red-700 text-white font-bold"
            disabled={copied}
          >
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Código Copiado
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copiar Código
              </>
            )}
          </Button>
          
          <Button 
            onClick={handleOpenStore}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Ir para a Loja
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
} 