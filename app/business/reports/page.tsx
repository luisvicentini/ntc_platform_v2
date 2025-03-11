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
import { Calendar, Filter, Columns3, List, ChevronLeft, ChevronRight, X, Search, Eye } from "lucide-react"
import { format, subDays, startOfDay, endOfDay } from "date-fns"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface Member {
  id: string
  name: string
  phone: string
  photoURL?: string
}

interface Establishment {
  id: string
  name: string
}

interface Voucher {
  conditions: ReactNode
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
    end: null
  }
  period: string
  name: string
  email: string
  phone: string
  partner: string
  establishment: string
  code: string
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
      <SheetContent className="bg-zinc-100 border-l-[#1a1b2d] w-[400px]">
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

export default function ReportsPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [viewMode, setViewMode] = useState<"list" | "kanban">("kanban")
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [filteredVouchers, setFilteredVouchers] = useState<Voucher[]>([])
  
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
  
  // Estado temporário dos filtros (em edição)
  const [tempFilters, setTempFilters] = useState<FilterOptions>({ ...filters })

  // Adicione o estado para o termo de busca
  const [searchTerm, setSearchTerm] = useState('')

  const itemsPerPage = 10
  const totalPages = Math.ceil(filteredVouchers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentVouchers = filteredVouchers.slice(startIndex, endIndex)

  useEffect(() => {
    const loadInitialData = async () => {
      await fetchVouchers()
    }
    loadInitialData()
  }, [])

  const fetchVouchers = async () => {
    try {
      setLoading(true)
      const sessionToken = localStorage.getItem("sessionToken")
      const response = await fetch("/api/business/reports", {
        headers: {
          "x-session-token": sessionToken || "",
        },
      })
      
      if (!response.ok) {
        throw new Error(`Erro ao carregar vouchers: ${response.status}`)
      }
      
      const data = await response.json()
      setVouchers(data.vouchers)
      setFilteredVouchers(data.vouchers) // Inicializa filteredVouchers com todos os vouchers
    } catch (error) {
      console.error("Erro ao buscar vouchers:", error)
      toast.error("Erro ao carregar vouchers")
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = (newFilters: FilterOptions) => {
    let filtered = [...vouchers]

    // Filtros de texto
    if (newFilters.name) {
      filtered = filtered.filter(v => 
        v.member.name.toLowerCase().includes(newFilters.name.toLowerCase())
      )
    }
    if (newFilters.email) {
      filtered = filtered.filter(v => 
        v.member.email?.toLowerCase().includes(newFilters.email.toLowerCase())
      )
    }
    if (newFilters.phone) {
      filtered = filtered.filter(v => 
        v.member.phone?.includes(newFilters.phone)
      )
    }
    if (newFilters.code) {
      filtered = filtered.filter(v => 
        v.code.toLowerCase().includes(newFilters.code.toLowerCase())
      )
    }
    if (newFilters.establishment) {
      filtered = filtered.filter(v => 
        v.establishment.name.toLowerCase().includes(newFilters.establishment.toLowerCase())
      )
    }

    // Filtros existentes...
    if (newFilters.status.length > 0) {
      filtered = filtered.filter(voucher => newFilters.status.includes(voucher.status))
    }

    // Filtro de data...
    if (newFilters.period === 'custom' && newFilters.dateRange.start && newFilters.dateRange.end) {
      filtered = filtered.filter(voucher => {
        const voucherDate = new Date(voucher.createdAt)
        const startDate = startOfDay(newFilters.dateRange.start!)
        const endDate = endOfDay(newFilters.dateRange.end!)
        return voucherDate >= startDate && voucherDate <= endDate
      })
    } else if (newFilters.period !== 'all' && newFilters.period !== 'custom') {
      const today = new Date()
      let startDate = new Date()

      switch (newFilters.period) {
        case '7days':
          startDate = subDays(today, 7)
          break
        case '30days':
          startDate = subDays(today, 30)
          break
        case '90days':
          startDate = subDays(today, 90)
          break
      }

      filtered = filtered.filter(voucher => {
        const voucherDate = new Date(voucher.createdAt)
        return voucherDate >= startOfDay(startDate) && voucherDate <= endOfDay(today)
      })
    }

    // Atualizar os estados
    setFilters(newFilters)
    setTempFilters(newFilters)
    setFilteredVouchers(filtered)
    setIsFilterOpen(false)
    setCurrentPage(1)
  }

  const performCheckIn = async (code: string) => {
    try {
      const sessionToken = localStorage.getItem("sessionToken")
      const response = await fetch("/api/vouchers/validate", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-session-token": sessionToken || "",
        },
        body: JSON.stringify({ code }),
      })

      if (response.ok) {
        toast.success("Check-in realizado com sucesso!")
        await fetchVouchers()
        setIsDetailsOpen(false)
      } else {
        const data = await response.json()
        toast.error(data.error || "Erro ao realizar check-in")
      }
    } catch (error) {
      console.error("Erro ao realizar check-in:", error)
      toast.error("Erro ao realizar check-in")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20"
      case "verified":
        return "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
      case "used":
        return "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
      case "expired":
        return "bg-red-500/10 text-red-500 hover:bg-red-500/20"
      default:
        return "bg-zinc-400/10 text-zinc-400 hover:bg-zinc-400/20"
    }
  }

  const formatFirebaseDate = (date: string | { seconds: number, nanoseconds: number }) => {
    if (typeof date === 'string') {
      return format(new Date(date), "dd/MM/yyyy")
    }
    if ('seconds' in date) {
      return format(new Date(date.seconds * 1000), "dd/MM/yyyy")
    }
    return "Data inválida"
  }

  const VoucherCard = ({ voucher }: { voucher: Voucher }) => (
    <Card 
      className="bg-zinc-50 border-zinc-100 p-4 cursor-pointer hover:border-primary transition-colors"
      onClick={() => {
        setSelectedVoucher(voucher)
        setIsDetailsOpen(true)
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8 border border-zinc-200">
            {voucher.member.photoURL && (
              <AvatarImage src={voucher.member.photoURL} />
            )}
            <AvatarFallback className="bg-zinc-100 text-zinc-400">
              {voucher.member.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium text-zinc-500">{voucher.member.name}</p>
            <p className="text-xs text-zinc-400">{voucher.code}</p>
          </div>
        </div>
        <Badge className={getStatusColor(voucher.status)}>
          {getStatusText(voucher.status)}
        </Badge>
      </div>
      <div className="text-xs text-zinc-400 space-y-1">
        <div className="flex items-center space-x-1">
          <Calendar className="h-3 w-3" />
          <span>Criado em: {formatFirebaseDate(voucher.createdAt)}</span>
        </div>
      </div>
    </Card>
  )

  const KanbanView = ({ vouchers }: { vouchers: Voucher[] }) => {
    const columns = ["pending", "verified", "used", "expired"]
    
    return (
      <div className="flex overflow-y-auto gap-4 flex-nowrap">
        {columns.map(status => (
          <div key={status} className="space-y-4 min-w-[300px]">
            <div className="flex items-center justify-between">
              <h3 className="text-zinc-500 font-medium capitalize">
                {getStatusText(status)}
              </h3>
              <Badge variant="outline" className="border-zinc-200 text-zinc-400">
                {vouchers.filter(v => v.status === status).length}
              </Badge>
            </div>
            <div className="space-y-2">
              {vouchers
                .filter(v => v.status === status)
                .map(voucher => (
                  <VoucherCard key={voucher.id} voucher={voucher} />
                ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const hasActiveFilters = (filters: FilterOptions) => {
    return (
      filters.status.length > 0 ||
      filters.period !== 'all' ||
      filters.name !== '' ||
      filters.email !== '' ||
      filters.phone !== '' ||
      filters.partner !== '' ||
      filters.establishment !== '' ||
      filters.code !== ''
    )
  }

  const clearFilters = () => {
    const defaultFilters = {
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
    }
    
    setFilters(defaultFilters)
    setTempFilters(defaultFilters)
    setFilteredVouchers(vouchers)
    setCurrentPage(1)
  }

  // Adicione esta função de busca global
  const performGlobalSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) {
      // Se a busca estiver vazia, aplicar apenas os filtros ativos
      applyFilters(filters)
      return
    }

    const search = searchTerm.toLowerCase().trim()
    const filtered = filteredVouchers.filter(voucher => {
      // Busca em todos os campos relevantes
      return (
        voucher.code.toLowerCase().includes(search) ||
        voucher.member.name.toLowerCase().includes(search) ||
        (voucher.member.email || '').toLowerCase().includes(search) ||
        (voucher.member.phone || '').toLowerCase().includes(search) ||
        voucher.establishment.name.toLowerCase().includes(search) ||
        (voucher.partner?.name || '').toLowerCase().includes(search)
      )
    })

    setFilteredVouchers(filtered)
    setCurrentPage(1)
  }

  const VoucherDetails = ({ voucher, onClose, onCheckIn }: VoucherDetailsProps) => {
    const [partnerName, setPartnerName] = useState<string>("")
    const [partnerPhone, setPartnerPhone] = useState<string>("")
    const [partnerPhoto, setPartnerPhoto] = useState<string>("")

    useEffect(() => {
      const fetchPartnerData = async () => {
        if (selectedVoucher?.partnerId) {
          try {
            const usersRef = collection(db, "users")
            const q = query(
              usersRef,
              where("firebaseUid", "==", selectedVoucher.partnerId),
              where("userType", "==", "partner")
            )
            const userSnap = await getDocs(q)
            
            if (!userSnap.empty) {
              const partnerData = userSnap.docs[0].data()
              setPartnerName(partnerData.displayName)
              setPartnerPhone(partnerData.phone || "Não informado")
              setPartnerPhoto(partnerData.photoURL || "")
            }
          } catch (error) {
            console.error("Erro ao buscar dados do partner:", error)
          }
        }
      }

      fetchPartnerData()
    }, [selectedVoucher])

    return (
      <Sheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <SheetContent className="bg-zinc-100 border-l-[#1a1b2d]">
          <SheetHeader>
            <SheetTitle className="text-zinc-500">Detalhes do Voucher</SheetTitle>
          </SheetHeader>
          {selectedVoucher && (
            <div className="space-y-6 mt-6">
              {/* Código do Voucher em destaque */}
              <div className="bg-white p-6 rounded-lg text-center border border-zinc-200">
                <h3 className="text-sm font-sm text-zinc-400 mb-2">Código do Voucher</h3>
                <p className="text-3xl font-bold text-emerald-500">{selectedVoucher.code}</p>
              </div>
              
              {/* Informações do Cliente */}
              <div className="space-y-2">
                <h3 className="text-sm font-sm text-zinc-400">Informações do Cliente</h3>
                <div className="flex items-center space-x-3">
                  <Avatar>
                    {selectedVoucher.member.photoURL && (
                      <AvatarImage src={selectedVoucher.member.photoURL} />
                    )}
                    <AvatarFallback>
                      {selectedVoucher.member.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-zinc-500 font-semibold">{selectedVoucher.member.name}</p>
                    <p className="text-sm text-zinc-400 font-semibold">{selectedVoucher.member.phone}</p>
                  </div>
                </div>
              </div>

              {/* Informações do Parceiro */}
              <div className="space-y-2">
                <h3 className="text-sm font-sm text-zinc-400">Partner Origem</h3>
                <div className="flex items-center space-x-3">
                  <Avatar>
                    {partnerPhoto && (
                      <AvatarImage src={partnerPhoto} />
                    )}
                    <AvatarFallback>
                      {partnerName?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-zinc-500 font-semibold">{partnerName}</p>
                    <p className="text-sm text-zinc-400 font-semibold">{partnerPhone}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-sm text-zinc-400">Status do voucher</h3>
                <Badge className={getStatusColor(selectedVoucher.status)}>
                  {getStatusText(selectedVoucher.status)}
                </Badge>
              </div>

              <div className="space-y-1 text-zinc-500">
                <span className="text-sm font-sm text-zinc-400">Data criação do voucher:</span> <p className="pb-4 font-semibold">{formatFirebaseDate(selectedVoucher.createdAt)}</p>
                <span className="text-sm font-sm text-zinc-400">Data de expiração do voucher:</span> <p className="pb-4 font-semibold">{formatFirebaseDate(selectedVoucher.expiresAt)}</p>
                {selectedVoucher.usedAt && (
                  <><span className="text-sm font-sm text-zinc-400">Data de utilização do voucher:</span><p className="pb-4 font-semibold">{formatFirebaseDate(selectedVoucher.usedAt)}</p></>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-sm text-zinc-400">Desconto</h3>
                <p className="text-zinc-500 font-semibold">{selectedVoucher.discount}</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-sm text-zinc-400">Descrição do Voucher</h3>
                <p className="text-zinc-500 font-semibold">{selectedVoucher.voucherDescription}</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-sm text-zinc-400">Limite de Uso</h3>
                <p className="text-zinc-500 font-semibold">{selectedVoucher.usageLimit}</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-sm text-zinc-400">Regras do Desconto</h3>
                <p className="text-zinc-500 font-semibold">{selectedVoucher.discountRules}</p>
              </div>

              {selectedVoucher.status === "expired" ? (
                <Button 
                  className="w-full bg-red-200 text-semibold text-red-800" 
                  variant="secondary" 
                  disabled
                >
                  Voucher Expirado
                </Button>
              ) : selectedVoucher.status === "used" ? (
                <Button 
                  className="w-full bg-zinc-400 text-white text-semibold" 
                  variant="secondary" 
                  disabled
                >
                  Voucher Utilizado
                </Button>
              ) : (
                <Button
                  className="w-full bg-emerald-500 text-white hover:bg-emerald-600" 
                  onClick={() => performCheckIn(selectedVoucher.code)}
                >
                  Realizar Check-in
                </Button>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    )
  }

  if (loading) {
    return (
      <div className="container py-6">
        <h1 className="text-2xl font-bold text-zinc-500">Relatório de Vouchers</h1>
        <div className="text-zinc-400">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-zinc-500">Relatório de Vouchers</h1>
        
        <div className="flex items-center space-x-4">
          {/* Campo de busca */}
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              type="text"
              placeholder="Buscar em todos os campos..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                performGlobalSearch(e.target.value)
              }}
              className="pl-10 bg-white border-zinc-200 text-zinc-400 w-full placeholder:text-zinc-400"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 p-0 text-zinc-400 hover:text-zinc-500"
                onClick={() => {
                  setSearchTerm('')
                  performGlobalSearch('')
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Botões existentes */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="border-zinc-200 text-zinc-400 hover:bg-zinc-100"
              onClick={() => setViewMode(viewMode === "kanban" ? "list" : "kanban")}
            >
              {viewMode === "kanban" ? <List className="h-4 w-4" /> : <Columns3 className="h-4 w-4" />}
            </Button>
            
            {hasActiveFilters(filters) && (
              <Button
                variant="outline"
                className="border-zinc-200 text-red-500 hover:bg-red-500/10 space-x-2 "
                onClick={clearFilters}
              >
                <X className="h-4 w-4" />
                <span>Limpar Filtros</span>
              </Button>
            )}
            
            <Button
              variant="outline"
              className="border-zinc-200 text-zinc-400 hover:bg-zinc-100"
              onClick={() => setIsFilterOpen(true)}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {viewMode === "kanban" ? (
        <KanbanView vouchers={filteredVouchers} />
      ) : (
        <div className="space-y-4">
          <Card className="bg-zinc-50 border-zinc-100">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-zinc-400/60">Código</TableHead>
                  <TableHead className="text-zinc-400/60">Cliente</TableHead>
                  <TableHead className="text-zinc-400/60">Data de Criação</TableHead>
                  <TableHead className="text-zinc-400/60">Status</TableHead>
                  <TableHead className="text-zinc-400/60">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentVouchers.map((voucher) => (
                  <TableRow key={voucher.id} className="hover:bg-zinc-200/50 transition-colors">
                    <TableCell className="text-zinc-400 font-semibold">{voucher.code}</TableCell>
                    <TableCell className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8 border border-zinc-200">
                        {voucher.member.photoURL && (
                          <AvatarImage src={voucher.member.photoURL} />
                        )}
                        <AvatarFallback className="bg-zinc-100 text-zinc-400">
                          {voucher.member.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar> 
                      <span className="text-zinc-400 font-semibold">{voucher.member.name}</span>
                    </TableCell>
                    <TableCell className="text-zinc-400 font-semibold">
                      {formatFirebaseDate(voucher.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(voucher.status)}>
                        {getStatusText(voucher.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        className="text-zinc-400 hover:text-zinc-500 hover:bg-zinc-200 rounded-xl"
                        onClick={() => {
                          setSelectedVoucher(voucher)
                          setIsDetailsOpen(true)
                        }}
                      >
                        <Eye size={30} className="h-6 w-6" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Paginação */}
          <div className="flex justify-center items-center space-x-4">
            <Button
              variant="outline"
              className="border-zinc-200 text-zinc-400"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-zinc-400">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              className="border-zinc-200 text-zinc-400"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <FilterSidebar
        isOpen={isFilterOpen}
        onOpenChange={setIsFilterOpen}
        initialFilters={filters}
        onApplyFilters={applyFilters}
      />

      <VoucherDetails
        voucher={selectedVoucher}
        onClose={() => setIsDetailsOpen(false)}
        onCheckIn={performCheckIn}
      />
    </div>
  )
}
