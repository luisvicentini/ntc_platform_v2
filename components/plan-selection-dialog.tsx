"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface PlanSelectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectPlan: (priceId: string, planDetails: any) => void
}

export function PlanSelectionDialog({ 
  open, 
  onOpenChange, 
  onSelectPlan 
}: PlanSelectionDialogProps) {
  const [prices, setPrices] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await fetch('/api/stripe/prices')
        const data = await response.json()
        setPrices(data.prices)
      } catch (error) {
        console.error('Erro ao buscar preços:', error)
        toast.error('Erro ao carregar planos disponíveis')
      }
    }

    if (open) {
      fetchPrices()
    }
  }, [open])

  const formatPriceDisplay = (price: any) => {
    const formattedAmount = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: price.currency,
    }).format(price.unit_amount / 100)

    const interval = price.recurring?.interval
      ? `/${price.recurring.interval}`
      : '/mês' // fallback para mensal

    return `${formattedAmount}${interval}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-100 border-zinc-200 text-zinc-500">
        <DialogHeader>
          <DialogTitle>Selecione o Plano</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          {prices.map((price) => (
            <div
              key={price.id}
              className="flex items-center justify-between p-4 rounded-lg border border-zinc-200"
            >
              <div>
                <h3 className="font-medium">{price.product.name}</h3>
                <p className="text-sm text-zinc-400">
                  {formatPriceDisplay(price)}
                </p>
              </div>
              <Button
                onClick={() => {
                  onSelectPlan(price.id, price)
                  onOpenChange(false)
                }}
                className="bg-primary hover:bg-[#a85fdd] text-white"
              >
                Selecionar
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
} 