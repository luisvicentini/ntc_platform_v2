"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Search, PlusCircle, Edit, Star } from "lucide-react"
import { EstablishmentModal } from "@/components/establishment-modal"
import { useEstablishment } from "@/contexts/EstablishmentContext"
import { FeaturedBadge } from "@/components/ui/featured-badge"
import { Checkbox } from "@/components/ui/checkbox"
import type { Establishment } from "@/types/establishment"

export default function EstablishmentsPage() {
  const { establishments, toggleFeatured } = useEstablishment()
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedEstablishment, setSelectedEstablishment] = useState<Establishment | null>(null)
  const [selectedEstablishments, setSelectedEstablishments] = useState<string[]>([])

  const filteredEstablishments = establishments.filter(
    (establishment) =>
      establishment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      establishment.address.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleSearch = (term: string) => {
    setSearchTerm(term)
  }

  const openEditModal = (establishment: Establishment) => {
    setSelectedEstablishment(establishment)
    setIsModalOpen(true)
  }

  const openNewEstablishmentModal = () => {
    setSelectedEstablishment(null)
    setIsModalOpen(true)
  }

  const handleSelectEstablishment = (id: string) => {
    setSelectedEstablishments((prev) => (prev.includes(id) ? prev.filter((estId) => estId !== id) : [...prev, id]))
  }

  const handleToggleFeatured = () => {
    selectedEstablishments.forEach((id) => toggleFeatured(id))
    setSelectedEstablishments([])
  }

  const allSelectedAreFeatured =
    selectedEstablishments.length > 0 &&
    selectedEstablishments.every((id) => establishments.find((est) => est.id === id)?.isFeatured)

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold tracking-tight text-[#e5e2e9]">Estabelecimentos</h2>
        <div className="flex space-x-4">
          <Button onClick={openNewEstablishmentModal} className="bg-[#7435db] hover:bg-[#a85fdd] text-white">
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo Estabelecimento
          </Button>
          {selectedEstablishments.length > 0 && (
            <Button onClick={handleToggleFeatured} className="bg-[#7435db] hover:bg-[#a85fdd] text-white">
              <Star className="mr-2 h-4 w-4" />
              {allSelectedAreFeatured ? "Remover destaque" : "Marcar como destaque"}
            </Button>
          )}
        </div>
      </div>
      <div className="flex items-center space-x-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-[#7a7b9f]" />
          <Input
            placeholder="Buscar estabelecimentos..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-8 bg-[#1a1b2d] text-[#e5e2e9] border-[#131320]"
          />
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredEstablishments.map((establishment) => (
          <Card key={establishment.id} className="bg-[#131320] border-[#1a1b2d] relative group">
            <CardContent className="p-0">
              <div className="relative aspect-video">
                <img
                  src={establishment.images[0] || "/placeholder.svg"}
                  alt={establishment.name}
                  className="object-cover w-full h-full rounded-t-lg"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70"
                  onClick={() => openEditModal(establishment)}
                >
                  <Edit className="h-4 w-4 text-white" />
                </Button>
                <div className="absolute top-2 left-2 flex flex-col space-y-2">
                  <div className="bg-black/75 text-white px-2 py-1 rounded-full text-sm flex items-center space-x-1">
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
                  </div>
                  {establishment.isFeatured && <FeaturedBadge />}
                </div>
                <div className="absolute top-2 right-12 transition-opacity duration-200 ease-in-out">
                  <Checkbox
                    id={`select-${establishment.id}`}
                    checked={selectedEstablishments.includes(establishment.id)}
                    onCheckedChange={() => handleSelectEstablishment(establishment.id)}
                    className={`h-6 w-6 border-2 border-[#7435db] rounded-md ${
                      selectedEstablishments.includes(establishment.id) ? "bg-[#7435db]" : "bg-transparent"
                    }`}
                  />
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-2 text-[#e5e2e9]">{establishment.name}</h3>
                <p className="text-sm text-[#7a7b9f] mb-2">{establishment.address}</p>
                <p className="text-sm text-[#7a7b9f]">{establishment.phone}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <EstablishmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        establishment={selectedEstablishment}
      />
    </div>
  )
}

