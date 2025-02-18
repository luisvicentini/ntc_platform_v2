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
    <Card className="bg-[#1a1b2d] border-[#131320] overflow-hidden">
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
      </div>
      <CardHeader className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-[#e5e2e9]">{establishment.name}</h3>
            <p className="text-sm text-[#7a7b9f]">
              {establishment.address?.city}, {establishment.address?.state}
            </p>
          </div>
          <div className="flex items-center space-x-2 text-[#e5e2e9]">
            <Star className="h-4 w-4 text-yellow-400" />
            <span>{establishment.rating ? establishment.rating.toFixed(1) : '0.0'}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="text-sm text-[#b5b6c9] mb-4">{establishment.description}</p>
        <div className="flex justify-between items-center">
          <div className="text-sm text-[#7a7b9f]">
            {establishment.type?.category} • {establishment.type?.type}
          </div>
          <Button
            onClick={onEdit}
            variant="outline"
            size="sm"
            className="bg-[#131320] border-[#1a1b2d] hover:bg-[#1a1b2d] hover:text-[#e5e2e9]"
          >
            <Edit className="h-4 w-4 mr-1" />
            Editar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}