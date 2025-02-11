"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { useEstablishment } from "@/contexts/EstablishmentContext"

interface RatingCardProps {
  establishmentId: string
  establishmentName: string
  onRate: () => void
}

export function RatingCard({ establishmentId, establishmentName, onRate }: RatingCardProps) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [hasRated, setHasRated] = useState(false)
  const { updateEstablishment, establishments } = useEstablishment()

  const handleRate = (selectedRating: number) => {
    setRating(selectedRating)
    setHasRated(true)

    const establishment = establishments.find((e) => e.id === establishmentId)
    if (!establishment) return

    const newTotalRatings = establishment.totalRatings + 1
    const newRating = (establishment.rating * establishment.totalRatings + selectedRating) / newTotalRatings

    updateEstablishment(establishmentId, {
      rating: newRating,
      totalRatings: newTotalRatings,
    })

    // Don't call onRate to keep the notification
  }

  if (hasRated) {
    return (
      <div className="bg-[#1a1b2d] p-4 rounded-lg space-y-2">
        <h4 className="font-medium text-lg text-[#e5e2e9]">Obrigado pelo feedback!</h4>
        <p className="text-[#7a7b9f]">
          Você avaliou {establishmentName} com {rating} estrelas
        </p>
        <div className="flex justify-center gap-1 py-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-6 h-6 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-[#7a7b9f]"}`}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#1a1b2d] p-4 rounded-lg space-y-2">
      <h4 className="font-medium text-lg text-[#e5e2e9]">Avalie sua experiência</h4>
      <p className="text-[#7a7b9f]">
        Você gerou um voucher para {establishmentName}. Que tal avaliar o estabelecimento?
      </p>
      <div className="flex justify-center gap-1 py-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            className="focus:outline-none"
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            onClick={() => handleRate(star)}
          >
            <Star
              className={`w-8 h-8 transition-colors ${
                star <= (hoveredRating || rating) ? "fill-yellow-400 text-yellow-400" : "text-[#7a7b9f]"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  )
}

