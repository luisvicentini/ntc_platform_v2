"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, Filter, AlertTriangle, LockIcon, ChevronLeft, ChevronRight, Ticket } from "lucide-react"
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
import { StoriesContainer } from "@/components/stories/stories-container"
import { Story } from "@/components/stories/story-viewer"
import { ProductCarousel, Product } from "@/components/products/product-carousel"
import { ProductSheet } from "@/components/products/product-sheet"

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

// Interface simplificada para representar um estabelecimento no feed
interface FeedEstablishment {
  id: string;
  name: string;
  images: string[];
  rating: number;
  isFeatured?: boolean;
  partnerId: string;
  partnerName?: string;
  address?: {
    city?: string;
    [key: string]: any;
  };
  type?: {
    type?: string;
    category?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

// Interface para agrupar estabelecimentos por categoria
interface CategoryGroup {
  category: string;
  establishments: FeedEstablishment[];
}

export default function FeedPage() {
  const router = useRouter()
  // Removemos a dependência do useEstablishment para evitar confusão
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
  const [selectedEstablishment, setSelectedEstablishment] = useState<FeedEstablishment | null>(null)
  const [activeTab, setActiveTab] = useState("explore")
  const [partners, setPartners] = useState<{ id: string, displayName: string }[]>([])
  const [feedStatus, setFeedStatus] = useState<FeedStatus>({
    status: "loading"
  })
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const [establishmentsData, setEstablishmentsData] = useState<FeedEstablishment[]>([])
  const [subscriptionsLoaded, setSubscriptionsLoaded] = useState(false)
  const [stories, setStories] = useState<Story[]>([])
  const [loadingStories, setLoadingStories] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  
  // Ref para cada carrossel por categoria
  const carouselRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Carregar produtos da API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true)
        console.log("Tentando buscar produtos da API...")
        
        // Buscar token da sessão armazenado
        const sessionToken = localStorage.getItem("session_token") || ""
        console.log("Token de sessão disponível:", !!sessionToken)
        
        const response = await fetch("/api/products", {
          credentials: "include",
          headers: {
            "x-session-token": sessionToken,
            "x-auth-uid": user?.uid || "",
            "x-auth-email": user?.email || ""
          }
        })
        
        console.log("Status da resposta da API de produtos:", response.status)
        
        // Mesmo em caso de erro 500, tentar processar a resposta JSON
        const data = await response.json().catch(e => {
          console.error("Erro ao processar JSON da resposta:", e)
          return { products: [] }
        })
        
        console.log("Dados de produtos recebidos:", data)
        
        if (data.products && Array.isArray(data.products)) {
          console.log(`Recebidos ${data.products.length} produtos`)
          if (data.products.length > 0) {
            setProducts(data.products)
          } else {
            console.warn("Nenhum produto encontrado na API")
            setProducts([])
          }
        } else {
          console.warn("API retornou um formato inesperado:", data)
          setProducts([])
        }
        
        // Verificar se houve erro na API
        if (data.error) {
          console.error("API retornou erro:", data.error, data.details || "")
        }
      } catch (error) {
        console.error("Erro ao carregar produtos:", error)
        setProducts([])
      } finally {
        setLoadingProducts(false)
      }
    }
    
    // Carregar produtos independentemente do status de autenticação do usuário
    fetchProducts()
  }, [])

  // Função para obter saudação com base no horário
  const getGreeting = () => {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) return "Bom dia";
    if (hour >= 12 && hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  // Função para obter o nome do usuário a partir de várias propriedades possíveis
  const getUserName = () => {
    if (!user) return 'visitante';
    
    // Log para debug - vamos ver o que contém o objeto de usuário
    console.log("Dados do usuário:", {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      properties: Object.keys(user)
    });
    
    // Usar type casting seguro para acessar propriedades que podem não estar no tipo
    const userAny = user as any;
    
    // Tentar diferentes propriedades onde o nome pode estar armazenado
    return user.displayName || 
           userAny.name || 
           userAny.businessName || 
           userAny.firstName || 
           (userAny.firstName && userAny.lastName ? `${userAny.firstName} ${userAny.lastName}` : null) || 
           user.email?.split('@')[0] || 
           'visitante';
  };

  // Função para agrupar estabelecimentos por categoria
  const groupEstablishmentsByCategory = (establishments: FeedEstablishment[]): CategoryGroup[] => {
    const groupedMap = new Map<string, FeedEstablishment[]>();
    
    // Primeiro, agrupar por categoria
    establishments.forEach(establishment => {
      const category = establishment.type?.category || "Sem categoria";
      
      if (!groupedMap.has(category)) {
        groupedMap.set(category, []);
      }
      
      groupedMap.get(category)!.push(establishment);
    });
    
    // Converter o mapa em array de CategoryGroup
    const result: CategoryGroup[] = [];
    groupedMap.forEach((establishments, category) => {
      result.push({
        category,
        establishments
      });
    });
    
    // Ordenar categorias alfabeticamente
    return result.sort((a, b) => a.category.localeCompare(b.category));
  };

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
        const hasActiveSubscription = await hasAnyActiveSubscription(userId || undefined, userEmail || undefined);
        
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
        console.log("Carregando estabelecimentos da API...");
        const response = await fetch("/api/member/feed", {
          credentials: "include",
          headers: {
            "x-session-token": localStorage.getItem("session_token") || "",
          }
        });
        
        if (!response.ok) {
          throw new Error("Erro ao carregar estabelecimentos");
        }
        
        const data = await response.json();
        console.log("Dados recebidos da API:", data);
        
        if (data.establishments && Array.isArray(data.establishments)) {
          console.log(`Recebidos ${data.establishments.length} estabelecimentos`);
          
          // Log do primeiro estabelecimento para debug
          console.log("Exemplo de estabelecimento recebido da API:", data.establishments[0]);
          
          // Garantir que todos os estabelecimentos tenham as propriedades necessárias
          const processedEstablishments = data.establishments.map((est: any) => ({
            id: est.id || "",
            name: est.name || "Estabelecimento sem nome",
            images: Array.isArray(est.images) ? est.images : [],
            rating: typeof est.rating === 'number' ? est.rating : 0,
            isFeatured: !!est.isFeatured,
            partnerId: est.partnerId || "",
            partnerName: est.partnerName || "",
            address: est.address || { city: "Cidade não informada" },
            type: est.type || { type: "Tipo não informado", category: "Categoria não informada" },
            // Incluir todos os outros campos necessários
            phone: est.phone || { ddi: "55", phone: "" },
            discountValue: est.discountValue || "",
            voucherDescription: est.voucherDescription || "",
            voucherExpiration: est.voucherExpiration || "",
            openingHours: est.openingHours || "",
            description: est.description || "",
            discountRules: est.discountRules || "",
            usageLimit: est.usageLimit || ""
          }));
          
          setEstablishmentsData(processedEstablishments);
          
          // Extrair parceiros únicos dos estabelecimentos
          const uniquePartners = Array.from(
            new Set(processedEstablishments.map((e: FeedEstablishment) => e.partnerId))
          ).map(partnerId => {
            const establishment = processedEstablishments.find((e: FeedEstablishment) => e.partnerId === partnerId);
            return {
              id: String(partnerId), 
              displayName: establishment?.partnerName || String(partnerId)
            };
          });
          
          setPartners(uniquePartners);
          console.log(`Identificados ${uniquePartners.length} parceiros únicos`);
        } else {
          console.warn("API não retornou estabelecimentos válidos:", data);
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      }
    };
    
    loadEstablishments();
  }, []);

  // Funções para extrair dados únicos dos estabelecimentos
  const getUniqueCities = () => {
    if (!establishmentsData.length) return [];
    
    const cities = establishmentsData
      .filter(e => e?.address?.city)
      .map(e => e.address?.city as string);
    
    return Array.from(new Set(cities))
      .sort()
      .map(city => ({ id: city, label: city }));
  };

  const getUniqueCategories = () => {
    if (!establishmentsData.length) return [];
    
    const categories = establishmentsData
      .filter(e => e?.type?.category)
      .map(e => e.type?.category as string);
    
    return Array.from(new Set(categories))
      .sort()
      .map(category => ({ id: category, label: category }));
  };

  const getUniqueTypes = () => {
    if (!establishmentsData.length) return [];
    
    const types = establishmentsData
      .filter(e => e?.type?.type)
      .map(e => e.type?.type as string);
    
    return Array.from(new Set(types))
      .sort()
      .map(type => ({ id: type, label: type }));
  };

  const getUniquePartners = () => {
    if (!establishmentsData.length || !partners.length) return [];
    
    const uniquePartnerIds = Array.from(new Set(establishmentsData.map(e => e.partnerId)));
    
    return uniquePartnerIds
      .map(partnerId => {
        const partner = partners.find(p => p.id === partnerId);
        return partner ? { id: partnerId, label: partner.displayName } : null;
      })
      .filter(Boolean)
      .sort((a, b) => a!.label.localeCompare(b!.label));
  };

  // Filtro para os estabelecimentos usando establishmentsData
  const filteredEstablishments = establishmentsData.filter((establishment) => {
    if (!establishment || !establishment.name) {
      return false;
    }
    
    const matchesSearch =
      establishment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (establishment.type?.type && establishment.type.type.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesFilters =
      (filters.city === "all" || (establishment.address?.city === filters.city)) &&
      (filters.category === "all" || (establishment.type?.category === filters.category)) &&
      (filters.type === "all" || (establishment.type?.type === filters.type)) &&
      (filters.partnerId === "all" || establishment.partnerId === filters.partnerId) &&
      (establishment.rating >= filters.minRating);

    return matchesSearch && matchesFilters;
  });

  // Agrupar estabelecimentos filtrados por categoria
  const categorizedEstablishments = groupEstablishmentsByCategory(filteredEstablishments);

  const featuredEstablishments = filteredEstablishments.filter((establishment) => 
    establishment.isFeatured
  );

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleEstablishmentClick = (establishment: FeedEstablishment) => {
    // Verificar se o usuário tem uma assinatura ativa
    if (feedStatus.status !== "active") {
      // Se não tiver, mostrar o modal de assinatura
      setShowSubscriptionModal(true);
    } else {
      // Log para debug
      console.log("Estabelecimento selecionado antes do processamento:", establishment);
      // Se tiver, mostrar o detalhe do estabelecimento
      // Adicionar propriedades padrão que o EstablishmentSheet espera
      const completeEstablishment = {
        ...establishment,
        // Propriedades de telefone
        phone: establishment.phone || {
          ddi: "55", // Valor padrão para Brasil
          phone: establishment?.contact?.phone || ""
        },
        // Garantir que address tenha todas as propriedades necessárias
        address: {
          street: establishment.address?.street || "",
          number: establishment.address?.number || "",
          complement: establishment.address?.complement || "",
          neighborhood: establishment.address?.neighborhood || "",
          city: establishment.address?.city || "",
          state: establishment.address?.state || "",
          zipcode: establishment.address?.zipcode || "",
          ...establishment.address
        }
      };
      
      console.log("Establishment completo:", completeEstablishment);
      setSelectedEstablishment(completeEstablishment);
    }
  };

  const handleSubscriptionPurchase = () => {
    // Redirecionar para o link padrão de assinatura
    if (feedStatus.defaultPaymentLink?.lastlinkUrl) {
      window.location.href = feedStatus.defaultPaymentLink.lastlinkUrl;
    } else if (feedStatus.defaultPaymentLink?.code) {
      router.push(`/checkout/${feedStatus.defaultPaymentLink.code}`);
    } else {
      // Caso não tenha um link padrão, redirecionar para a página de planos
      router.push("/planos");
    }
  };

  // Função para navegar no carrossel
  const scrollCarousel = (categoryId: string, direction: 'left' | 'right') => {
    const container = carouselRefs.current.get(categoryId);
    if (!container) return;
    
    const scrollAmount = container.clientWidth * 0.8; // Ajuste para rolar aproximadamente a largura de um card completo
    
    if (direction === 'left') {
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Renderizar o card do estabelecimento
  const renderEstablishmentCard = (establishment: FeedEstablishment) => (
    <Card
      key={establishment.id}
      className={`overflow-hidden group cursor-pointer bg-zinc-50 border-zinc-100 relative h-full ${feedStatus.status !== "active" ? "opacity-95" : ""}`}
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
        {/* Valor do desconto do cupom */}
        <div className="absolute bottom-3 right-3 bg-white/90 border border-white text-black px-2 py-1 rounded-xl flex flex-row items-center space-x-2 shadow-md shadow-black/20">
          <Ticket className="w-4 h-4 text-emerald-500" /><span className="text-emerald-500">{establishment.discountValue}</span>
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
          {establishment.type?.type || "Tipo não informado"} • {establishment.address?.city || "Cidade não informada"}
        </p>
      </div>
    </Card>
  );

  // Renderizar o carrossel por categoria
  const renderCategoryCarousel = (category: string, establishments: FeedEstablishment[]) => (
    <div key={category} className="mb-4">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-md font-semibold text-zinc-500">{category}</h2>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="default" 
            className="rounded-full" 
            onClick={() => scrollCarousel(category, 'left')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="default" 
            className="rounded-full" 
            onClick={() => scrollCarousel(category, 'right')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div 
        className="relative -mx-8" // Wrapper para garantir que o carrossel vai até a borda
      >
        <div 
          className="flex overflow-x-auto pb-3 gap-1 scrollbar-hide carousel-container"
          style={{ 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
          ref={(el) => {
            if (el) carouselRefs.current.set(category, el);
          }}
        >
          {establishments.map(establishment => (
            <div 
              key={establishment.id} 
              className="carousel-item ml-4"
              style={{
                width: 'calc(80% - 16px)',  // Mobile: 80% da largura com espaço para o próximo card
                flexShrink: 0,
              }}
            >
              {renderEstablishmentCard(establishment)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Renderizar skeletons para o estado de carregamento
  const renderSkeletons = () => (
    <div className="space-y-8">
      {[1, 2, 3].map((categoryIndex) => (
        <div key={categoryIndex} className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <Skeleton className="h-8 w-[200px]" />
            <div className="flex space-x-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </div>
          
          <div className="relative -mx-4 px-4">
            <div className="flex overflow-x-auto pb-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="carousel-item" style={{ width: 'calc(80% - 16px)', flexShrink: 0 }}>
                  <Card className="overflow-hidden bg-zinc-50 border-zinc-100 h-full">
                    <div className="aspect-video">
                      <Skeleton className="h-full w-full" />
                    </div>
                    <div className="p-4 space-y-3">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Renderizar skeletons para carrossel de produtos
  const renderProductSkeleton = () => (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <Skeleton className="h-8 w-[200px]" />
      </div>
      
      <div className="flex overflow-x-auto gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ width: 'calc(80% - 16px)', flexShrink: 0 }}>
            <Card className="overflow-hidden bg-zinc-50 border-zinc-100 h-full">
              <div className="aspect-video">
                <Skeleton className="h-full w-full" />
              </div>
              <div className="p-4 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );

  // Adicionar logs para debug
  console.log("Estado atual:", {
    feedStatus: feedStatus.status,
    estabelecimentosCarregados: establishmentsData.length,
    estabelecimentosFiltrados: filteredEstablishments.length,
    estabelecimentosDestaque: featuredEstablishments.length,
    produtos: products.length
  });

  // Carregar stories
  useEffect(() => {
    const fetchStories = async () => {
      try {
        setLoadingStories(true)
        const response = await fetch("/api/stories", {
          credentials: "include"
        })
        
        if (!response.ok) {
          throw new Error("Erro ao carregar stories")
        }
        
        const data = await response.json()
        
        if (data.stories && Array.isArray(data.stories)) {
          // Processar as histórias para garantir que todos os campos estejam presentes
          const processedStories = data.stories.map((story: any) => ({
            ...story,
            // Para compatibilidade com stories antigos que usam imageUrl
            mediaUrl: story.mediaUrl || story.imageUrl,
            // Para compatibilidade com stories antigos que não têm mediaType
            mediaType: story.mediaType || "image"
          }));
          setStories(processedStories)
        }
      } catch (error) {
        console.error("Erro ao carregar stories:", error)
      } finally {
        setLoadingStories(false)
      }
    }
    
    fetchStories()
  }, [])

  // Renderizar seção de produtos (isolando a lógica em uma função separada)
  const renderProductsSection = () => {
    // Adicionar verificações adicionais para segurança
    if (!Array.isArray(products)) {
      console.error("Erro: 'products' não é um array válido", products)
      return null
    }
    
    // Se estiver carregando, mostra skeleton
    if (loadingProducts) {
      console.log("Renderizando skeleton de produtos...")
      return (
        <section className="mb-8">
          {renderProductSkeleton()}
        </section>
      )
    }
    
    // Se tiver produtos, mostra o carrossel
    if (products.length > 0) {
      console.log(`Renderizando carrossel com ${products.length} produtos`)
      return (
        <section className="mb-8">
          <div className="relative">
            <ProductCarousel 
              products={products} 
              hasActiveSubscription={feedStatus.status === "active"}
              onProductClick={(product) => {
                // Verificar se o usuário tem assinatura ativa
                if (feedStatus.status !== "active") {
                  setShowSubscriptionModal(true);
                } else {
                  setSelectedProduct(product);
                }
              }} 
            />
          </div>
          
          <style jsx global>{`
            @keyframes progress {
              0% { transform: scaleX(0); }
              100% { transform: scaleX(1); }
            }
            .animate-progress-bar {
              animation: progress 5s linear forwards;
            }
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
          `}</style>
        </section>
      )
    }
    
    // Se não tiver produtos e não está carregando, não mostra nada
    console.log("Nenhum produto encontrado para exibição")
    return null
  }

  return (
    <div className="container md:py-6 sm:pt-0">
      
      {/* Seção de Stories - com título, lista e botão */}      
      <section className="mb-2">
        <StoriesContainer 
          stories={stories} 
          isContentProducer={(user as any)?.isContentProducer || false} 
          onReloadStories={async () => {
            try {
              setLoadingStories(true);
              const response = await fetch("/api/stories?_=" + new Date().getTime(), {
                credentials: "include"
              });
              
              if (!response.ok) {
                throw new Error("Erro ao recarregar stories");
              }
              
              const data = await response.json();
              
              if (data.stories && Array.isArray(data.stories)) {
                const processedStories = data.stories.map((story: any) => ({
                  ...story,
                  mediaUrl: story.mediaUrl || story.imageUrl,
                  mediaType: story.mediaType || "image"
                }));
                setStories(processedStories);
              }
            } catch (error) {
              console.error("Erro ao recarregar stories:", error);
            } finally {
              setLoadingStories(false);
            }
          }}
        />
      </section>

      {/* Header da página - Saudação e informações do usuário */}
      <header className="mb-2">
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-zinc-700">
            {getGreeting()}, {getUserName()}!
          </h1>
          <p className="text-zinc-500 mt-2">
            Confira os cupons disponíveis hoje para você nos melhores restaurantes.
          </p>
        </div>
      </header>

      {/* Barra de pesquisa e filtros */}
      <section className="bg-white rounded-xl p-5 shadow-sm border border-zinc-100 mb-8">
        <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center justify-between w-full">
            <h2 className="text-md max-sm:text-sm font-semibold text-zinc-600">Cupons disponíveis</h2>
            {filteredEstablishments.length > 0 && (
              <span className="ml-3 px-2.5 py-0.5 bg-zinc-100 text-zinc-600 text-sm rounded-full">
                {filteredEstablishments.length}
                {/* {filteredEstablishments.length} {filteredEstablishments.length === 1 ? 'voucher' : 'vouchers'} */}
              </span>
            )}
          </div>

          <div className="flex flex-row items-center space-x-2">
            {/* Campo de busca */}
            <div className="relative w-full sm:w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Pesquisar cupons..."
                className="pl-10 bg-zinc-50 text-zinc-600 rounded-xl border border-zinc-100 focus:ring-2 focus:ring-zinc-200 focus:border-zinc-300"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>

            {/* Botão de filtros */}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  className="hover:bg-zinc-100 hover:text-zinc-700 rounded-xl border border-zinc-100"
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent className="bg-white text-zinc-600 border-l border-zinc-200">
                <SheetHeader className="border-b border-zinc-100 pb-4 mb-4">
                  <SheetTitle className="text-zinc-700">Opções de filtro</SheetTitle>
                  <SheetDescription className="text-zinc-500">
                    Refine sua busca para encontrar os melhores cupons
                  </SheetDescription>
                </SheetHeader>

                <div className="space-y-6 py-2">
                  {/* Filtro de cidade */}
                  <div className="space-y-2">
                    <Label className="text-zinc-600 font-medium">Cidade</Label>
                    <Select
                      value={filters.city}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, city: value }))}
                    >
                      <SelectTrigger className="bg-zinc-50 border-zinc-200 text-zinc-700 rounded-lg">
                        <SelectValue placeholder="Selecione uma cidade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as cidades</SelectItem>
                        {getUniqueCities().map((city) => (
                          <SelectItem key={city.id} value={city.id}>
                            {city.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filtro de categoria */}
                  <div className="space-y-2">
                    <Label className="text-zinc-600 font-medium">Categoria</Label>
                    <Select
                      value={filters.category}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger className="bg-zinc-50 border-zinc-200 text-zinc-700 rounded-lg">
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as categorias</SelectItem>
                        {getUniqueCategories().map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filtro de tipo */}
                  <div className="space-y-2">
                    <Label className="text-zinc-600 font-medium">Tipo</Label>
                    <Select
                      value={filters.type}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger className="bg-zinc-50 border-zinc-200 text-zinc-700 rounded-lg">
                        <SelectValue placeholder="Selecione um tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os tipos</SelectItem>
                        {getUniqueTypes().map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filtro de parceiro */}
                  {/* <div className="space-y-2">
                    <Label className="text-zinc-600 font-medium">Parceiro</Label>
                    <Select
                      value={filters.partnerId}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, partnerId: value }))}
                    >
                      <SelectTrigger className="bg-zinc-50 border-zinc-200 text-zinc-700 rounded-lg">
                        <SelectValue placeholder="Selecione um parceiro" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os parceiros</SelectItem>
                        {getUniquePartners().map((partner) => partner && (
                          <SelectItem key={partner.id} value={partner.id}>
                            {partner.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div> */}

                  {/* Filtro de avaliação */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="text-zinc-600 font-medium">Avaliação Mínima</Label>
                      <div className="bg-zinc-100 px-2 py-0.5 rounded text-zinc-600 text-sm font-medium">
                        {filters.minRating} {filters.minRating === 1 ? 'estrela' : 'estrelas'}
                      </div>
                    </div>
                    <Slider
                      value={[filters.minRating]}
                      min={0}
                      max={5}
                      step={0.5}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, minRating: value[0] }))}
                      className="mt-2"
                    />
                    <div className="flex justify-between text-xs text-zinc-400 mt-1">
                      <span>0</span>
                      <span>5</span>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </section>

      {/* Alerta de status da assinatura */}
      {feedStatus.status !== "active" && feedStatus.status !== "loading" && (
        <section className="mb-8">
          <div className="bg-amber-50 p-5 rounded-xl border border-amber-200 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="bg-amber-100 p-2 rounded-full">
                <AlertTriangle 
                  className={`h-5 w-5 ${feedStatus.status === 'pending' ? 'text-amber-500' : 'text-red-500'}`} 
                />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-800 text-lg mb-1">
                  {feedStatus.status === 'pending' 
                    ? 'Assinatura Pendente' 
                    : feedStatus.status === 'canceled' 
                      ? 'Assinatura Cancelada' 
                      : 'Sem Assinatura Ativa'}
                </h3>
                <p className="text-amber-700 mb-4">
                  {feedStatus.message || 'Você precisa de uma assinatura ativa para acessar os cupons.'}
                </p>
                {(feedStatus.status === 'canceled' || feedStatus.status === 'none') && feedStatus.defaultPaymentLink && (
                  <Button 
                    size="default"
                    onClick={handleSubscriptionPurchase}
                    className="bg-amber-600 hover:bg-amber-700 text-white rounded-lg"
                  >
                    Quero assinar o clube
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Seção de Produtos - Única instância usando a função de renderização */}
      {renderProductsSection()}

      {/* Conteúdo principal */}
      <main className="pb-10">
        {feedStatus.status === "loading" ? (
          // Skeleton loader para estado de carregamento
          <div className="animate-pulse">
            {renderSkeletons()}
          </div>
        ) : (
          <div className="space-y-12">
            {/* Seção de destaques */}
            {featuredEstablishments.length > 0 && (
              <section>
                {renderCategoryCarousel("Cupons em destaque", featuredEstablishments)}
              </section>
            )}

            {/* Estabelecimentos por categoria */}
            {categorizedEstablishments.length > 0 ? (
              <section>
                {categorizedEstablishments.map(group => 
                  <div key={group.category} className="mb-10">
                    {renderCategoryCarousel(group.category, group.establishments)}
                  </div>
                )}
              </section>
            ) : (
              // Mensagem quando não há resultados
              <section className="py-10">
                <div className="text-center p-10 bg-zinc-50 rounded-xl border border-zinc-100 shadow-sm">
                  <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-zinc-100">
                    <Search className="h-6 w-6 text-zinc-400" />
                  </div>
                  <h3 className="text-lg font-medium text-zinc-600 mb-2">Nenhum resultado encontrado</h3>
                  <p className="text-zinc-500">Tente ajustar os filtros ou realizar uma nova busca.</p>
                </div>
              </section>
            )}
          </div>
        )}
      </main>

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
          establishment={selectedEstablishment as unknown as AvailableEstablishment}
          isOpen={!!selectedEstablishment}
          onClose={() => setSelectedEstablishment(null)}
        />
      )}

      {selectedProduct && (
        <ProductSheet
          product={selectedProduct}
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        /* Ajuste responsivo para o carrossel */
        @media (min-width: 768px) {
          .carousel-item {
            width: calc(40% - 16px) !important; /* Tablet: 2 cartões + parte do terceiro */
          }
        }
        
        @media (min-width: 1024px) {
          .carousel-item {
            width: calc(25% - 16px) !important; /* Desktop: 4 cartões por linha */
          }
        }
        
        /* Garantir que o último card de cada linha mostre parte do próximo */
        .carousel-container {
          padding-right: 20%;
        }
        
        @media (min-width: 768px) {
          .carousel-container {
            padding-right: 10%;
          }
        }
        
        @media (min-width: 1024px) {
          .carousel-container {
            padding-right: 5%;
          }
        }
      `}</style>
    </div>
  )
}
