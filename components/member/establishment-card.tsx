"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, Ticket } from "lucide-react"
import type { Establishment } from "@/types/establishment"
import { FeaturedBadge } from "@/components/featured-badge"

interface EstablishmentCardProps {
  establishment: Establishment
  onGetVoucher: () => void
}

export function EstablishmentCard({ establishment, onGetVoucher }: EstablishmentCardProps) {
  const formatRating = (rating: number | undefined) => {
    return rating ? rating.toFixed(1) : '0.0'
  }

  return (
    <Card className="bg-zinc-100 border-zinc-200 overflow-hidden">
      <div className="relative h-48">
        <img
          src={establishment.images?.[0] || "/placeholder.svg"}
          alt={establishment.name || "Estabelecimento"}
          className="w-full h-full object-cover"
        />
      </div>
      <CardHeader className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-zinc-500">
              {establishment.name || "Sem nome"}
            </h3>
            <p className="text-sm text-zinc-400">
              {establishment.address?.city || "Cidade não informada"}, 
              {establishment.address?.state || "Estado não informado"}
            </p>
          </div>
          <div className="flex items-center space-x-2 text-zinc-500">
            <Star className="h-4 w-4 text-yellow-400" />
            <span>{formatRating(establishment.rating)}</span>
            {establishment.isFeatured && <FeaturedBadge />}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="text-sm text-[#b5b6c9] mb-4">
          {establishment.description || "Sem descrição"}
        </p>
        <div className="flex justify-between items-center">
          <div className="text-sm text-zinc-400">
            {establishment.type?.category || "Categoria não informada"} • 
            {establishment.type?.type || "Tipo não informado"}
          </div>
          <Button
            onClick={onGetVoucher}
            className="bg-primary hover:bg-[#a85fdd] text-white"
            size="sm"
          >
            <Ticket className="h-4 w-4 mr-1" />
            Gerar Voucher
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 