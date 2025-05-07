"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Calendar, Filter, Columns3, List, ChevronLeft, ChevronRight, X, Search, Eye, DollarSign, Ticket } from "lucide-react"
import { format, subDays, startOfDay, endOfDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { useAuth } from "@/contexts/auth-context"
import { RouteGuard } from "@/components/auth/route-guard"

interface Member {
  id: string
  name: string
  phone: string
  photoURL?: string
  email?: string
}

interface Establishment {
  id: string
  name: string
}

interface Voucher {
  id: string
  code: string
  status: "pending" | "verified" | "used" | "expired"
  createdAt: string
  expiresAt: string
  usedAt?: string
  member: Member
  establishment: Establishment
  discount: number
  partnerId?: string
  voucherDescription?: string
  usageLimit?: number
  discountRules?: string
}

interface FilterOptions {
  status: string[]
  dateRange: {
    start: Date | null
    end: Date | null
  }
  period: string
  name: string
  email: string
  phone: string
  partner: string
  establishment: string
  code: string
}

interface VoucherDetailsProps {
  voucher: Voucher
  onClose: () => void
  onCheckIn?: (code: string) => void
}

const getStatusText = (status: string) => {
  switch (status) {
    case "pending":
      return "Pendente"
    case "verified":
      return "Verificado"
    case "used":
      return "Utilizado"
    case "expired":
      return "Expirado"
    default:
      return "Desconhecido"
  }
}

const FilterSidebar = ({ 
  isOpen, 
  onOpenChange, 
  initialFilters, 
  onApplyFilters 
}: { 
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  initialFilters: FilterOptions
  onApplyFilters: (filters: FilterOptions) => void
}) => {
  // Estado local para os campos do formulário
  const [localFilters, setLocalFilters] = useState<FilterOptions>(initialFilters)

  // Resetar estado local quando a sidebar abre
  useEffect(() => {
    if (isOpen) {
      setLocalFilters(initialFilters)
    }
  }, [isOpen, initialFilters])

  const handleApplyFilters = () => {
    onApplyFilters(localFilters)
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="bg-zinc-100 border-l-[#1a1b2d] w-[400px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-zinc-500">Filtros</SheetTitle>
        </SheetHeader>
        
        <div className="space-y-6 mt-6">

        <div className="space-y-2">
            <Label className="text-zinc-400 w-full">Período</Label>
            <DateRangePicker
              date={{
                from: localFilters.dateRange.start || undefined,
                to: localFilters.dateRange.end || undefined
              }}
              onDateChange={(date) => 
                setLocalFilters(prev => ({
                  ...prev,
                  period: 'custom',
                  dateRange: {
                    start: date?.from || null,
                    end: date?.to || null
                  }
                }))
              }
            />
          </div>


          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-zinc-400">Código do Cupom</Label>
              <Input
                value={localFilters.code}
                onChange={(e) => setLocalFilters(prev => ({ ...prev, code: e.target.value }))}
                className="bg-zinc-100 border-zinc-200 text-zinc-500"
                placeholder="Digite o código"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-400">Nome do Cliente</Label>
              <Input
                value={localFilters.name}
                onChange={(e) => setLocalFilters(prev => ({ ...prev, name: e.target.value }))}
                className="bg-zinc-100 border-zinc-200 text-zinc-500"
                placeholder="Digite o nome"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-400">Email</Label>
              <Input
                value={localFilters.email}
                onChange={(e) => setLocalFilters(prev => ({ ...prev, email: e.target.value }))}
                className="bg-zinc-100 border-zinc-200 text-zinc-500"
                placeholder="Digite o email"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-400">Telefone</Label>
              <Input
                value={localFilters.phone}
                onChange={(e) => setLocalFilters(prev => ({ ...prev, phone: e.target.value }))}
                className="bg-zinc-100 border-zinc-200 text-zinc-500"
                placeholder="Digite o telefone"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-400">Estabelecimento</Label>
              <Input
                value={localFilters.establishment}
                onChange={(e) => setLocalFilters(prev => ({ ...prev, establishment: e.target.value }))}
                className="bg-zinc-100 border-zinc-200 text-zinc-500"
                placeholder="Digite o estabelecimento"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-400">Status</Label>
            <div className="grid grid-cols-2 gap-2">
              {["pending", "verified", "used", "expired"].map((status) => (
                <Button
                  key={status}
                  variant="outline"
                  className={`bg-zinc-100 hover:bg-zinc-100 border-zinc-200 text-zinc-500 ${
                    localFilters.status.includes(status) 
                      ? "bg-primary text-white" 
                      : "text-zinc-400"
                  }`}
                  onClick={() => {
                    setLocalFilters(prev => ({
                      ...prev,
                      status: prev.status.includes(status)
                        ? prev.status.filter(s => s !== status)
                        : [...prev.status, status]
                    }))
                  }}
                >
                  {getStatusText(status)}
                </Button>
              ))}
            </div>
          </div>

          <Button
            className="w-full bg-primary hover:bg-[#5a2ba7]"
            onClick={handleApplyFilters}
          >
            Aplicar Filtros
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function MemberReportsPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [viewMode, setViewMode] = useState<"list" | "kanban">("kanban")
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [filteredVouchers, setFilteredVouchers] = useState<Voucher[]>([])
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();
  
  // Estado principal dos filtros (aplicados)
  const [filters, setFilters] = useState<FilterOptions>({
    status: [],
    dateRange: {
      start: null,
      end: null
    },
    period: 'all',
    name: '',
    email: '',
    phone: '',
    partner: '',
    establishment: '',
    code: ''
  })

  // Estados para ordenação
  const [orderBy, setOrderBy] = useState<'date' | 'status'>('date');
  const [orderDirection, setOrderDirection] = useState<'asc' | 'desc'>('desc');

  const itemsPerPage = 10
  
  // Função para obter token de sessão para as requisições
  const getSessionToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('session_token') || '';
    }
    return '';
  };

  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      await fetchVouchers()
    } catch (error) {
      console.error("Erro ao carregar dados iniciais:", error)
      toast.error("Erro ao carregar dados. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const fetchVouchers = async () => {
    try {
      const sessionToken = getSessionToken();
      
      const response = await fetch('/api/member/reports', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-session-token': sessionToken
        }
      })

      if (!response.ok) {
        throw new Error('Falha ao buscar vouchers');
      }

      const data = await response.json()
      
      if (data && data.vouchers) {
        setVouchers(data.vouchers)
        setFilteredVouchers(data.vouchers)
      }
    } catch (error) {
      console.error("Erro ao buscar vouchers:", error)
      toast.error("Não foi possível carregar os vouchers")
    }
  }

  const applyFilters = (newFilters: FilterOptions) => {
    setFilters(newFilters)
    setIsFilterOpen(false)
    
    // Aplicar os filtros aos vouchers
    let filtered = [...vouchers]
    
    // Filtrar por status
    if (newFilters.status.length > 0) {
      filtered = filtered.filter(v => newFilters.status.includes(v.status))
    }
    
    // Filtrar por período
    if (newFilters.dateRange.start && newFilters.dateRange.end) {
      const startDate = startOfDay(newFilters.dateRange.start)
      const endDate = endOfDay(newFilters.dateRange.end)
      
      filtered = filtered.filter(v => {
        const voucherDate = new Date(v.createdAt)
        return voucherDate >= startDate && voucherDate <= endDate
      })
    }
    
    // Filtrar por nome do cliente
    if (newFilters.name) {
      const searchTerm = newFilters.name.toLowerCase()
      filtered = filtered.filter(v => 
        v.member.name.toLowerCase().includes(searchTerm)
      )
    }
    
    // Filtrar por email
    if (newFilters.email) {
      const searchTerm = newFilters.email.toLowerCase()
      filtered = filtered.filter(v => 
        v.member.email?.toLowerCase().includes(searchTerm)
      )
    }
    
    // Filtrar por telefone
    if (newFilters.phone) {
      const searchTerm = newFilters.phone.toLowerCase()
      filtered = filtered.filter(v => 
        v.member.phone.toLowerCase().includes(searchTerm)
      )
    }
    
    // Filtrar por estabelecimento
    if (newFilters.establishment) {
      const searchTerm = newFilters.establishment.toLowerCase()
      filtered = filtered.filter(v => 
        v.establishment.name.toLowerCase().includes(searchTerm)
      )
    }
    
    // Filtrar por código
    if (newFilters.code) {
      const searchTerm = newFilters.code.toLowerCase()
      filtered = filtered.filter(v => 
        v.code.toLowerCase().includes(searchTerm)
      )
    }
    
    setFilteredVouchers(filtered)
    setCurrentPage(1)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-500"
      case "verified":
        return "bg-blue-500"
      case "used":
        return "bg-emerald-500"
      case "expired":
        return "bg-zinc-400"
      default:
        return "bg-zinc-400"
    }
  }
  
  // Obter cor de fundo no formato hexadecimal para CSS inline
  const getStatusBgColor = (status: string) => {
    switch (status) {
      case "pending":
        return "#f59e0b" // amber-500
      case "verified":
        return "#3b82f6" // blue-500
      case "used":
        return "#10b981" // emerald-500
      case "expired":
        return "#a1a1aa" // zinc-400
      default:
        return "#a1a1aa" // zinc-400
    }
  }

  // Função para formatar datas para um formato mais compacto
  const formatCompactDate = (date: string | { seconds: number, nanoseconds: number }) => {
    if (!date) return "Indisponível";
    
    try {
      let dateObj;
      if (typeof date === 'object' && 'seconds' in date) {
        dateObj = new Date(date.seconds * 1000);
      } else {
        dateObj = new Date(date);
      }
      
      // Formatar como DD/MM/YYYY
      return format(dateObj, "dd/MM/yyyy", { locale: ptBR });
    } catch (error) {
      return "Data inválida";
    }
  };
  
  // Função para formatar datas com data e hora completos
  const formatFirebaseDate = (date: string | { seconds: number, nanoseconds: number }) => {
    if (!date) return "Data indisponível";
    
    try {
      let dateObj;
      if (typeof date === 'object' && 'seconds' in date) {
        dateObj = new Date(date.seconds * 1000);
      } else {
        dateObj = new Date(date);
      }
      
      // Formatar como DD/MM/YYYY às HH:MM
      return format(dateObj, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch (error) {
      return "Data inválida";
    }
  };

  const VoucherCard = ({ voucher }: { voucher: Voucher }) => {
    // Calcular se está próximo de expirar (menos de 3 dias)
    const isNearExpiry = () => {
      if (!voucher.expiresAt) return false;
      
      try {
        let expiryDate;
        if (typeof voucher.expiresAt === 'object' && 'seconds' in voucher.expiresAt) {
          expiryDate = new Date(voucher.expiresAt.seconds * 1000);
        } else {
          expiryDate = new Date(voucher.expiresAt);
        }
        
        const now = new Date();
        const diffTime = expiryDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays <= 3 && diffDays > 0;
      } catch (error) {
        return false;
      }
    };
    
    // Obter cor do status
    const statusColor = getStatusBgColor(voucher.status);
    
    return (
      <Card 
        key={voucher.id} 
        className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all h-full flex flex-col cursor-pointer"
        onClick={() => {
          setSelectedVoucher(voucher)
          setIsDetailsOpen(true)
        }}
      >
        {/* Cabeçalho do card com status e dados do cliente */}
        <div 
          className="p-3 rounded-t-lg text-white" 
          style={{ backgroundColor: statusColor }}
        >
          <div className="flex justify-between items-center">
            <Badge className="bg-white/20 text-white">
              {getStatusText(voucher.status)}
            </Badge>
            <span className="text-white text-sm font-medium">#{voucher.code}</span>
          </div>
        </div>
        
        {/* Corpo do card */}
        <div className="p-4 flex-1 flex flex-col">
          {/* Informações do cliente */}
          <div className="flex items-center mb-3 pb-3 border-b border-zinc-100">
            <Avatar className="h-10 w-10 mr-3">
              <AvatarImage src={voucher.member.photoURL} />
              <AvatarFallback>{voucher.member.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="truncate">
              <p className="font-medium line-clamp-1">{voucher.member.name}</p>
              <p className="text-xs text-zinc-500 line-clamp-1">{voucher.member.email || voucher.member.phone}</p>
            </div>
          </div>
          
          {/* Informações do estabelecimento */}
          <div className="mb-3 pb-3 border-b border-zinc-100">
            <p className="text-sm font-medium text-zinc-800 mb-1 line-clamp-1">{voucher.establishment.name}</p>
            <p className="text-xs text-zinc-500">Desconto: <span className="font-medium text-emerald-600">{voucher.discount}%</span></p>
          </div>
          
          {/* Datas do cupom */}
          <div className="mt-auto space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">Criado:</span>
              <span className="font-medium">{formatCompactDate(voucher.createdAt)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">Expira:</span>
              <span className={`font-medium ${isNearExpiry() ? 'text-amber-600' : ''}`}>
                {formatCompactDate(voucher.expiresAt)}
                {isNearExpiry() && (
                  <Badge variant="outline" className="ml-1 text-[9px] py-0 h-4 bg-amber-50 text-amber-600 border-amber-200">
                    Expira em breve
                  </Badge>
                )}
              </span>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  // Função para ordenar vouchers
  const orderVouchers = (vouchers: Voucher[]) => {
    const statusOrder = { pending: 0, verified: 1, used: 2, expired: 3 };
    
    return [...vouchers].sort((a, b) => {
      if (orderBy === 'date') {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return orderDirection === 'asc' ? dateA - dateB : dateB - dateA;
      } else {
        const statusA = statusOrder[a.status as keyof typeof statusOrder];
        const statusB = statusOrder[b.status as keyof typeof statusOrder];
        return orderDirection === 'asc' ? statusA - statusB : statusB - statusA;
      }
    });
  };

  // Aplicar ordenação aos vouchers filtrados
  const orderedVouchers = orderVouchers(filteredVouchers);
  
  // Paginação com vouchers ordenados
  const totalPages = Math.ceil(orderedVouchers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentVouchers = orderedVouchers.slice(startIndex, startIndex + itemsPerPage);

  // Atualizar a ordem
  const toggleOrderDirection = () => {
    setOrderDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  // Ajustar a ordem
  const setOrder = (field: 'date' | 'status') => {
    if (orderBy === field) {
      toggleOrderDirection();
    } else {
      setOrderBy(field);
      setOrderDirection('desc');
    }
  };

  const hasActiveFilters = (filters: FilterOptions) => {
    return (
      filters.status.length > 0 ||
      !!filters.dateRange.start ||
      !!filters.code ||
      !!filters.name ||
      !!filters.email ||
      !!filters.phone ||
      !!filters.establishment
    )
  }

  const clearFilters = () => {
    setFilters({
      status: [],
      dateRange: {
        start: null,
        end: null
      },
      period: 'all',
      name: '',
      email: '',
      phone: '',
      partner: '',
      establishment: '',
      code: ''
    })
    
    setFilteredVouchers(vouchers)
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const performGlobalSearch = (searchTerm: string) => {
    setSearchTerm(searchTerm);
    
    if (!searchTerm.trim()) {
      applyFilters(filters); // Reaplica os filtros existentes
      return;
    }
    
    const term = searchTerm.toLowerCase();
    
    // Filtrar por termo de pesquisa em vários campos
    const results = vouchers.filter(voucher => 
      voucher.code.toLowerCase().includes(term) ||
      voucher.member.name.toLowerCase().includes(term) ||
      (voucher.member.email && voucher.member.email.toLowerCase().includes(term)) ||
      voucher.member.phone.toLowerCase().includes(term) ||
      voucher.establishment.name.toLowerCase().includes(term)
    );
    
    setFilteredVouchers(results);
    setCurrentPage(1);
  }

  const VoucherDetails = ({ voucher, onClose }: VoucherDetailsProps) => {
    if (!voucher) return null;
    
    return (
      <Sheet open={!!voucher} onOpenChange={() => onClose()}>
        <SheetContent className="max-w-md">
          <SheetHeader>
            <SheetTitle>Detalhes do Cupom</SheetTitle>
          </SheetHeader>
          
          <div className="mt-6 space-y-6">
            <div className="space-y-1">
              <Badge className={`${getStatusColor(voucher.status)} text-white`}>
                {getStatusText(voucher.status)}
              </Badge>
              <h3 className="text-lg font-medium">Código: {voucher.code}</h3>
              <p className="text-zinc-500">Desconto: {voucher.discount}%</p>
            </div>
            
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-zinc-500 mb-2">Cliente</h4>
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={voucher.member.photoURL} />
                  <AvatarFallback>{voucher.member.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{voucher.member.name}</p>
                  <p className="text-sm text-zinc-500">{voucher.member.phone}</p>
                  <p className="text-sm text-zinc-500">{voucher.member.email}</p>
                </div>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-zinc-500 mb-2">Estabelecimento</h4>
              <p className="font-medium">{voucher.establishment.name}</p>
              <p className="text-sm text-zinc-500">ID: {voucher.establishment.id}</p>
            </div>
            
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-zinc-500 mb-2">Datas</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-zinc-500">Criado em:</p>
                  <p>{formatFirebaseDate(voucher.createdAt)}</p>
                </div>
                <div>
                  <p className="text-zinc-500">Expira em:</p>
                  <p>{formatFirebaseDate(voucher.expiresAt)}</p>
                </div>
                
                {voucher.usedAt && (
                  <div>
                    <p className="text-zinc-500">Utilizado em:</p>
                    <p>{formatFirebaseDate(voucher.usedAt)}</p>
                  </div>
                )}
              </div>
            </div>
            
            {voucher.voucherDescription && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-zinc-500 mb-2">Descrição do Cupom</h4>
                <p className="text-sm">{voucher.voucherDescription}</p>
              </div>
            )}
            
            {voucher.discountRules && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-zinc-500 mb-2">Regras de Desconto</h4>
                <p className="text-sm">{voucher.discountRules}</p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Kanban responsivo
  const KanbanView = ({ vouchers }: { vouchers: Voucher[] }) => {
    const orderedVouchers = orderVouchers(vouchers);
    
    const columns = [
      { status: "pending", title: "Pendentes", icon: <span className="h-4 w-4 flex items-center justify-center bg-amber-100 text-amber-600 rounded-full text-xs">!</span> },
      { status: "verified", title: "Verificados", icon: <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
      { status: "used", title: "Utilizados", icon: <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> },
      { status: "expired", title: "Expirados", icon: <svg className="h-4 w-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> }
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {columns.map(column => {
          const columnVouchers = orderedVouchers.filter(v => v.status === column.status);
          return (
            <div key={column.status} className="space-y-4">
              <div className="bg-white p-3 rounded-lg shadow-sm flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center">
                  {column.icon}
                  <h3 className="font-medium text-zinc-700 ml-2">{column.title}</h3>
                </div>
                <Badge variant="outline" className={`${
                  column.status === "pending" ? "bg-amber-50 text-amber-600 border-amber-200" :
                  column.status === "verified" ? "bg-blue-50 text-blue-600 border-blue-200" :
                  column.status === "used" ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                  "bg-zinc-100 text-zinc-600 border-zinc-200"
                }`}>
                  {columnVouchers.length}
                </Badge>
              </div>
              
              <div className="space-y-4 min-h-[100px]">
                {columnVouchers.length > 0 ? (
                  columnVouchers.map(voucher => (
                    <VoucherCard key={voucher.id} voucher={voucher} />
                  ))
                ) : (
                  <div className="bg-zinc-50 p-6 rounded-lg border border-dashed border-zinc-200 text-center text-zinc-400 flex flex-col items-center justify-center h-[150px]">
                    <svg className="h-8 w-8 text-zinc-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-sm">Nenhum cupom</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6 pb-24">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold">Relatório de Cupons</h1>
        <div className="flex items-center space-x-3">
          <DollarSign className="h-5 w-5 text-emerald-500" />
          <span className="text-lg font-medium text-emerald-500">
            Total: {filteredVouchers.length} cupons
          </span>
        </div>
      </div>

      {/* Toolbar com pesquisa, filtros e alternar visualização */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex-1 w-full md:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input 
              className="pl-10 bg-white"
              placeholder="Buscar por nome, código ou estabelecimento..."
              value={searchTerm}
              onChange={(e) => performGlobalSearch(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2 w-full md:w-auto justify-between md:justify-end gap-2">
          {/* Opções de ordenação */}
          <div className="hidden md:flex items-center">
            <span className="text-zinc-500 text-sm mr-2">Ordenar:</span>
            <div className="border rounded-md flex divide-x text-sm">
              <Button
                variant="ghost"
                size="sm"
                className={`rounded-l-md rounded-r-none ${orderBy === "date" ? "bg-zinc-100 font-medium" : ""}`}
                onClick={() => setOrder("date")}
              >
                Data {orderBy === "date" && (orderDirection === 'asc' ? '↑' : '↓')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`rounded-l-none rounded-r-md ${orderBy === "status" ? "bg-zinc-100 font-medium" : ""}`}
                onClick={() => setOrder("status")}
              >
                Status {orderBy === "status" && (orderDirection === 'asc' ? '↑' : '↓')}
              </Button>
            </div>
          </div>
          
          <div className="flex items-center">
            <Button 
              variant="outline" 
              size="sm"
              className="w-full md:w-auto"
              onClick={() => setIsFilterOpen(true)}
            >
              <Filter className="h-4 w-4 mr-2" /> Filtros
            </Button>
            {hasActiveFilters(filters) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="ml-2"
              >
                <X className="h-4 w-4 mr-1" /> Limpar
              </Button>
            )}
          </div>
          
          <div className="border rounded-md flex divide-x">
            <Button
              variant="ghost"
              size="sm"
              className={`rounded-none ${viewMode === "kanban" ? "bg-zinc-100" : ""}`}
              onClick={() => setViewMode("kanban")}
            >
              <Columns3 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`rounded-none ${viewMode === "list" ? "bg-zinc-100" : ""}`}
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : filteredVouchers.length === 0 ? (
        <div className="bg-white rounded-lg p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
            <Ticket className="h-8 w-8 text-zinc-400" />
          </div>
          <h3 className="text-lg font-medium mb-2">Nenhum cupom encontrado</h3>
          <p className="text-zinc-500 mb-4">
            Não encontramos cupons com os filtros aplicados.
          </p>
          {hasActiveFilters(filters) && (
            <Button variant="outline" onClick={clearFilters}>
              Limpar Filtros
            </Button>
          )}
        </div>
      ) : (
        <>
          {viewMode === "kanban" ? (
            <KanbanView vouchers={filteredVouchers} />
          ) : (
            <div className="overflow-x-auto">
              <div className="bg-white rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead className="hidden md:table-cell">Estabelecimento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">Criado em</TableHead>
                      <TableHead>Desconto</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentVouchers.map((voucher) => (
                      <TableRow 
                        key={voucher.id} 
                        className="hover:bg-zinc-50 cursor-pointer"
                        onClick={() => {
                          setSelectedVoucher(voucher);
                          setIsDetailsOpen(true);
                        }}
                      >
                        <TableCell className="font-medium">{voucher.code}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={voucher.member.photoURL} />
                              <AvatarFallback>{voucher.member.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="truncate max-w-[120px]">{voucher.member.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell truncate max-w-[150px]">{voucher.establishment.name}</TableCell>
                        <TableCell>
                          <Badge className={`${getStatusColor(voucher.status)} text-white`}>
                            {getStatusText(voucher.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{formatFirebaseDate(voucher.createdAt)}</TableCell>
                        <TableCell className="font-medium text-emerald-600">{voucher.discount}%</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedVoucher(voucher);
                              setIsDetailsOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Paginação */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center mt-6 space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" /> Anterior
                  </Button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => 
                        page === 1 || 
                        page === totalPages || 
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      )
                      .map((page, index, array) => (
                        <React.Fragment key={page}>
                          {index > 0 && array[index - 1] !== page - 1 && (
                            <span className="px-2">...</span>
                          )}
                          <Button
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(page)}
                            className="w-8 h-8 p-0"
                          >
                            {page}
                          </Button>
                        </React.Fragment>
                      ))
                    }
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="gap-1"
                  >
                    Próxima <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Filter Sidebar */}
      <FilterSidebar
        isOpen={isFilterOpen}
        onOpenChange={setIsFilterOpen}
        initialFilters={filters}
        onApplyFilters={applyFilters}
      />
      
      {/* Voucher Details Modal */}
      {selectedVoucher && (
        <VoucherDetails
          voucher={selectedVoucher}
          onClose={() => {
            setSelectedVoucher(null)
            setIsDetailsOpen(false)
          }}
        />
      )}
    </div>
  )
}

// Componente final com proteção de permissão de produtor de conteúdo
export default function ReportsPage() {
  const { user } = useAuth();
  
  // Verificar se o usuário tem permissão de produtor de conteúdo
  const isContentProducer = 
    user?.isContentProducer === true || 
    (user as any)?.role === "contentProducer" || 
    (user as any)?.role === "admin" ||
    ((user as any)?.roles && (
      (user as any).roles.includes("contentProducer") || 
      (user as any).roles.includes("admin")
    ));
  
  if (!isContentProducer) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="bg-white p-8 rounded-lg shadow-sm">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Acesso Restrito</h2>
          <p className="text-zinc-500 mb-6">
            Você não tem permissão para acessar esta página. Esta funcionalidade está disponível apenas para produtores de conteúdo.
          </p>
          <Button 
            variant="default" 
            onClick={() => window.location.href = "/member/feed"}
          >
            Voltar para o Feed
          </Button>
        </div>
      </div>
    );
  }
  
  return <MemberReportsPage />;
} 