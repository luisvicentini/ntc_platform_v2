"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, Star } from "lucide-react"
import type { Establishment } from "@/types/establishment"
import { FeaturedBadge } from "@/components/featured-badge"

interface EstablishmentCardProps {
  establishment: Establishment
  onEdit: () => void
}

export function EstablishmentCard({ establishment, onEdit }: EstablishmentCardProps) {
  return (
    <Card className="bg-zinc-100 border-zinc-200 overflow-hidden">
      <div className="relative h-48">
        <img
          src={establishment.images?.[0] || "/placeholder.svg"}
          alt={establishment.name}
          className="w-full h-full object-cover"
        />
        {establishment.isFeatured && (
          <div className="absolute top-2 right-2">
            <FeaturedBadge />
          </div>
        )}
        <div className="absolute top-2 right-2 bg-zinc-100 px-2 py-1 rounded-full flex items-center gap-1">
          <Star className="h-4 w-4 text-yellow-400" />
          <span className="text-sm text-zinc-500">
            {establishment.rating?.toFixed(1) || "Novo"}
          </span>
          {establishment.totalRatings > 0 && (
            <span className="text-xs text-zinc-400">
              ({establishment.totalRatings})
            </span>
          )}
        </div>
      </div>
      <CardHeader className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-zinc-500">{establishment.name}</h3>
            <p className="text-sm text-zinc-400">
              {establishment.address?.city}, {establishment.address?.state}
            </p>
          </div>
          <div className="flex items-center space-x-2 text-zinc-500">
            <Star className="h-4 w-4 text-yellow-400" />
            <span>{establishment.rating ? establishment.rating.toFixed(1) : '0.0'}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="text-sm text-[#b5b6c9] mb-4">{establishment.description}</p>
        <div className="flex justify-between items-center">
          <div className="text-sm text-zinc-400">
            {establishment.type?.category} • {establishment.type?.type}
          </div>
          <Button
            onClick={onEdit}
            variant="outline"
            size="sm"
            className="bg-zinc-100 border-zinc-200 hover:bg-zinc-100 hover:text-zinc-500"
          >
            <Edit className="h-4 w-4 mr-1" />
            Editar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}