"use client"

import { useState } from "react"
import { useEstablishment } from "@/contexts/EstablishmentContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Star } from "lucide-react"
import { EstablishmentCard } from "@/components/establishment-card"
import { EstablishmentModal } from "@/components/establishment-modal"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"

export default function EstablishmentsPage() {
  const { establishments, updateEstablishment } = useEstablishment()
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedEstablishment, setSelectedEstablishment] = useState(null)
  const [selectedItems, setSelectedItems] = useState<string[]>([])

  const filteredEstablishments = establishments.filter((establishment) => {
    const searchLower = searchTerm.toLowerCase()
    
    const nameMatch = establishment.name?.toLowerCase().includes(searchLower) || false
    const streetMatch = establishment.address?.street?.toLowerCase().includes(searchLower) || false
    const neighborhoodMatch = establishment.address?.neighborhood?.toLowerCase().includes(searchLower) || false
    const cityMatch = establishment.address?.city?.toLowerCase().includes(searchLower) || false

    return nameMatch || streetMatch || neighborhoodMatch || cityMatch
  })

  const handleOpenModal = (establishment = null) => {
    setSelectedEstablishment(establishment)
    setIsModalOpen(true)
  }

  const handleSelect = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleFeature = async () => {
    try {
      for (const id of selectedItems) {
        const establishment = establishments.find((e) => e.id === id)
        if (establishment) {
          await updateEstablishment(id, {
            ...establishment,
            isFeatured: true
          })
        }
      }
      setSelectedItems([])
      toast.success("Estabelecimentos marcados como destaque")
    } catch (error) {
      console.error("Erro ao marcar estabelecimentos:", error)
      toast.error("Erro ao marcar estabelecimentos como destaque")
    }
  }

  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Buscar estabelecimentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 bg-zinc-100 border-zinc-200"
          />
        </div>
        <div className="flex gap-2">
          {selectedItems.length > 0 && (
            <Button
              onClick={handleFeature}
              className="bg-yellow-500 hover:bg-yellow-600 text-white"
            >
              <Star className="mr-2 h-4 w-4" /> Marcar como Destaque
            </Button>
          )}
          <Button
            onClick={() => handleOpenModal()}
            className="bg-primary hover:bg-[#a85fdd] text-white"
          >
            <Plus className="mr-2 h-4 w-4" /> Novo Estabelecimento
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEstablishments.map((establishment) => (
          <div key={establishment.id} className="relative">
            <div className="absolute top-2 left-2 z-10">
              <Checkbox
                checked={selectedItems.includes(establishment.id)}
                onCheckedChange={() => handleSelect(establishment.id)}
                className="bg-white"
              />
            </div>
            <EstablishmentCard
              establishment={establishment}
              onEdit={() => handleOpenModal(establishment)}
            />
          </div>
        ))}
      </div>

      <EstablishmentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedEstablishment(null)
        }}
        establishment={selectedEstablishment}
      />
    </div>
  )
}
