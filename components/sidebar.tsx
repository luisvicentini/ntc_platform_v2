"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { X } from "lucide-react"

export function Sidebar({ establishment, onClose }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % establishment.images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + establishment.images.length) % establishment.images.length)
  }

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-lg p-6 overflow-y-auto">
      <Button variant="ghost" className="absolute top-2 right-2" onClick={onClose}>
        <X className="h-6 w-6" />
      </Button>

      <div className="mb-6 relative">
        <img
          src={establishment.images[currentImageIndex] || "/placeholder.svg"}
          alt={establishment.name}
          className="w-full h-48 object-cover rounded-lg"
        />
        <Button variant="ghost" className="absolute left-2 top-1/2 transform -translate-y-1/2" onClick={prevImage}>
          &#10094;
        </Button>
        <Button variant="ghost" className="absolute right-2 top-1/2 transform -translate-y-1/2" onClick={nextImage}>
          &#10095;
        </Button>
      </div>

      <h2 className="text-2xl font-bold mb-2">{establishment.name}</h2>
      <p className="text-sm text-gray-600 mb-4">
        {establishment.type} • {establishment.location}
      </p>
      <p className="mb-4">{establishment.description}</p>
      <p className="text-sm mb-2">
        <strong>Horário:</strong> {establishment.hours}
      </p>
      <p className="text-sm mb-4">
        <strong>Telefone:</strong> {establishment.phone}
      </p>
      <Button className="w-full">Gerar Voucher</Button>
    </div>
  )
}

