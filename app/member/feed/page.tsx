"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EstablishmentSheet } from "@/components/establishment-sheet"
import { useEstablishment } from "@/contexts/EstablishmentContext"
import { FeaturedBadge } from "@/components/ui/featured-badge"
import type { AvailableEstablishment } from "@/types/establishment"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function FeedPage() {
  const { establishments } = useEstablishment()
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState({
    city: "all",
    category: "all",
    type: "all",
    partnerId: "all",
    minRating: 0,
  })
  const [selectedEstablishment, setSelectedEstablishment] = useState<AvailableEstablishment | null>(null)
  const [activeTab, setActiveTab] = useState("explore")
  const [partners, setPartners] = useState<{ id: string, displayName: string }[]>([])

  useEffect(() => {
    const loadPartners = async () => {
      try {
        const response = await fetch("/api/member/feed")
        if (!response.ok) throw new Error("Erro ao carregar estabelecimentos")
        const data = await response.json()
        
        // Extrair parceiros únicos dos estabelecimentos
        const uniquePartners = Array.from(
          new Set(data.establishments.map((e: any) => e.partnerId))
        ).map(partnerId => {
          const establishment = data.establishments.find((e: any) => e.partnerId === partnerId)
          return {
            id: partnerId,
            displayName: establishment?.partnerName || partnerId
          }
        })
        
        setPartners(uniquePartners)
      } catch (error) {
        console.error("Erro ao carregar parceiros:", error)
      }
    }
    loadPartners()
  }, [])

  // Funções para extrair dados únicos dos estabelecimentos
  const getUniqueCities = () => {
    return Array.from(new Set(establishments.map(e => e.address.city)))
      .sort()
      .map(city => ({ id: city, label: city }))
  }

  const getUniqueCategories = () => {
    return Array.from(new Set(establishments.map(e => e.type.category)))
      .sort()
      .map(category => ({ id: category, label: category }))
  }

  const getUniqueTypes = () => {
    return Array.from(new Set(establishments.map(e => e.type.type)))
      .sort()
      .map(type => ({ id: type, label: type }))
  }

  const getUniquePartners = () => {
    const uniquePartnerIds = Array.from(new Set(establishments.map(e => e.partnerId)))
    return uniquePartnerIds
      .map(partnerId => {
        const partner = partners.find(p => p.id === partnerId)
        return partner ? { id: partnerId, label: partner.displayName } : null
      })
      .filter(Boolean)
      .sort((a, b) => a!.label.localeCompare(b!.label))
  }

  // Filtro modificado para usar os novos campos
  const filteredEstablishments = establishments.filter((establishment) => {
    const matchesSearch =
      establishment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      establishment.type.type.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilters =
      (filters.city === "all" || establishment.address.city === filters.city) &&
      (filters.category === "all" || establishment.type.category === filters.category) &&
      (filters.type === "all" || establishment.type.type === filters.type) &&
      (filters.partnerId === "all" || establishment.partnerId === filters.partnerId) &&
      establishment.rating >= filters.minRating

    return matchesSearch && matchesFilters
  }) as AvailableEstablishment[]

  const featuredEstablishments = filteredEstablishments.filter((establishment) => establishment.isFeatured)

  const handleSearch = (term: string) => {
    setSearchTerm(term)
  }

  const renderEstablishmentCards = (establishments: AvailableEstablishment[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {establishments.map((establishment) => (
        <Card
          key={establishment.id}
          className="overflow-hidden group cursor-pointer bg-[#131320] border-[#1a1b2d] relative"
          onClick={() => setSelectedEstablishment(establishment)}
        >
          <div className="relative aspect-video">
            <img
              src={establishment.images[0] || "/placeholder.svg"}
              alt={establishment.name}
              className="object-cover w-full h-full"
            />
            <div className="absolute top-2 right-2 bg-black/75 text-white pl-2 pr-1 py-1 rounded-full text-sm flex items-center space-x-2">
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
              <span>{establishment.isFeatured && <FeaturedBadge />}</span>
            </div>
            
          </div>
          <div className="p-4 space-y-2">
            <h3 className="font-semibold text-[#e5e2e9] group-hover:text-[#7435db]">{establishment.name}</h3>
            <p className="text-sm text-[#7a7b9f]">
              {establishment.type.type} • {establishment.address.city}
            </p>
          </div>
        </Card>
      ))}
    </div>
  )

  return (
    <div className="container py-6">
      <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#e5e2e9]">Cupons disponíveis</h1>

        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="relative w-full sm:w-[400px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7a7b9f]" />
            <Input
              placeholder="Pesquisar local"
              className="pl-10 bg-[#1a1b2d] text-[#e5e2e9] border-[#131320]"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className="w-full sm:w-auto space-x-2 bg-[#1a1b2d] text-[#e5e2e9] border-[#131320]"
              >
                <Filter className="h-4 w-4" />
                <span>Filtrar</span>
              </Button>
            </SheetTrigger>
            <SheetContent className="bg-[#131320] text-[#e5e2e9]">
              <SheetHeader>
                <SheetTitle className="text-[#e5e2e9]">Filtros</SheetTitle>
                <SheetDescription className="text-[#7a7b9f]">
                  Ajuste os filtros para encontrar o estabelecimento ideal
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-6 py-4">
                <div className="space-y-2">
                  <Label className="text-[#7a7b9f]">Cidade</Label>
                  <Select
                    value={filters.city}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, city: value }))}
                  >
                    <SelectTrigger className="bg-[#1a1b2d] border-[#282942] text-[#e5e2e9]">
                      <SelectValue placeholder="Selecione uma cidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {getUniqueCities().map((city) => (
                        <SelectItem key={city.id} value={city.id}>
                          {city.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[#7a7b9f]">Categoria</Label>
                  <Select
                    value={filters.category}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger className="bg-[#1a1b2d] border-[#282942] text-[#e5e2e9]">
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {getUniqueCategories().map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[#7a7b9f]">Tipo</Label>
                  <Select
                    value={filters.type}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger className="bg-[#1a1b2d] border-[#282942] text-[#e5e2e9]">
                      <SelectValue placeholder="Selecione um tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {getUniqueTypes().map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[#7a7b9f]">Partner</Label>
                  <Select
                    value={filters.partnerId}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, partnerId: value }))}
                  >
                    <SelectTrigger className="bg-[#1a1b2d] border-[#282942] text-[#e5e2e9]">
                      <SelectValue placeholder="Selecione um partner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {getUniquePartners().map((partner) => (
                        <SelectItem key={partner.id} value={partner.id}>
                          {partner.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <Label className="text-[#7a7b9f]">Avaliação Mínima</Label>
                  <Slider
                    min={0}
                    max={5}
                    step={0.5}
                    value={[filters.minRating]}
                    onValueChange={([value]) => setFilters(prev => ({ ...prev, minRating: value }))}
                  />
                  <div className="text-right text-[#7a7b9f]">{filters.minRating} estrelas</div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <Tabs defaultValue="explore" className="mb-6">
        <TabsList className="bg-[#1a1b2d] text-[#e5e2e9]">
          <TabsTrigger value="explore" onClick={() => setActiveTab("explore")}>
            Explorar
          </TabsTrigger>
          <TabsTrigger value="featured" onClick={() => setActiveTab("featured")}>
            Destaques
          </TabsTrigger>
        </TabsList>
        <TabsContent value="explore">{renderEstablishmentCards(filteredEstablishments)}</TabsContent>
        <TabsContent value="featured">{renderEstablishmentCards(featuredEstablishments)}</TabsContent>
      </Tabs>

      <EstablishmentSheet
        establishment={selectedEstablishment}
        isOpen={!!selectedEstablishment}
        onClose={() => setSelectedEstablishment(null)}
      />
    </div>
  )
}
