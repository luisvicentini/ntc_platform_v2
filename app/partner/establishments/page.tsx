"use client"

import { useState, useEffect } from "react"
import { useEstablishment } from "@/contexts/EstablishmentContext"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Award, ChevronDown, Plus, Power, Search, Star, Trash2, Edit, Filter, X } from "lucide-react"
import { EstablishmentCard } from "@/components/establishment-card"
import { EstablishmentModal } from "@/components/establishment-modal"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import type { Establishment, AvailableEstablishment } from "@/types/establishment"
import { FeaturedBadge } from "@/components/ui/featured-badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent } from "@/components/ui/card"

export default function EstablishmentsPage() {
  const { establishments, toggleFeatured, updateEstablishment, refreshEstablishments } = useEstablishment()
  const auth = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedEstablishment, setSelectedEstablishment] = useState<Establishment | AvailableEstablishment | null>(null)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [processingItems, setProcessingItems] = useState<boolean>(false)
  
  // Estados para os filtros
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [featuredFilter, setFeaturedFilter] = useState<boolean | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [cityFilter, setCityFilter] = useState<string | null>(null)
  const [minRatingFilter, setMinRatingFilter] = useState<number>(0)
  const [showFilters, setShowFilters] = useState(false)
  
  // Extrair listas de valores únicos para os seletores de filtro
  const categories = establishments
    .map(e => e.type?.category)
    .filter((category): category is string => Boolean(category))
    .filter((category, index, self) => self.indexOf(category) === index)
    
  const cities = establishments
    .map(e => e.address?.city)
    .filter((city): city is string => Boolean(city))
    .filter((city, index, self) => self.indexOf(city) === index)
  
  // Contador de filtros ativos
  const activeFiltersCount = [
    statusFilter !== "all",
    featuredFilter !== null,
    categoryFilter !== null,
    cityFilter !== null,
    minRatingFilter > 0
  ].filter(Boolean).length
  
  // Limpar todos os filtros
  const clearFilters = () => {
    setStatusFilter("all")
    setFeaturedFilter(null)
    setCategoryFilter(null)
    setCityFilter(null)
    setMinRatingFilter(0)
  }

  // Filtrar estabelecimentos por termo de busca e outros filtros
  const filteredEstablishments = establishments.filter((establishment) => {
    // Verificar o termo de busca
    const searchLower = searchTerm.toLowerCase()
    const nameMatch = establishment.name?.toLowerCase().includes(searchLower) || false
    const streetMatch = establishment.address?.street?.toLowerCase().includes(searchLower) || false
    const neighborhoodMatch = establishment.address?.neighborhood?.toLowerCase().includes(searchLower) || false
    const cityMatch = establishment.address?.city?.toLowerCase().includes(searchLower) || false
    const searchMatches = nameMatch || streetMatch || neighborhoodMatch || cityMatch
    
    if (!searchMatches) return false
    
    // Filtro de status
    if (statusFilter !== "all") {
      if (statusFilter === "active" && establishment.status !== "active") return false
      if (statusFilter === "inactive" && establishment.status !== "inactive") return false
    }
    
    // Filtro de destaque
    if (featuredFilter !== null) {
      if (featuredFilter && !establishment.isFeatured) return false
      if (!featuredFilter && establishment.isFeatured) return false
    }
    
    // Filtro de categoria
    if (categoryFilter && establishment.type?.category !== categoryFilter) return false
    
    // Filtro de cidade
    if (cityFilter && establishment.address?.city !== cityFilter) return false
    
    // Filtro de avaliação mínima
    if (minRatingFilter > 0 && (!establishment.rating || establishment.rating < minRatingFilter)) return false
    
    return true
  })

  // Verifica se o usuário tem permissão para gerenciar estabelecimentos
  const canManageEstablishments = () => {
    if (!auth.user) return false
    
    // Tanto usuários master quanto partners podem gerenciar estabelecimentos
    return auth.user.userType === "master" || auth.user.userType === "partner"
  }

  const handleOpenModal = (establishment: Establishment | AvailableEstablishment | null = null) => {
    setSelectedEstablishment(establishment)
    setIsModalOpen(true)
  }

  const handleSelect = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleToggleStatus = async (id: string) => {
    try {
      const establishment = establishments.find((e) => e.id === id)
      if (!establishment || !canManageEstablishments()) return

      const newStatus = establishment.status === "active" ? "inactive" : "active"
      
      await updateEstablishment(id, {
        ...establishment,
        status: newStatus
      })
      
      await refreshEstablishments(true)
      toast.success(`Estabelecimento ${newStatus === "active" ? "ativado" : "desativado"} com sucesso`)
    } catch (error) {
      console.error("Erro ao alterar status:", error)
      toast.error("Erro ao alterar status do estabelecimento")
    }
  }

  // Função para marcar/desmarcar destaque de um estabelecimento individual
  const handleToggleFeatured = async (id: string) => {
    try {
      const establishment = establishments.find((e) => e.id === id)
      if (!establishment || !canManageEstablishments()) return
      
      await toggleFeatured(id)
      
      // Forçar atualização para refletir a mudança na UI
      await refreshEstablishments(true)
      
      toast.success(
        establishment.isFeatured 
          ? "Destaque removido do estabelecimento" 
          : "Estabelecimento marcado como destaque"
      )
    } catch (error) {
      console.error("Erro ao alterar destaque:", error)
      toast.error("Erro ao alterar status de destaque")
    }
  }

  // Ações em lote para os itens selecionados
  const handleMarkAsFeatured = async () => {
    try {
      setProcessingItems(true)
      for (const id of selectedItems) {
        const establishment = establishments.find((e) => e.id === id)
        if (establishment && !establishment.isFeatured && canManageEstablishments()) {
          await toggleFeatured(id)
        }
      }
      setSelectedItems([])
      await refreshEstablishments(true)
      toast.success("Estabelecimentos marcados como destaque")
    } catch (error) {
      console.error("Erro ao marcar estabelecimentos:", error)
      toast.error("Erro ao marcar estabelecimentos como destaque")
    } finally {
      setProcessingItems(false)
    }
  }

  const handleRemoveFeature = async () => {
    try {
      setProcessingItems(true)
      for (const id of selectedItems) {
        const establishment = establishments.find((e) => e.id === id)
        if (establishment && establishment.isFeatured && canManageEstablishments()) {
          await toggleFeatured(id)
        }
      }
      setSelectedItems([])
      await refreshEstablishments(true)
      toast.success("Destaque removido dos estabelecimentos")
    } catch (error) {
      console.error("Erro ao remover destaque:", error)
      toast.error("Erro ao remover destaque dos estabelecimentos")
    } finally {
      setProcessingItems(false)
    }
  }

  const handleBulkDisable = async () => {
    try {
      setProcessingItems(true)
      for (const id of selectedItems) {
        const establishment = establishments.find((e) => e.id === id)
        if (establishment && establishment.status === "active" && canManageEstablishments()) {
          await updateEstablishment(id, {
            ...establishment,
            status: "inactive"
          })
        }
      }
      setSelectedItems([])
      await refreshEstablishments(true)
      toast.success("Estabelecimentos desativados com sucesso")
    } catch (error) {
      console.error("Erro ao desativar estabelecimentos:", error)
      toast.error("Erro ao desativar estabelecimentos")
    } finally {
      setProcessingItems(false)
    }
  }

  const handleBulkDelete = async () => {
    if (!confirm("Tem certeza que deseja excluir os estabelecimentos selecionados? Esta ação não pode ser desfeita.")) return;
    
    try {
      setProcessingItems(true)
      for (const id of selectedItems) {
        const establishment = establishments.find((e) => e.id === id)
        if (establishment && canManageEstablishments()) {
          // No Firestore, estamos usando soft delete (marcando como inativo)
          await updateEstablishment(id, {
            ...establishment,
            status: "inactive"
          })
        }
      }
      setSelectedItems([])
      await refreshEstablishments(true)
      toast.success("Estabelecimentos excluídos com sucesso")
    } catch (error) {
      console.error("Erro ao excluir estabelecimentos:", error)
      toast.error("Erro ao excluir estabelecimentos")
    } finally {
      setProcessingItems(false)
    }
  }

  // Verifica se algum estabelecimento selecionado está marcado como destaque
  const anySelectedIsFeatured = selectedItems.length > 0 && 
    selectedItems.some(id => {
      const establishment = establishments.find(e => e.id === id)
      return establishment?.isFeatured
    })

  // Verifica se todos os estabelecimentos selecionados estão marcados como destaque
  const allSelectedAreFeatured = selectedItems.length > 0 && 
    selectedItems.every(id => {
      const establishment = establishments.find(e => e.id === id)
      return establishment?.isFeatured
    })

  const clubName = process.env.NEXT_PUBLIC_APP_PROJECTNAME

  return (
    <div className="container py-6">
      <div className="flex flex-col space-y-4 mb-6">
        <div className="flex justify-between items-center">
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Buscar estabelecimentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 bg-zinc-100 border-zinc-200 w-[300px]"
              />
            </div>
            
            <Popover open={showFilters} onOpenChange={setShowFilters}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filtros
                  {activeFiltersCount > 0 && (
                    <Badge className="ml-1 bg-primary text-white">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[350px] p-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">Filtros</h3>
                    {activeFiltersCount > 0 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={clearFilters}
                        className="h-8 px-2 text-xs"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Limpar filtros
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Status
                      </label>
                      <Select 
                        value={statusFilter} 
                        onValueChange={(value) => setStatusFilter(value as "all" | "active" | "inactive")}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Todos os status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="active">Ativos</SelectItem>
                          <SelectItem value="inactive">Inativos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Destaque
                      </label>
                      <Select 
                        value={featuredFilter === null ? "all" : featuredFilter ? "featured" : "not-featured"} 
                        onValueChange={(value) => {
                          if (value === "all") setFeaturedFilter(null)
                          else if (value === "featured") setFeaturedFilter(true)
                          else setFeaturedFilter(false)
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="featured">Em Destaque</SelectItem>
                          <SelectItem value="not-featured">Sem Destaque</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Categoria
                      </label>
                      <Select 
                        value={categoryFilter || "all"} 
                        onValueChange={(value) => setCategoryFilter(value === "all" ? null : value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Todas as categorias" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas</SelectItem>
                          {categories.map(category => (
                            <SelectItem key={category} value={category}>{category}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Cidade
                      </label>
                      <Select 
                        value={cityFilter || "all"} 
                        onValueChange={(value) => setCityFilter(value === "all" ? null : value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Todas as cidades" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas</SelectItem>
                          {cities.map(city => (
                            <SelectItem key={city} value={city}>{city}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Pontuação mínima: {minRatingFilter === 0 ? 'Qualquer' : minRatingFilter.toFixed(1)}
                      </label>
                      <Slider 
                        min={0} 
                        max={5} 
                        step={0.5} 
                        value={[minRatingFilter]}
                        onValueChange={(values) => setMinRatingFilter(values[0])}
                        className="py-4"
                      />
                    </div>
                  </div>
                  
                  <div className="pt-2 flex justify-end">
                    <Button onClick={() => setShowFilters(false)}>
                      Aplicar filtros
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="flex gap-2">
            {selectedItems.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    className="bg-zinc-800 hover:bg-zinc-700 text-white"
                    disabled={processingItems}
                  >
                    Ações <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {!allSelectedAreFeatured && (
                    <DropdownMenuItem onClick={handleMarkAsFeatured}>
                      <Star className="mr-2 h-4 w-4" /> Marcar como destaque
                    </DropdownMenuItem>
                  )}
                  {anySelectedIsFeatured && (
                    <DropdownMenuItem onClick={handleRemoveFeature}>
                      <Award className="mr-2 h-4 w-4" /> Desmarcar destaque
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleBulkDisable}>
                    <Power className="mr-2 h-4 w-4" /> Desabilitar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleBulkDelete}
                    className="text-red-500 focus:text-red-500"
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Button
              onClick={() => handleOpenModal()}
              className="bg-primary hover:bg-red-700 text-white"
            >
              <Plus className="mr-2 h-4 w-4" /> Novo Estabelecimento
            </Button>
          </div>
        </div>
        
        {/* Mostrar filtros ativos */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {statusFilter !== "all" && (
              <Badge variant="secondary" className="py-1 px-3">
                Status: {statusFilter === "active" ? "Ativo" : "Inativo"}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => setStatusFilter("all")} 
                />
              </Badge>
            )}
            
            {featuredFilter !== null && (
              <Badge variant="secondary" className="py-1 px-3">
                {featuredFilter ? "Em destaque" : "Sem destaque"}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => setFeaturedFilter(null)} 
                />
              </Badge>
            )}
            
            {categoryFilter && (
              <Badge variant="secondary" className="py-1 px-3">
                Categoria: {categoryFilter}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => setCategoryFilter(null)} 
                />
              </Badge>
            )}
            
            {cityFilter && (
              <Badge variant="secondary" className="py-1 px-3">
                Cidade: {cityFilter}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => setCityFilter(null)} 
                />
              </Badge>
            )}
            
            {minRatingFilter > 0 && (
              <Badge variant="secondary" className="py-1 px-3">
                Pontuação: ≥ {minRatingFilter.toFixed(1)}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => setMinRatingFilter(0)} 
                />
              </Badge>
            )}
          </div>
        )}
      </div>

      {filteredEstablishments.length === 0 ? (
        <Card className="w-full text-center p-8">
          <CardContent className="pt-6">
            <p className="text-zinc-500">Nenhum estabelecimento encontrado com os filtros selecionados.</p>
            {activeFiltersCount > 0 && (
              <Button 
                variant="link" 
                onClick={clearFilters} 
                className="mt-2"
              >
                Limpar todos os filtros
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
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
              
              <div className="absolute top-1 left-8 text-white py-1 rounded-full text-sm flex items-center space-x-2 z-10">
                <span>{establishment.isFeatured && <FeaturedBadge />}</span>
              </div>
              
              {/* Botão de toggle destaque individual */}
              {canManageEstablishments() && (
                <div className="absolute top-2 right-2 z-10">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleFeatured(establishment.id);
                    }}
                    size="sm"
                    variant="outline"
                    className={`w-8 h-8 p-0 ${establishment.isFeatured ? 'bg-yellow-500 text-white hover:bg-yellow-600' : 'bg-white hover:bg-gray-100'}`}
                  >
                    <Star className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              <EstablishmentCard
                establishment={establishment}
                onEdit={() => handleOpenModal(establishment)}
                actions={
                  canManageEstablishments() && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        <Switch
                          checked={establishment.status === "active"}
                          onCheckedChange={() => handleToggleStatus(establishment.id)}
                          className="mr-2"
                        />
                        <span className="text-xs text-zinc-500">
                          {establishment.status === "active" ? "Ativo" : "Inativo"}
                        </span>
                      </div>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenModal(establishment);
                        }}
                        variant="outline"
                        size="sm"
                        className="bg-zinc-100 border-zinc-200 hover:bg-zinc-100 hover:text-zinc-500"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                    </div>
                  )
                }
              />
            </div>
          ))}
        </div>
      )}

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
