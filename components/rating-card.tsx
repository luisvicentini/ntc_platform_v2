"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { useEstablishment } from "@/contexts/EstablishmentContext"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { toast } from "sonner"

interface RatingCardProps {
  establishmentId: string
  establishmentName: string
  onRate: () => void
  notificationId: string
}

export function RatingCard({ establishmentId, establishmentName, onRate, notificationId }: RatingCardProps) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { updateEstablishmentRating } = useEstablishment()

  const handleRate = async (selectedRating: number) => {
    try {
      setIsSubmitting(true)
      console.log("Enviando avaliação:", {
        establishmentId,
        selectedRating,
        notificationId
      })

      // Atualizar a avaliação do estabelecimento
      const success = await updateEstablishmentRating(establishmentId, selectedRating)

      if (!success) {
        throw new Error("Falha ao atualizar avaliação")
      }

      // Atualizar o status da notificação
      const notificationRef = doc(db, "notifications", notificationId)
      await updateDoc(notificationRef, {
        status: "completed",
        rating: selectedRating,
        ratedAt: new Date()
      })

      setRating(selectedRating)
      toast.success("Avaliação enviada com sucesso!")
      onRate() // Remove a notificação da lista

    } catch (error) {
      console.error("Erro ao salvar avaliação:", error)
      toast.error("Erro ao enviar avaliação. Tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white p-4 rounded-lg">
      <h3 className="font-medium mb-2">Avalie sua experiência</h3>
      <p className="text-sm text-zinc-400 mb-4">
        Como foi sua experiência em {establishmentName}?
      </p>
      <div className="flex gap-2 justify-center" role="group" aria-label="Avaliação em estrelas">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            className="focus:outline-none disabled:opacity-50"
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            onClick={() => handleRate(star)}
            disabled={isSubmitting}
            aria-label={`${star} estrelas`}
          >
            <Star
              className={`w-8 h-8 transition-colors ${
                star <= (hoveredRating || rating) 
                  ? "fill-yellow-400 text-yellow-400" 
                  : "text-zinc-400"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  )
}

