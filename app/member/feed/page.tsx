"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, Filter, AlertTriangle, LockIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EstablishmentSheet } from "@/components/establishment-sheet"
import { useEstablishment } from "@/contexts/EstablishmentContext"
import { FeaturedBadge } from "@/components/ui/featured-badge"
import { Skeleton } from "@/components/ui/skeleton" 
import type { AvailableEstablishment } from "@/types/establishment"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useSubscription } from "@/contexts/subscription-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

interface FeedStatus {
  status: "active" | "pending" | "canceled" | "none" | "loading";
  message?: string;
  defaultPaymentLink?: {
    id: string;
    code: string;
    lastlinkUrl?: string;
    name?: string;
    [key: string]: any;
  };
}

interface Subscription {
  id: string;
  memberId: string;
  partnerId: string;
  status: string;
  expiresAt?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export default function FeedPage() {
  const router = useRouter()
  const { establishments } = useEstablishment()
  const { user } = useAuth()
  const { loadMemberSubscriptions, subscriptions, hasAnyActiveSubscription } = useSubscription()
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
  const [feedStatus, setFeedStatus] = useState<FeedStatus>({
    status: "loading"
  })
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const [establishmentsData, setEstablishmentsData] = useState<any[]>([])
  const [subscriptionsLoaded, setSubscriptionsLoaded] = useState(false)

  // Verificar se o usuário tem uma assinatura ativa usando o contexto de assinatura
  useEffect(() => {
    const checkSubscription = async () => {
      // Verificar se o usuário está autenticado
      if (!user) {
        setFeedStatus({
          status: "none",
          message: "Você precisa estar logado para acessar os cupons."
        });
        return;
      }
      
      try {
        // Verificar assinatura usando as novas funções robustas que checam por ID e email
        const userId = user.uid;
        const userEmail = user.email;
        
        console.log("Verificando assinatura para:", { userId, userEmail });
        
        // Usar a nova função que verifica por ID e email
        const hasActiveSubscription = await hasAnyActiveSubscription(userId, userEmail);
        
        console.log("Status da assinatura:", hasActiveSubscription ? "Ativa" : "Inativa");
        
        if (hasActiveSubscription) {
          setFeedStatus({ status: "active" });
          return;
        }
        
        // Se não encontrou assinatura ativa, carregar assinaturas
        if (!subscriptionsLoaded) {
          if (userId) await loadMemberSubscriptions(userId);
          setSubscriptionsLoaded(true);
        }
        
        // Verificar pendentes ou canceladas
        const pendingStatuses = ["past_due", "incomplete", "unpaid", "pendente"];
        const canceledStatuses = ["canceled", "cancelled", "cancelada", "inactive", "inativa"];
        
        const hasPendingSubscription = subscriptions.some(sub => 
          pendingStatuses.includes(String(sub.status))
        );
        
        const hasCanceledSubscription = subscriptions.some(sub => 
          canceledStatuses.includes(String(sub.status))
        );
        
        // Buscar o link padrão
        const response = await fetch("/api/links/default", {
          credentials: "include"
        });
        
        let defaultLink = null;
        if (response.ok) {
          defaultLink = await response.json();
        }
        
        // Definir status apropriado
        setFeedStatus({
          status: hasPendingSubscription ? "pending" : hasCanceledSubscription ? "canceled" : "none",
          message: hasPendingSubscription 
            ? "Sua assinatura está pendente de pagamento. Após a confirmação do pagamento, você terá acesso aos cupons."
            : hasCanceledSubscription
              ? "Sua assinatura foi cancelada. Para continuar acessando os cupons, é necessário adquirir uma nova assinatura."
              : "Você não possui uma assinatura ativa. Para acessar os cupons, adquira uma assinatura.",
          defaultPaymentLink: defaultLink
        });
      } catch (error) {
        console.error("Erro ao verificar assinatura:", error);
        setFeedStatus({
          status: "none",
          message: "Ocorreu um erro ao verificar sua assinatura. Tente novamente mais tarde."
        });
      }
    };
    
    checkSubscription();
  }, [user, hasAnyActiveSubscription, loadMemberSubscriptions, subscriptionsLoaded, subscriptions]);

  // Carregar estabelecimentos da API
  useEffect(() => {
    const loadEstablishments = async () => {
      try {
        const response = await fetch("/api/member/feed", {
          credentials: "include",
          headers: {
            "x-session-token": localStorage.getItem("session_token") || "",
          }
        })
        
        if (!response.ok) {
          throw new Error("Erro ao carregar estabelecimentos")
        }
        
        const data = await response.json()
        
        if (data.establishments && Array.isArray(data.establishments)) {
          setEstablishmentsData(data.establishments)
          
          // Extrair parceiros únicos dos estabelecimentos
          const uniquePartners = Array.from(
            new Set(data.establishments.map((e: any) => e.partnerId))
          ).map(partnerId => {
            const establishment = data.establishments.find((e: any) => e.partnerId === partnerId)
            return {
              id: String(partnerId), 
              displayName: establishment?.partnerName || String(partnerId)
            }
          }) as { id: string, displayName: string }[]
          
          setPartners(uniquePartners)
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error)
      }
    }
    
    loadEstablishments()
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

  // Filtro para os estabelecimentos - sempre aplicamos os filtros
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

  const featuredEstablishments = filteredEstablishments.filter((establishment) => 
    establishment.isFeatured
  )

  const handleSearch = (term: string) => {
    setSearchTerm(term)
  }

  const handleEstablishmentClick = (establishment: AvailableEstablishment) => {
    // Verificar se o usuário tem uma assinatura ativa
    if (feedStatus.status !== "active") {
      // Se não tiver, mostrar o modal de assinatura
      setShowSubscriptionModal(true)
    } else {
      // Se tiver, mostrar o detalhe do estabelecimento
      setSelectedEstablishment(establishment)
    }
  }

  const handleSubscriptionPurchase = () => {
    // Redirecionar para o link padrão de assinatura
    if (feedStatus.defaultPaymentLink?.lastlinkUrl) {
      window.location.href = feedStatus.defaultPaymentLink.lastlinkUrl
    } else if (feedStatus.defaultPaymentLink?.code) {
      router.push(`/checkout/${feedStatus.defaultPaymentLink.code}`)
    } else {
      // Caso não tenha um link padrão, redirecionar para a página de planos
      router.push("/planos")
    }
  }

  const renderEstablishmentCards = (establishments: AvailableEstablishment[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {establishments.map((establishment) => (
        <Card
          key={establishment.id}
          className={`overflow-hidden group cursor-pointer bg-zinc-50 border-zinc-100 relative ${feedStatus.status !== "active" ? "opacity-95" : ""}`}
          onClick={() => handleEstablishmentClick(establishment)}
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
            
            {/* Ícone de cadeado para indicar conteúdo bloqueado */}
            {feedStatus.status !== "active" && (
              <div className="absolute top-2 left-2 bg-black/75 text-white p-1 rounded-full">
                <LockIcon className="w-4 h-4" />
              </div>
            )}
          </div>
          <div className="p-4 space-y-2">
            <h3 className="font-semibold text-zinc-500 group-hover:text-zinc-500">{establishment.name}</h3>
            <p className="text-sm text-zinc-400">
              {establishment.type.type} • {establishment.address.city}
            </p>
          </div>
        </Card>
      ))}
    </div>
  )

  // Renderizar skeletons para o estado de carregamento
  const renderSkeletons = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <Card key={i} className="overflow-hidden bg-zinc-50 border-zinc-100">
          <div className="aspect-video">
            <Skeleton className="h-full w-full" />
          </div>
          <div className="p-4 space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </Card>
      ))}
    </div>
  )

  return (
    <div className="container py-6">
      <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold text-zinc-500">Cupons disponíveis</h1>

        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="relative w-full sm:w-[400px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Pesquisar local"
              className="pl-10 bg-zinc-100 text-zinc-500 border-zinc-200"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className="w-full sm:w-auto space-x-2 bg-zinc-100 text-zinc-500 border-zinc-200"
              >
                <Filter className="h-4 w-4" />
                <span>Filtrar</span>
              </Button>
            </SheetTrigger>
            <SheetContent className="bg-zinc-100 text-zinc-500 overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="text-zinc-500">Filtros</SheetTitle>
                <SheetDescription className="text-zinc-400">
                  Ajuste os filtros para encontrar o estabelecimento ideal
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-6 py-4">
                <div className="space-y-2">
                  <Label className="text-zinc-400">Cidade</Label>
                  <Select
                    value={filters.city}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, city: value }))}
                  >
                    <SelectTrigger className="bg-zinc-100 border-zinc-300 text-zinc-500">
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
                  <Label className="text-zinc-400">Categoria</Label>
                  <Select
                    value={filters.category}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger className="bg-zinc-100 border-zinc-300 text-zinc-500">
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
                  <Label className="text-zinc-400">Tipo</Label>
                  <Select
                    value={filters.type}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger className="bg-zinc-100 border-zinc-300 text-zinc-500">
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
                  <Label className="text-zinc-400">Partner</Label>
                  <Select
                    value={filters.partnerId}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, partnerId: value }))}
                  >
                    <SelectTrigger className="bg-zinc-100 border-zinc-300 text-zinc-500">
                      <SelectValue placeholder="Selecione um partner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {getUniquePartners().map((partner) => partner && (
                        <SelectItem key={partner.id} value={partner.id}>
                          {partner.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-zinc-400">Avaliação Mínima</Label>
                    <span className="text-zinc-400">{filters.minRating}</span>
                  </div>
                  <Slider
                    value={[filters.minRating]}
                    min={0}
                    max={5}
                    step={0.5}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, minRating: value[0] }))}
                  />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Mensagem de status quando não está ativo e não está carregando */}
      {feedStatus.status !== "active" && feedStatus.status !== "loading" && (
        <div className="mb-6 bg-amber-50 p-4 rounded-lg border border-amber-200">
          <div className="flex items-start gap-3">
            <AlertTriangle 
              className={`h-5 w-5 ${feedStatus.status === 'pending' ? 'text-amber-500' : 'text-red-500'} mt-1 flex-shrink-0`} 
            />
            <div>
              <h3 className="font-medium text-amber-700">
                {feedStatus.status === 'pending' 
                  ? 'Assinatura Pendente' 
                  : feedStatus.status === 'canceled' 
                    ? 'Assinatura Cancelada' 
                    : 'Sem Assinatura Ativa'}
              </h3>
              <p className="text-sm text-amber-600 mb-2">
                {feedStatus.message || 'Você precisa de uma assinatura ativa para acessar os cupons.'}
              </p>
              {(feedStatus.status === 'canceled' || feedStatus.status === 'none') && feedStatus.defaultPaymentLink && (
                <Button 
                  size="sm"
                  onClick={handleSubscriptionPurchase}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  Quero assinar o clube
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo principal - sempre mostrado, independente do status */}
      {feedStatus.status === "loading" ? (
        renderSkeletons()
      ) : (
        <div className="space-y-10">
          {featuredEstablishments.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-zinc-500 mb-4">Em destaque</h2>
              {renderEstablishmentCards(featuredEstablishments)}
            </div>
          )}

          <div>
            <h2 className="text-xl font-semibold text-zinc-500 mb-4">Explore todos os cupons</h2>
            {filteredEstablishments.length > 0 ? (
              renderEstablishmentCards(filteredEstablishments)
            ) : (
              <div className="text-center p-10 bg-zinc-50 rounded-xl border border-zinc-100">
                <p className="text-zinc-400">Nenhum resultado encontrado com os filtros selecionados</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal para quando o usuário tenta acessar um estabelecimento sem assinatura */}
      <Dialog open={showSubscriptionModal} onOpenChange={setShowSubscriptionModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl text-center">Assinatura Necessária</DialogTitle>
            <DialogDescription className="text-center pt-2">
              {feedStatus.message || "Você precisa de uma assinatura ativa para acessar este cupom."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-center p-6">
            <div className="bg-zinc-100 p-6 rounded-full">
              <LockIcon className="h-12 w-12 text-amber-500" />
            </div>
          </div>
          
          <DialogFooter className="sm:justify-center">
            <Button 
              size="xl"
              onClick={handleSubscriptionPurchase}
              className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[200px] text-lg"
            >
              Quero assinar o clube
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedEstablishment && (
        <EstablishmentSheet
          establishment={selectedEstablishment}
          isOpen={!!selectedEstablishment}
          onClose={() => setSelectedEstablishment(null)}
        />
      )}
    </div>
  )
}
