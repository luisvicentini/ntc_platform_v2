"use client"

import React, { useState, useEffect } from "react"
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
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Calendar, 
  Filter, 
  Columns3, 
  List, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Search, 
  Eye, 
  DollarSign, 
  Ticket,
  BarChart,
  PieChart,
  LineChart,
  LayoutGrid,
  ListFilter,
  Package,
  MousePointerClick
} from "lucide-react"
import { format, subDays, startOfDay, endOfDay, differenceInDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { useAuth } from "@/contexts/auth-context"
import { RouteGuard } from "@/components/auth/route-guard"

// Tipagem para datas do Firebase
interface FirebaseTimestamp {
  seconds: number;
  nanoseconds: number;
}

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
  createdAt: string | FirebaseTimestamp
  expiresAt: string | FirebaseTimestamp
  usedAt?: string | FirebaseTimestamp
  member: Member
  establishment: Establishment
  discount: number
  partnerId?: string
  voucherDescription?: string
  usageLimit?: number | string
  discountRules?: string
}

// Interface para assinaturas
interface Subscription {
  id: string
  status: "active" | "canceled" | "expired" | "pending" | "trial" | "inactive"
  startDate: string | FirebaseTimestamp
  endDate: string | FirebaseTimestamp
  member: Member
  planId: string
  planName: string
  planPrice: number
  metadata?: {
    paymentMethod?: string
    lastPaymentDate?: string | FirebaseTimestamp
    nextPaymentDate?: string | FirebaseTimestamp
    isEngaged?: boolean // Se o assinante gerou vouchers ou clicou em produtos
    voucherCount?: number
    hasTransactions?: boolean
    rawData?: string // Campo que pode conter "Abandoned_Cart"
  }
}

// Interface para carrinhos abandonados
interface AbandonedCart {
  id: string
  userId: string
  userName: string
  userEmail?: string
  userPhone?: string
  createdAt: string | FirebaseTimestamp
  rawData: string
  transactionId?: string
  status: string
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

interface ProductStats {
  productId: string;
  clickCount: number;
  lastClickAt: string;
  createdAt: string;
  product?: {
    id: string;
    name: string;
    description: string;
    image: string;
    voucher: string;
    partnerId: string;
  };
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
      <SheetContent className="bg-zinc-100 w-[400px] overflow-y-auto">
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

// Componente de Tabs
const Tabs = ({ tabs, activeTab, setActiveTab }: { 
  tabs: { id: string, label: string, icon: React.ReactNode }[],
  activeTab: string,
  setActiveTab: (id: string) => void 
}) => {
  return (
    <div className="border-b border-zinc-200 mb-6">
      <div className="flex space-x-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center px-4 py-2 text-sm font-medium ${
              activeTab === tab.id
                ? "text-primary border-b-2 border-primary"
                : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50 rounded-t-md"
            }`}
          >
            {tab.icon}
            <span className="ml-2">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// Componente para o gráfico de status
const StatusChart = ({ vouchers }: { vouchers: Voucher[] }) => {
  // Calcular a contagem de status
  const statusCounts = {
    pending: vouchers.filter(v => v.status === "pending").length,
    verified: vouchers.filter(v => v.status === "verified").length,
    used: vouchers.filter(v => v.status === "used").length,
    expired: vouchers.filter(v => v.status === "expired").length
  };

  const totalVouchers = vouchers.length;
  const getPercentage = (count: number) => {
    return totalVouchers > 0 ? Math.round((count / totalVouchers) * 100) : 0;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "#f59e0b";
      case "verified": return "#3b82f6";
      case "used": return "#10b981";
      case "expired": return "#a1a1aa";
      default: return "#a1a1aa";
    }
  };

  const statusLabels = {
    pending: "Pendentes",
    verified: "Verificados",
    used: "Utilizados",
    expired: "Expirados"
  };

  // Calcular o total de vouchers ativos (não expirados e não utilizados)
  const activeVouchers = statusCounts.pending + statusCounts.verified;
  const activePercentage = getPercentage(activeVouchers);

  // Componente para o gráfico de status
  return (
    <Card className="shadow-sm">
      <div className="p-6 border-b border-zinc-100">
        <h3 className="text-lg font-medium flex items-center">
          <PieChart className="mr-2 h-5 w-5 text-zinc-500" />
          Vouchers por Status
        </h3>
        <p className="text-sm text-zinc-500 mt-1">
          Distribuição dos cupons por status atual
        </p>
      </div>
      
      <div className="p-6">
        {/* Gráfico visual */}
        <div className="relative flex justify-center mb-6">
          <div className="w-48 h-48 rounded-full">
            {Object.entries(statusCounts).map(([status, count], index) => {
              if (count === 0) return null;
              
              const percentage = getPercentage(count);
              const offset = Object.entries(statusCounts)
                .slice(0, index)
                .reduce((acc, [_, c]) => acc + getPercentage(c), 0);
              
              return (
                <svg key={status} className="absolute top-0 left-0" width="100%" height="100%" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke={getStatusColor(status)}
                    strokeWidth="20"
                    strokeDasharray={`${percentage * 2.51} 251`}
                    strokeDashoffset={`${-offset * 2.51 + 62.75}`}
                    transform="rotate(-90 50 50)"
                  />
                </svg>
              );
            })}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
              <div className="text-3xl font-bold">{activePercentage}%</div>
              <div className="text-sm text-zinc-500">Ativos</div>
            </div>
          </div>
        </div>
        
        {/* Legenda */}
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(statusCounts).map(([status, count]) => (
            <div key={status} className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: getStatusColor(status) }}
              ></div>
              <div className="text-sm flex-1">
                <div className="flex justify-between">
                  <span className="font-medium">{statusLabels[status as keyof typeof statusLabels]}</span>
                  <span>{count}</span>
                </div>
                <div className="w-full bg-zinc-100 rounded-full h-1.5 mt-1">
                  <div 
                    className="h-1.5 rounded-full" 
                    style={{ 
                      width: `${getPercentage(count)}%`, 
                      backgroundColor: getStatusColor(status) 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

const convertToDate = (date: string | FirebaseTimestamp | undefined): Date => {
    if (!date) return new Date();
    
    if (typeof date === 'object' && 'seconds' in date) {
      return new Date(date.seconds * 1000);
    }
    
    return new Date(date);
  }


// Componente para o gráfico de uso por tempo
const TimeChart = ({ vouchers }: { vouchers: Voucher[] }) => {
    // Função auxiliar para converter timestamp do Firebase para Date
  
  // Função para formatar datas com data e hora completos
  const formatFirebaseDate = (date: string | FirebaseTimestamp | undefined) => {
    if (!date) return "Data indisponível";
    
    try {
      const dateObj = convertToDate(date);
      // Formatar como DD/MM/YYYY às HH:MM
      return format(dateObj, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch (error) {
      return "Data inválida";
    }
  };
  // Calcular dados de uso
  const now = new Date();
  const lastMonth = subDays(now, 30);
  
  // Vouchers criados nos últimos 30 dias
  const recentVouchers = vouchers.filter(v => {
    const createdDate = convertToDate(v.createdAt);
    return createdDate >= lastMonth;
  });

  // Calcular a taxa de conversão (quantos foram utilizados)
  const usedVouchers = vouchers.filter(v => v.status === "used");
  const conversionRate = vouchers.length > 0 ? Math.round((usedVouchers.length / vouchers.length) * 100) : 0;
  
  // Calcular o tempo médio até o uso (para vouchers utilizados)
  const usedVouchersWithDates = vouchers.filter(v => v.status === "used" && v.usedAt);
  
  let averageTimeToUse = 0;
  if (usedVouchersWithDates.length > 0) {
    const totalDays = usedVouchersWithDates.reduce((total, v) => {
      const createdDate = convertToDate(v.createdAt);
      const usedDate = convertToDate(v.usedAt!);
      return total + differenceInDays(usedDate, createdDate);
    }, 0);
    averageTimeToUse = Math.round(totalDays / usedVouchersWithDates.length);
  }

  // Calcular a taxa de expiração (cupons expirados)
  const expiredVouchers = vouchers.filter(v => v.status === "expired");
  const expirationRate = vouchers.length > 0 ? Math.round((expiredVouchers.length / vouchers.length) * 100) : 0;

  const metrics = [
    {
      label: "Recentes",
      value: recentVouchers.length,
      description: "Cupons criados nos últimos 30 dias",
      icon: <Calendar className="h-5 w-5" />,
      color: "bg-blue-500"
    },
    {
      label: "Taxa de Uso",
      value: `${conversionRate}%`,
      description: "Percentual de cupons utilizados",
      icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      color: "bg-emerald-500"
    },
    {
      label: "Tempo Médio",
      value: averageTimeToUse,
      suffix: " dias",
      description: "Tempo médio entre criação e uso",
      icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      color: "bg-amber-500"
    },
    {
      label: "Taxa de Expiração",
      value: `${expirationRate}%`,
      description: "Percentual de cupons expirados",
      icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
      color: "bg-zinc-500"
    }
  ];

  // Componente para o gráfico de uso por tempo
  return (
    <Card className="shadow-sm">
      <div className="p-6 border-b border-zinc-100">
        <h3 className="text-lg font-medium flex items-center">
          <LineChart className="mr-2 h-5 w-5 text-zinc-500" />
          Métricas de Performance
        </h3>
        <p className="text-sm text-zinc-500 mt-1">
          Indicadores de eficiência e tempo de uso dos cupons
        </p>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-2 gap-6">
          {metrics.map((metric, index) => (
            <div key={index} className="bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden flex flex-col">
              <div className={`${metric.color} h-1`}></div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex flex-col justify-between items-start">
                    <div className={`${metric.color} bg-opacity-10 p-2 rounded-full`}>
                        <div className={`${metric.color} text-white rounded-full p-1`}>
                        {metric.icon}
                        </div>
                    </div>
                    <div className="font-medium text-zinc-500 text-sm">{metric.label}</div>
                  
                </div>
                <div className="mt-3 mb-1 flex items-baseline">
                  <span className="text-2xl font-bold">{metric.value}</span>
                  {metric.suffix && <span className="ml-1 text-zinc-500">{metric.suffix}</span>}
                </div>
                <p className="text-xs text-zinc-500 mt-auto">{metric.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

// Componente para o gráfico de estabelecimentos
const EstablishmentChart = ({ vouchers }: { vouchers: Voucher[] }) => {
  // Agrupar vouchers por estabelecimento
  const establishmentGroups = vouchers.reduce((groups: Record<string, Voucher[]>, voucher) => {
    const key = voucher.establishment.id;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(voucher);
    return groups;
  }, {});

  // Ordenar estabelecimentos por quantidade de vouchers (top 10)
  const topEstablishments = Object.entries(establishmentGroups)
    .map(([id, vouchers]) => ({
      id,
      name: vouchers[0].establishment.name,
      count: vouchers.length,
      // Adicionar contagem por status
      statusCounts: {
        pending: vouchers.filter(v => v.status === "pending").length,
        verified: vouchers.filter(v => v.status === "verified").length,
        used: vouchers.filter(v => v.status === "used").length,
        expired: vouchers.filter(v => v.status === "expired").length
      }
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const maxCount = Math.max(...topEstablishments.map(e => e.count), 1);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "#f59e0b";
      case "verified": return "#3b82f6";
      case "used": return "#10b981";
      case "expired": return "#a1a1aa";
      default: return "#a1a1aa";
    }
  };

  return (
    <Card className="shadow-sm">
      <div className="p-6 border-b border-zinc-100">
        <h3 className="text-lg font-medium flex items-center">
          <BarChart className="mr-2 h-5 w-5 text-zinc-500" />
          Estabelecimentos com Mais Vouchers
        </h3>
        <p className="text-sm text-zinc-500 mt-1">
          Top 10 estabelecimentos por volume de cupons gerados
        </p>
      </div>
      
      <div className="p-6">
        {topEstablishments.length > 0 ? (
          <div className="space-y-6">
            {topEstablishments.map((establishment) => (
              <div key={establishment.id}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium truncate max-w-[300px]">
                    {establishment.name}
                  </span>
                  <span className="text-sm font-medium">{establishment.count} cupons</span>
                </div>
                
                <div className="w-full bg-zinc-100 rounded-full h-4 overflow-hidden flex">
                  {Object.entries(establishment.statusCounts).map(([status, count]) => {
                    if (count === 0) return null;
                    const width = (count / establishment.count) * 100;
                    return (
                      <div 
                        key={status}
                        className="h-full"
                        style={{ 
                          width: `${width}%`, 
                          backgroundColor: getStatusColor(status) 
                        }}
                        title={`${status}: ${count}`}
                      ></div>
                    );
                  })}
                </div>
                
                <div className="flex text-xs mt-1.5 space-x-3">
                  {Object.entries(establishment.statusCounts).map(([status, count]) => {
                    if (count === 0) return null;
                    return (
                      <div key={status} className="flex items-center">
                        <div 
                          className="w-2 h-2 rounded-full mr-1"
                          style={{ backgroundColor: getStatusColor(status) }}
                        ></div>
                        <span>{getStatusText(status as any)}: {count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-zinc-400">
            <svg className="mx-auto h-12 w-12 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <p className="mt-2">Sem dados suficientes para exibir</p>
          </div>
        )}
      </div>
    </Card>
  );
};

// Componente para o gráfico de tendências mensais
const VoucherTrendsChart = ({ vouchers }: { vouchers: Voucher[] }) => {
  // Obter os últimos 6 meses
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now);
    d.setMonth(d.getMonth() - i);
    return {
      date: d,
      month: format(d, 'MMM', { locale: ptBR }),
      year: d.getFullYear()
    };
  }).reverse();

  // Contar vouchers por mês
  const vouchersByMonth = months.map(monthData => {
    const monthVouchers = vouchers.filter(v => {
      const createdDate = convertToDate(v.createdAt);
      return createdDate.getMonth() === monthData.date.getMonth() && 
             createdDate.getFullYear() === monthData.date.getFullYear();
    });
    
    return {
      ...monthData,
      total: monthVouchers.length,
      used: monthVouchers.filter(v => v.status === "used").length,
      expired: monthVouchers.filter(v => v.status === "expired").length,
      pending: monthVouchers.filter(v => v.status === "pending").length
    };
  });

  // Calcular a alteração percentual do último mês para o atual
  const currentMonth = vouchersByMonth[vouchersByMonth.length - 1].total;
  const previousMonth = vouchersByMonth[vouchersByMonth.length - 2]?.total || 0;
  const percentChange = previousMonth === 0 
    ? currentMonth > 0 ? 100 : 0 
    : Math.round(((currentMonth - previousMonth) / previousMonth) * 100);

  const maxValue = Math.max(...vouchersByMonth.map(m => m.total), 5);

  return (
    <Card className="shadow-sm">
      <div className="p-6 border-b border-zinc-100">
        <h3 className="text-lg font-medium flex items-center">
          <LineChart className="mr-2 h-5 w-5 text-zinc-500" />
          Tendência de Uso
        </h3>
        <p className="text-sm text-zinc-500 mt-1">
          Evolução da criação e uso de cupons nos últimos 6 meses
        </p>
      </div>
      
      <div className="p-6">
        <div className="relative h-64">
          {/* Linhas de grade horizontais */}
          {Array.from({ length: 5 }, (_, i) => (
            <div 
              key={i} 
              className="absolute left-0 right-0 border-t border-zinc-100" 
              style={{ top: `${20 * (i + 1)}%` }}
            >
              <span className="absolute -top-2.5 -left-1 text-xs text-zinc-400">
                {Math.round(maxValue - (maxValue / 5) * (i + 1))}
              </span>
            </div>
          ))}
          
          {/* Gráfico de barras */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between items-end h-[90%]">
            {vouchersByMonth.map((data, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="relative w-12 flex flex-col items-center">
                  {/* Barra para total */}
                  <div 
                    className="w-8 bg-primary bg-opacity-15 rounded-t-sm"
                    style={{ 
                      height: `${Math.max((data.total / maxValue) * 100, 2)}%` 
                    }}
                  >
                    {/* Barra para utilizados */}
                    <div 
                      className="absolute bottom-0 w-8 bg-emerald-500 rounded-t-sm"
                      style={{ 
                        height: `${Math.max((data.used / maxValue) * 100, 0)}%` 
                      }}
                    ></div>
                    {/* Barra para pendentes */}
                    <div 
                      className="absolute bottom-0 w-8 bg-amber-500 rounded-t-sm"
                      style={{ 
                        height: `${Math.max((data.pending / maxValue) * 100, 0)}%`,
                        marginBottom: `${Math.max((data.used / maxValue) * 100, 0)}%`
                      }}
                    ></div>
                    {/* Barra para expirados */}
                    <div 
                      className="absolute bottom-0 w-8 bg-zinc-400 rounded-t-sm"
                      style={{ 
                        height: `${Math.max((data.expired / maxValue) * 100, 0)}%`,
                        marginBottom: `${Math.max((data.used / maxValue) * 100 + (data.pending / maxValue) * 100, 0)}%`
                      }}
                    ></div>
                  </div>
                  
                  {/* Rótulo acima da barra */}
                  {data.total > 0 && (
                    <div className="absolute -top-6 text-xs font-medium">{data.total}</div>
                  )}
                </div>
                
                {/* Rótulo do mês */}
                <div className="mt-2 text-xs text-zinc-500 capitalize">
                  {data.month}/{data.year.toString().substr(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Legenda e Estatísticas */}
        <div className="flex flex-col md:flex-row justify-between mt-4">
          <div className="flex space-x-6 text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-primary bg-opacity-15 mr-2"></div>
              <span>Todos</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-emerald-500 mr-2"></div>
              <span>Utilizados</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-amber-500 mr-2"></div>
              <span>Pendentes</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-zinc-400 mr-2"></div>
              <span>Expirados</span>
            </div>
          </div>
          
          <div className="flex items-center mt-2 md:mt-0">
            <span className="text-sm text-zinc-500 mr-2">Variação mês atual:</span>
            <span className={`text-sm font-medium ${percentChange >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {percentChange >= 0 ? '+' : ''}{percentChange}%
              {percentChange >= 0 ? (
                <svg className="inline-block h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              ) : (
                <svg className="inline-block h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
                </svg>
              )}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};

// Componente para mostrar KPIs (Indicadores-chave de desempenho)
const KPIOverview = ({ vouchers }: { vouchers: Voucher[] }) => {
  // Taxa geral de conversão (vouchers usados)
  const usedVouchers = vouchers.filter(v => v.status === "used");
  const conversionRate = vouchers.length > 0 ? Math.round((usedVouchers.length / vouchers.length) * 100) : 0;
  
  // Taxa de expiração (vouchers expirados)
  const expiredVouchers = vouchers.filter(v => v.status === "expired");
  const expirationRate = vouchers.length > 0 ? Math.round((expiredVouchers.length / vouchers.length) * 100) : 0;
  
  // Valor médio de desconto
  const averageDiscount = vouchers.length > 0 
    ? Math.round(vouchers.reduce((sum, v) => sum + (v.discount || 0), 0) / vouchers.length) 
    : 0;
  
  // Estabelecimento mais popular
  const establishmentMap = vouchers.reduce((acc, v) => {
    const id = v.establishment.id;
    acc[id] = acc[id] || { name: v.establishment.name, count: 0 };
    acc[id].count++;
    return acc;
  }, {} as Record<string, { name: string, count: number }>);
  
  const topEstablishment = Object.values(establishmentMap)
    .sort((a, b) => b.count - a.count)[0] || { name: "-", count: 0 };

  const kpis = [
    {
      title: "Total de Vouchers",
      value: vouchers.length.toString(),
      icon: <Ticket className="h-5 w-5 text-indigo-500" />,
      color: "bg-indigo-50 text-indigo-700 border-indigo-100"
    },
    {
      title: "Taxa de Utilização",
      value: `${conversionRate}%`,
      icon: <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      color: "bg-emerald-50 text-emerald-700 border-emerald-100"
    },
    {
      title: "Taxa de Expiração",
      value: `${expirationRate}%`,
      icon: <svg className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      color: "bg-amber-50 text-amber-700 border-amber-100"
    },
    {
      title: "Desconto Médio",
      value: `${averageDiscount}%`,
      icon: <DollarSign className="h-5 w-5 text-blue-500" />,
      color: "bg-blue-50 text-blue-700 border-blue-100"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {kpis.map((kpi, index) => (
        <div key={index} className={`rounded-lg border ${kpi.color} p-4 flex items-center`}>
          <div className={`mr-4 p-2 rounded-full bg-white`}>
            {kpi.icon}
          </div>
          <div>
            <h3 className="text-sm font-medium opacity-80">{kpi.title}</h3>
            <p className="text-2xl font-bold">{kpi.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

// Conteúdo da aba de gráficos
const ChartsTab = ({ vouchers }: { vouchers: Voucher[] }) => {
  return (
    <div className="space-y-6">
      <KPIOverview vouchers={vouchers} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StatusChart vouchers={vouchers} />
        <TimeChart vouchers={vouchers} />
      </div>
      <VoucherTrendsChart vouchers={vouchers} />
      <EstablishmentChart vouchers={vouchers} />
    </div>
  );
};

// Componente para relatórios de produtos
const ProductsReport = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Carregar dados dos produtos
  useEffect(() => {
    const fetchProductStats = async () => {
      try {
        setLoading(true);
        
        // Obter os produtos com estatísticas
        const response = await fetch('/api/products/stats');
        if (!response.ok) {
          throw new Error('Falha ao buscar estatísticas de produtos');
        }
        
        const data = await response.json();
        setProducts(data.products || []);
      } catch (error) {
        console.error('Erro ao carregar estatísticas de produtos:', error);
        toast.error('Erro ao carregar estatísticas de produtos');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProductStats();
  }, []);
  
  // Filtrar produtos por termo de pesquisa
  const filteredProducts = products.filter(item => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (item.name || '').toLowerCase().includes(term) ||
      (item.description || '').toLowerCase().includes(term) ||
      (item.voucher || '').toLowerCase().includes(term)
    );
  });
  
  // Calcular totais
  const totalClicks = products.reduce((sum, item) => sum + (item.stats?.clickCount || 0), 0);
  const avgClicksPerProduct = products.length > 0 ? Math.round(totalClicks / products.length) : 0;
  
  // Encontrar o produto mais popular
  const mostPopularProduct = products.length > 0 ? products[0] : null;
  
  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-lg border bg-indigo-50 text-indigo-700 border-indigo-100 p-4 flex items-center">
          <div className="mr-4 p-2 rounded-full bg-white">
            <Package className="h-5 w-5 text-indigo-500" />
          </div>
          <div>
            <h3 className="text-sm font-medium opacity-80">Total de Produtos</h3>
            <p className="text-2xl font-bold">{products.length}</p>
          </div>
        </div>
        
        <div className="rounded-lg border bg-emerald-50 text-emerald-700 border-emerald-100 p-4 flex items-center">
          <div className="mr-4 p-2 rounded-full bg-white">
            <MousePointerClick className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <h3 className="text-sm font-medium opacity-80">Total de Cliques</h3>
            <p className="text-2xl font-bold">{totalClicks}</p>
          </div>
        </div>
        
        <div className="rounded-lg border bg-blue-50 text-blue-700 border-blue-100 p-4 flex items-center">
          <div className="mr-4 p-2 rounded-full bg-white">
            <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium opacity-80">Média por Produto</h3>
            <p className="text-2xl font-bold">{avgClicksPerProduct}</p>
          </div>
        </div>
        
        <div className="rounded-lg border bg-amber-50 text-amber-700 border-amber-100 p-4 flex items-center">
          <div className="mr-4 p-2 rounded-full bg-white">
            <svg className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium opacity-80">Produto Popular</h3>
            <p className="text-2xl font-bold">{mostPopularProduct?.stats?.clickCount || 0}</p>
          </div>
        </div>
      </div>
      
      {/* Pesquisa e tabela */}
      <Card className="shadow-sm">
        <div className="p-6 border-b border-zinc-100">
          <h3 className="text-lg font-medium flex items-center">
            <BarChart className="mr-2 h-5 w-5 text-zinc-500" />
            Estatísticas de Cliques em Produtos
          </h3>
          <p className="text-sm text-zinc-500 mt-1">
            Análise do número de vezes que cada código promocional foi copiado
          </p>
        </div>
        
        <div className="p-6">
          {/* Barra de pesquisa */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input 
                className="pl-10 bg-white"
                placeholder="Buscar por nome, código ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white rounded-lg p-8 text-center">
              <div className="mx-auto w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
                <Package className="h-8 w-8 text-zinc-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">Nenhum produto encontrado</h3>
              <p className="text-zinc-500 mb-4">
                Não foram encontrados produtos com os filtros aplicados.
              </p>
              {searchTerm && (
                <Button variant="outline" onClick={() => setSearchTerm('')}>
                  Limpar Pesquisa
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead className="min-w-[200px]">Produto</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead className="text-right">Cliques</TableHead>
                    <TableHead className="hidden md:table-cell">Último Clique</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded overflow-hidden bg-zinc-100 flex-shrink-0">
                            {item.image ? (
                              <img 
                                src={item.image} 
                                alt={item.name || 'Produto'} 
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "/placeholder.svg";
                                }}
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center bg-zinc-200">
                                <Package className="h-5 w-5 text-zinc-400" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium line-clamp-1">{item.name || 'Produto sem nome'}</p>
                            <p className="text-xs text-zinc-500 line-clamp-1">{item.description || 'Sem descrição'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {item.voucher || '-'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {item.stats?.clickCount || 0}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-zinc-500 text-sm">
                        {item.stats?.lastClickAt 
                          ? format(new Date(item.stats.lastClickAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                          : 'Nunca'
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

// Componente para o gráfico de tendências mensais
const TrendsChart = ({ vouchers }: { vouchers: Voucher[] }) => {
  // Obter os últimos 6 meses
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now);
    d.setMonth(d.getMonth() - i);
    return {
      date: d,
      month: format(d, 'MMM', { locale: ptBR }),
      year: d.getFullYear()
    };
  }).reverse();

  // Contar vouchers por mês
  const vouchersByMonth = months.map(monthData => {
    const monthVouchers = vouchers.filter(v => {
      const createdDate = convertToDate(v.createdAt);
      return createdDate.getMonth() === monthData.date.getMonth() && 
             createdDate.getFullYear() === monthData.date.getFullYear();
    });
    
    return {
      ...monthData,
      total: monthVouchers.length,
      used: monthVouchers.filter(v => v.status === "used").length,
      expired: monthVouchers.filter(v => v.status === "expired").length,
      pending: monthVouchers.filter(v => v.status === "pending").length
    };
  });

  // Calcular a alteração percentual do último mês para o atual
  const currentMonth = vouchersByMonth[vouchersByMonth.length - 1].total;
  const previousMonth = vouchersByMonth[vouchersByMonth.length - 2]?.total || 0;
  const percentChange = previousMonth === 0 
    ? currentMonth > 0 ? 100 : 0 
    : Math.round(((currentMonth - previousMonth) / previousMonth) * 100);

  const maxValue = Math.max(...vouchersByMonth.map(m => m.total), 5);

  return (
    <Card className="shadow-sm">
      <div className="p-6 border-b border-zinc-100">
        <h3 className="text-lg font-medium flex items-center">
          <LineChart className="mr-2 h-5 w-5 text-zinc-500" />
          Tendência de Uso
        </h3>
        <p className="text-sm text-zinc-500 mt-1">
          Evolução da criação e uso de cupons nos últimos 6 meses
        </p>
      </div>
      
      <div className="p-6">
        <div className="relative h-64">
          {/* Linhas de grade horizontais */}
          {Array.from({ length: 5 }, (_, i) => (
            <div 
              key={i} 
              className="absolute left-0 right-0 border-t border-zinc-100" 
              style={{ top: `${20 * (i + 1)}%` }}
            >
              <span className="absolute -top-2.5 -left-1 text-xs text-zinc-400">
                {Math.round(maxValue - (maxValue / 5) * (i + 1))}
              </span>
            </div>
          ))}
          
          {/* Gráfico de barras */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between items-end h-[90%]">
            {vouchersByMonth.map((data, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="relative w-12 flex flex-col items-center">
                  {/* Barra para total */}
                  <div 
                    className="w-8 bg-primary bg-opacity-15 rounded-t-sm"
                    style={{ 
                      height: `${Math.max((data.total / maxValue) * 100, 2)}%` 
                    }}
                  >
                    {/* Barra para utilizados */}
                    <div 
                      className="absolute bottom-0 w-8 bg-emerald-500 rounded-t-sm"
                      style={{ 
                        height: `${Math.max((data.used / maxValue) * 100, 0)}%` 
                      }}
                    ></div>
                    {/* Barra para pendentes */}
                    <div 
                      className="absolute bottom-0 w-8 bg-amber-500 rounded-t-sm"
                      style={{ 
                        height: `${Math.max((data.pending / maxValue) * 100, 0)}%`,
                        marginBottom: `${Math.max((data.used / maxValue) * 100, 0)}%`
                      }}
                    ></div>
                    {/* Barra para expirados */}
                    <div 
                      className="absolute bottom-0 w-8 bg-zinc-400 rounded-t-sm"
                      style={{ 
                        height: `${Math.max((data.expired / maxValue) * 100, 0)}%`,
                        marginBottom: `${Math.max((data.used / maxValue) * 100 + (data.pending / maxValue) * 100, 0)}%`
                      }}
                    ></div>
                  </div>
                  
                  {/* Rótulo acima da barra */}
                  {data.total > 0 && (
                    <div className="absolute -top-6 text-xs font-medium">{data.total}</div>
                  )}
                </div>
                
                {/* Rótulo do mês */}
                <div className="mt-2 text-xs text-zinc-500 capitalize">
                  {data.month}/{data.year.toString().substr(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Legenda e Estatísticas */}
        <div className="flex flex-col md:flex-row justify-between mt-4">
          <div className="flex space-x-6 text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-primary bg-opacity-15 mr-2"></div>
              <span>Todos</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-emerald-500 mr-2"></div>
              <span>Utilizados</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-amber-500 mr-2"></div>
              <span>Pendentes</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-zinc-400 mr-2"></div>
              <span>Expirados</span>
            </div>
          </div>
          
          <div className="flex items-center mt-2 md:mt-0">
            <span className="text-sm text-zinc-500 mr-2">Variação mês atual:</span>
            <span className={`text-sm font-medium ${percentChange >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {percentChange >= 0 ? '+' : ''}{percentChange}%
              {percentChange >= 0 ? (
                <svg className="inline-block h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              ) : (
                <svg className="inline-block h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
                </svg>
              )}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};

// Componente para mostrar KPIs de assinantes
const SubscribersKPIOverview = ({ subscriptions }: { subscriptions: Subscription[] }) => {
  const totalSubscriptions = subscriptions.length;
  
  // Contar assinantes por status
  const activeSubscriptions = subscriptions.filter(s => s.status === "active").length;
  const canceledSubscriptions = subscriptions.filter(s => s.status === "canceled").length;
  const expiredSubscriptions = subscriptions.filter(s => s.status === "expired").length;
  const pendingSubscriptions = subscriptions.filter(s => s.status === "pending").length;
  
  // Calcular assinantes engajados vs desengajados
  const engagedSubscribers = subscriptions.filter(s => s.metadata?.isEngaged).length;
  const subscribersWithVouchers = subscriptions.filter(s => (s.metadata?.voucherCount || 0) > 0).length;
  const disengagedSubscribers = activeSubscriptions - engagedSubscribers;
  
  // Calcular valor total de faturamento
  const totalRevenue = subscriptions.reduce((sum, s) => {
    // Contabilizar apenas assinaturas com transações
    if (s.metadata?.hasTransactions) {
      return sum + (s.planPrice || 0);
    }
    return sum;
  }, 0);

  // Calcular receita média por assinante
  const subscribersWithTransactions = subscriptions.filter(s => s.metadata?.hasTransactions).length;
  const averageRevenue = subscribersWithTransactions > 0 ? (totalRevenue / subscribersWithTransactions) : 0;
  
  // Criar array de KPIs para renderização
  const kpis = [
    {
      title: "Total de Assinantes",
      value: totalSubscriptions.toString(),
      icon: <svg className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
      color: "bg-indigo-50 text-indigo-700 border-indigo-100"
    },
    {
      title: "Assinantes Ativos",
      value: activeSubscriptions.toString(),
      icon: <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      color: "bg-emerald-50 text-emerald-700 border-emerald-100"
    },
    {
      title: "Faturamento Total",
      value: `R$ ${totalRevenue.toFixed(2)}`,
      icon: <DollarSign className="h-5 w-5 text-blue-500" />,
      color: "bg-blue-50 text-blue-700 border-blue-100"
    },
    {
      title: "Valor Médio",
      value: `R$ ${averageRevenue.toFixed(2)}`,
      icon: <svg className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      color: "bg-amber-50 text-amber-700 border-amber-100"
    }
  ];
  
  const statusKpis = [
    {
      title: "Assinantes Engajados",
      value: subscribersWithVouchers.toString(),
      percentage: totalSubscriptions > 0 ? Math.round((subscribersWithVouchers / totalSubscriptions) * 100) : 0,
      icon: <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>,
      color: "bg-emerald-50 text-emerald-700 border-emerald-100"
    },
    {
      title: "Assinantes Desengajados",
      value: disengagedSubscribers.toString(),
      percentage: totalSubscriptions > 0 ? Math.round((disengagedSubscribers / totalSubscriptions) * 100) : 0,
      icon: <svg className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2" /></svg>,
      color: "bg-amber-50 text-amber-700 border-amber-100"
    },
    {
      title: "Cancelamentos",
      value: canceledSubscriptions.toString(), 
      percentage: totalSubscriptions > 0 ? Math.round((canceledSubscriptions / totalSubscriptions) * 100) : 0,
      icon: <X className="h-5 w-5 text-red-500" />,
      color: "bg-red-50 text-red-700 border-red-100"
    },
    {
      title: "Expirados",
      value: expiredSubscriptions.toString(),
      percentage: totalSubscriptions > 0 ? Math.round((expiredSubscriptions / totalSubscriptions) * 100) : 0,
      icon: <svg className="h-5 w-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      color: "bg-zinc-100 text-zinc-700 border-zinc-200"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <div key={index} className={`rounded-lg border ${kpi.color} p-4 flex items-center`}>
            <div className={`mr-4 p-2 rounded-full bg-white`}>
              {kpi.icon}
            </div>
            <div>
              <h3 className="text-sm font-medium opacity-80">{kpi.title}</h3>
              <p className="text-2xl font-bold">{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statusKpis.map((kpi, index) => (
          <div key={index} className="bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
            <div className={`${kpi.color} h-1`}></div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`${kpi.color} bg-opacity-10 p-2 rounded-full`}>
                  <div className={`${kpi.color.replace('bg-', 'text-').replace('border-', '')} rounded-full p-1`}>
                    {kpi.icon}
                  </div>
                </div>
                <span className="text-sm font-medium text-zinc-500">{kpi.percentage}%</span>
              </div>
              <h3 className="font-medium text-zinc-700">{kpi.title}</h3>
              <p className="text-2xl font-bold mt-1">{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Componente para o gráfico de status das assinaturas
const SubscriptionStatusChart = ({ subscriptions }: { subscriptions: Subscription[] }) => {
  // Calcular a contagem de status
  const statusCounts = {
    active: subscriptions.filter(s => s.status === "active").length,
    canceled: subscriptions.filter(s => s.status === "canceled").length,
    expired: subscriptions.filter(s => s.status === "expired").length,
    pending: subscriptions.filter(s => s.status === "pending").length,
    trial: subscriptions.filter(s => s.status === "trial").length
  };

  const totalSubscriptions = subscriptions.length;
  const getPercentage = (count: number) => {
    return totalSubscriptions > 0 ? Math.round((count / totalSubscriptions) * 100) : 0;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "#10b981"; // emerald-500
      case "trial": return "#3b82f6"; // blue-500
      case "pending": return "#f59e0b"; // amber-500
      case "canceled": return "#ef4444"; // red-500
      case "expired": return "#a1a1aa"; // zinc-400
      default: return "#a1a1aa"; // zinc-400
    }
  };

  const statusLabels = {
    active: "Ativos",
    trial: "Trial",
    pending: "Pendentes",
    canceled: "Cancelados",
    expired: "Expirados"
  };

  // Calcular o total de assinaturas ativas
  const activeSubscriptions = statusCounts.active + statusCounts.trial;
  const activePercentage = getPercentage(activeSubscriptions);

  return (
    <Card className="shadow-sm">
      <div className="p-6 border-b border-zinc-100">
        <h3 className="text-lg font-medium flex items-center">
          <PieChart className="mr-2 h-5 w-5 text-zinc-500" />
          Assinaturas por Status
        </h3>
        <p className="text-sm text-zinc-500 mt-1">
          Distribuição dos assinantes por status atual
        </p>
      </div>
      
      <div className="p-6">
        {/* Gráfico visual */}
        <div className="relative flex justify-center mb-6">
          <div className="w-48 h-48 rounded-full">
            {Object.entries(statusCounts).map(([status, count], index) => {
              if (count === 0) return null;
              
              const percentage = getPercentage(count);
              const offset = Object.entries(statusCounts)
                .slice(0, index)
                .reduce((acc, [_, c]) => acc + getPercentage(c), 0);
              
              return (
                <svg key={status} className="absolute top-0 left-0" width="100%" height="100%" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke={getStatusColor(status)}
                    strokeWidth="20"
                    strokeDasharray={`${percentage * 2.51} 251`}
                    strokeDashoffset={`${-offset * 2.51 + 62.75}`}
                    transform="rotate(-90 50 50)"
                  />
                </svg>
              );
            })}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
              <div className="text-3xl font-bold">{activePercentage}%</div>
              <div className="text-sm text-zinc-500">Ativos</div>
            </div>
          </div>
        </div>
        
        {/* Legenda */}
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(statusCounts).map(([status, count]) => (
            <div key={status} className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: getStatusColor(status) }}
              ></div>
              <div className="text-sm flex-1">
                <div className="flex justify-between">
                  <span className="font-medium">{statusLabels[status as keyof typeof statusLabels]}</span>
                  <span>{count}</span>
                </div>
                <div className="w-full bg-zinc-100 rounded-full h-1.5 mt-1">
                  <div 
                    className="h-1.5 rounded-full" 
                    style={{ 
                      width: `${getPercentage(count)}%`, 
                      backgroundColor: getStatusColor(status) 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

// Componente para o gráfico de tendências de assinaturas mensais
const SubscriptionTrendsChart = ({ subscriptions }: { subscriptions: Subscription[] }) => {
  // Obter os últimos 6 meses
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now);
    d.setMonth(d.getMonth() - i);
    return {
      date: d,
      month: format(d, 'MMM', { locale: ptBR }),
      year: d.getFullYear()
    };
  }).reverse();

  // Contar assinaturas por mês
  const subscriptionsByMonth = months.map(monthData => {
    const monthSubscriptions = subscriptions.filter(s => {
      const startDate = convertToDate(s.startDate);
      return startDate.getMonth() === monthData.date.getMonth() && 
             startDate.getFullYear() === monthData.date.getFullYear();
    });
    
    const activeThisMonth = subscriptions.filter(s => {
      const startDate = convertToDate(s.startDate);
      const endDate = convertToDate(s.endDate);
      
      // Verificar se a assinatura estava ativa durante este mês
      return startDate <= monthData.date && 
             (endDate >= monthData.date || s.status === "active");
    });
    
    return {
      ...monthData,
      total: activeThisMonth.length,
      new: monthSubscriptions.length,
      canceled: monthSubscriptions.filter(s => s.status === "canceled").length,
      expired: monthSubscriptions.filter(s => s.status === "expired").length,
      pending: monthSubscriptions.filter(s => s.status === "pending").length
    };
  });

  // Calcular a alteração percentual do último mês para o atual
  const currentMonth = subscriptionsByMonth[subscriptionsByMonth.length - 1].total;
  const previousMonth = subscriptionsByMonth[subscriptionsByMonth.length - 2]?.total || 0;
  const percentChange = previousMonth === 0 
    ? currentMonth > 0 ? 100 : 0 
    : Math.round(((currentMonth - previousMonth) / previousMonth) * 100);

  const maxValue = Math.max(...subscriptionsByMonth.map(m => m.total), 5);

  return (
    <Card className="shadow-sm">
      <div className="p-6 border-b border-zinc-100">
        <h3 className="text-lg font-medium flex items-center">
          <LineChart className="mr-2 h-5 w-5 text-zinc-500" />
          Tendência de Assinaturas
        </h3>
        <p className="text-sm text-zinc-500 mt-1">
          Evolução das assinaturas nos últimos 6 meses
        </p>
      </div>
      
      <div className="p-6">
        <div className="relative h-64">
          {/* Linhas de grade horizontais */}
          {Array.from({ length: 5 }, (_, i) => (
            <div 
              key={i} 
              className="absolute left-0 right-0 border-t border-zinc-100" 
              style={{ top: `${20 * (i + 1)}%` }}
            >
              <span className="absolute -top-2.5 -left-1 text-xs text-zinc-400">
                {Math.round(maxValue - (maxValue / 5) * (i + 1))}
              </span>
            </div>
          ))}
          
          {/* Gráfico de barras */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between items-end h-[90%]">
            {subscriptionsByMonth.map((data, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="relative w-12 flex flex-col items-center">
                  {/* Barra para total */}
                  <div 
                    className="w-8 bg-primary bg-opacity-15 rounded-t-sm"
                    style={{ 
                      height: `${Math.max((data.total / maxValue) * 100, 2)}%` 
                    }}
                  >
                    {/* Barra para novos */}
                    <div 
                      className="absolute bottom-0 w-8 bg-blue-500 rounded-t-sm"
                      style={{ 
                        height: `${Math.max((data.new / maxValue) * 100, 0)}%` 
                      }}
                    ></div>
                    {/* Barra para cancelados */}
                    <div 
                      className="absolute bottom-0 w-8 bg-red-500 rounded-t-sm"
                      style={{ 
                        height: `${Math.max((data.canceled / maxValue) * 100, 0)}%`,
                        marginBottom: `${Math.max((data.new / maxValue) * 100, 0)}%`
                      }}
                    ></div>
                    {/* Barra para expirados */}
                    <div 
                      className="absolute bottom-0 w-8 bg-zinc-400 rounded-t-sm"
                      style={{ 
                        height: `${Math.max((data.expired / maxValue) * 100, 0)}%`,
                        marginBottom: `${Math.max((data.new / maxValue) * 100 + (data.canceled / maxValue) * 100, 0)}%`
                      }}
                    ></div>
                  </div>
                  
                  {/* Rótulo acima da barra */}
                  {data.total > 0 && (
                    <div className="absolute -top-6 text-xs font-medium">{data.total}</div>
                  )}
                </div>
                
                {/* Rótulo do mês */}
                <div className="mt-2 text-xs text-zinc-500 capitalize">
                  {data.month}/{data.year.toString().substr(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Legenda e Estatísticas */}
        <div className="flex flex-col md:flex-row justify-between mt-4">
          <div className="flex space-x-6 text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-primary bg-opacity-15 mr-2"></div>
              <span>Total</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 mr-2"></div>
              <span>Novos</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 mr-2"></div>
              <span>Cancelados</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-zinc-400 mr-2"></div>
              <span>Expirados</span>
            </div>
          </div>
          
          <div className="flex items-center mt-2 md:mt-0">
            <span className="text-sm text-zinc-500 mr-2">Variação mês atual:</span>
            <span className={`text-sm font-medium ${percentChange >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {percentChange >= 0 ? '+' : ''}{percentChange}%
              {percentChange >= 0 ? (
                <svg className="inline-block h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              ) : (
                <svg className="inline-block h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
                </svg>
              )}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};

// Componente para o gráfico de receita
const RevenueChart = ({ subscriptions }: { subscriptions: Subscription[] }) => {
  // Obter os últimos 6 meses
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now);
    d.setMonth(d.getMonth() - i);
    return {
      date: d,
      month: format(d, 'MMM', { locale: ptBR }),
      year: d.getFullYear()
    };
  }).reverse();

  // Calcular receita mensal
  const revenueByMonth = months.map(monthData => {
    const monthPayments = subscriptions.filter(s => {
      // Verificar se o pagamento foi feito nesse mês
      if (!s.metadata?.lastPaymentDate) return false;
      
      const paymentDate = convertToDate(s.metadata.lastPaymentDate);
      return paymentDate.getMonth() === monthData.date.getMonth() && 
             paymentDate.getFullYear() === monthData.date.getFullYear();
    });
    
    const revenue = monthPayments.reduce((sum, s) => sum + (s.planPrice || 0), 0);
    
    return {
      ...monthData,
      revenue,
      count: monthPayments.length
    };
  });

  // Calcular receita total
  const totalRevenue = revenueByMonth.reduce((sum, month) => sum + month.revenue, 0);
  
  // Calcular a alteração percentual da receita do último mês para o atual
  const currentMonthRevenue = revenueByMonth[revenueByMonth.length - 1].revenue;
  const previousMonthRevenue = revenueByMonth[revenueByMonth.length - 2]?.revenue || 0;
  const revenuePercentChange = previousMonthRevenue === 0 
    ? currentMonthRevenue > 0 ? 100 : 0 
    : Math.round(((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100);

  const maxRevenue = Math.max(...revenueByMonth.map(m => m.revenue), 100);

  return (
    <Card className="shadow-sm">
      <div className="p-6 border-b border-zinc-100">
        <h3 className="text-lg font-medium flex items-center">
          <DollarSign className="mr-2 h-5 w-5 text-zinc-500" />
          Receita Mensal
        </h3>
        <p className="text-sm text-zinc-500 mt-1">
          Faturamento mensal dos últimos 6 meses
        </p>
      </div>
                
      <div className="p-6">
        <div className="relative h-64">
          {/* Linhas de grade horizontais */}
          {Array.from({ length: 5 }, (_, i) => (
            <div 
              key={i} 
              className="absolute left-0 right-0 border-t border-zinc-100" 
              style={{ top: `${20 * (i + 1)}%` }}
            >
              <span className="absolute -top-2.5 -left-1 text-xs text-zinc-400">
                R$ {Math.round(maxRevenue - (maxRevenue / 5) * (i + 1))}
              </span>
            </div>
          ))}
          
          {/* Gráfico de barras */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between items-end h-[90%]">
            {revenueByMonth.map((data, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="relative w-12 flex flex-col items-center">
                  {/* Barra para revenue */}
                  <div 
                    className="w-8 bg-emerald-500 rounded-t-sm"
                    style={{ 
                      height: `${Math.max((data.revenue / maxRevenue) * 100, 2)}%` 
                    }}
                  ></div>
                  
                  {/* Rótulo acima da barra */}
                  {data.revenue > 0 && (
                    <div className="absolute -top-6 text-xs font-medium">R$ {data.revenue.toFixed(0)}</div>
                  )}
                </div>
                      
                {/* Rótulo do mês */}
                <div className="mt-2 text-xs text-zinc-500 capitalize">
                  {data.month}/{data.year.toString().substr(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Informações de tendência */}
        <div className="flex items-center justify-center mt-4">
          <span className="text-sm text-zinc-500 mr-2">Comparação com mês anterior:</span>
          <span className={`text-sm font-medium ${revenuePercentChange >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {revenuePercentChange >= 0 ? '+' : ''}{revenuePercentChange}%
            {revenuePercentChange >= 0 ? (
              <svg className="inline-block h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            ) : (
              <svg className="inline-block h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
              </svg>
            )}
          </span>
        </div>
      </div>
    </Card>
  );
};

// Componente VoucherCard para exibição em modo kanban
const VoucherCard = ({ voucher, onClick }: { voucher: Voucher, onClick: () => void }) => {
  return (
    <div 
      className="bg-white p-3 rounded-lg border border-zinc-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="font-mono text-xs bg-zinc-100 px-2 py-1 rounded">
          {voucher.code}
        </div>
        <Badge className={`
          ${voucher.status === 'pending' ? 'bg-amber-100 text-amber-700 border-amber-200' : ''}
          ${voucher.status === 'verified' ? 'bg-blue-100 text-blue-700 border-blue-200' : ''}
          ${voucher.status === 'used' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : ''}
          ${voucher.status === 'expired' ? 'bg-zinc-100 text-zinc-700 border-zinc-200' : ''}
        `}>
          {getStatusText(voucher.status)}
        </Badge>
      </div>
      
      <div className="flex items-center mt-2">
        <Avatar className="h-6 w-6 mr-2">
          {voucher.member.photoURL ? (
            <AvatarImage src={voucher.member.photoURL} />
          ) : (
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {voucher.member.name.charAt(0)}
            </AvatarFallback>
          )}
        </Avatar>
        <div className="text-sm font-medium truncate flex-1">
          {voucher.member.name}
        </div>
      </div>
      
      <div className="mt-2 text-xs text-zinc-500 space-y-2">
        <div className="flex justify-between">
          <span>Desconto:</span>
          <span className="font-medium">{voucher.discount}</span>
        </div>
        <div className="flex justify-between">
          <span>Data de criação:</span>
          <span>{format(convertToDate(voucher.createdAt), "dd/MM", { locale: ptBR })}</span>
        </div>
        <div className="flex justify-between bg-zinc-100 py-2 px-2 rounded-md">
          <span className="font-medium">{voucher.establishment.name}</span>
        </div>
      </div>
    </div>
  );
};

// Função para extrair email do rawData
const extractEmailFromRawData = (rawData: string): string => {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const match = rawData.match(emailRegex);
  return match ? match[0] : '';
};

// Atualizar o componente SubscribersReport para usar a API de assinaturas
const SubscribersReport = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [abandonedCarts, setAbandonedCarts] = useState<AbandonedCart[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAbandoned, setLoadingAbandoned] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [abandonedCartPage, setAbandonedCartPage] = useState(1);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<Subscription[]>([]);
  const [filteredAbandonedCarts, setFilteredAbandonedCarts] = useState<AbandonedCart[]>([]);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string[]>([]);
  const [selectedCarts, setSelectedCarts] = useState<string[]>([]);
  const [selectedSubscriptions, setSelectedSubscriptions] = useState<string[]>([]);
  const [processingBulkAction, setProcessingBulkAction] = useState(false);
  const [processingBulkSubscriptionAction, setProcessingBulkSubscriptionAction] = useState(false);
  const [deactivatingSubscription, setDeactivatingSubscription] = useState<string | null>(null);
  const { user } = useAuth();
  
  // Função para obter token de sessão para as requisições
  const getSessionToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('session_token') || '';
    }
    return '';
  };
  
  // Carregar dados das assinaturas
  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        setLoading(true);
        console.log("Buscando dados de assinaturas...");
        
        const sessionToken = getSessionToken();
        
        // Usar a nova API específica para relatórios que retorna todas as assinaturas
        const url = '/api/reports/subscriptions';
        console.log("URL de busca de assinaturas para relatórios:", url);
        
        // Obter dados do endpoint de assinaturas para relatórios
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-session-token': sessionToken
          }
        });
        
        if (!response.ok) {
          throw new Error(`Falha ao buscar assinaturas: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log("Dados brutos de assinaturas recebidos:", data.length || 0, "registros");
        
        // Transformar dados da API para o formato necessário para o componente
        const formattedSubscriptions: Subscription[] = (data || [])
          .filter((subscription: any) => subscription.effectiveStatus === 'active' || 
                               subscription.status === 'active' || 
                               subscription.status === 'ativa' || 
                               subscription.status === 'canceled' || 
                               subscription.status === 'expired')
          .map((subscription: any) => ({
            id: subscription.id || '',
            status: subscription.effectiveStatus ? 
                    mapSubscriptionStatus(subscription.effectiveStatus) : 
                    mapSubscriptionStatus(subscription.status),
            startDate: subscription.startDate || subscription.createdAt || new Date().toISOString(),
            endDate: subscription.endDate || subscription.expiresAt || new Date().toISOString(),
            member: {
              id: subscription.userId || subscription.memberId || '',
              name: subscription.userName || 
                    (subscription.user?.displayName) || 
                    (subscription.member?.name) || 
                    'Usuário',
              phone: subscription.userPhone || 
                     (subscription.user?.phoneNumber) || 
                     (subscription.member?.phone) || 
                     '',
              email: subscription.userEmail || 
                     (subscription.user?.email) || 
                     (subscription.member?.email) || 
                     ''
            },
            planId: subscription.planId || '',
            planName: subscription.planName || subscription.plan?.name || 'Plano Padrão',
            planPrice: parseFloat(subscription.price || subscription.planPrice || 0),
            metadata: {
              paymentMethod: subscription.paymentMethod || subscription.method || '',
              lastPaymentDate: subscription.paymentDate || subscription.lastPayment || subscription.createdAt || new Date().toISOString(),
              nextPaymentDate: subscription.nextPaymentDate || subscription.nextPayment || null,
              isEngaged: subscription.isEngaged || false,
              voucherCount: subscription.voucherCount || 0,
              hasTransactions: subscription.hasTransactions || false,
              rawData: subscription.rawData || ''
            }
          }));
        
        console.log("Assinaturas formatadas:", formattedSubscriptions.length);
        setSubscriptions(formattedSubscriptions);
        setFilteredSubscriptions(formattedSubscriptions);
      } catch (error) {
        console.error('Erro ao buscar assinaturas:', error);
        toast.error('Não foi possível carregar as assinaturas');
        // Definir array vazio em caso de erro
        setSubscriptions([]);
        setFilteredSubscriptions([]);
      } finally {
        setLoading(false);
      }
    };
    
    // Função para buscar carrinhos abandonados
    const fetchAbandonedCarts = async () => {
      try {
        setLoadingAbandoned(true);
        console.log("Buscando dados de carrinhos abandonados...");
        
        const sessionToken = getSessionToken();
        
        // Usar a nova rota de API específica para carrinhos abandonados
        const url = '/api/reports/abandoned-carts';
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-session-token': sessionToken
          }
        });
        
        if (!response.ok) {
          throw new Error(`Falha ao buscar carrinhos abandonados: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log("Carrinhos abandonados recebidos:", data.length || 0, "registros");
        
        // Mapear os dados recebidos para o formato esperado pelo componente
        const abandonedCartsData = data.map((cart: any) => ({
          id: cart.id || '',
          userId: cart.userId || '',
          userName: cart.user?.displayName || cart.userName || 'Usuário',
          userEmail: cart.user?.email || cart.userEmail || cart.extractedData?.email || '',
          userPhone: cart.user?.phoneNumber || cart.userPhone || '',
          createdAt: cart.createdAt || new Date().toISOString(),
          rawData: cart.rawData || '',
          transactionId: cart.id || '',
          status: cart.status || 'pending'
        }));
        
        setAbandonedCarts(abandonedCartsData);
        setFilteredAbandonedCarts(abandonedCartsData);
      } catch (error) {
        console.error('Erro ao buscar carrinhos abandonados:', error);
        toast.error('Não foi possível carregar os dados de carrinhos abandonados');
        setAbandonedCarts([]);
        setFilteredAbandonedCarts([]);
      } finally {
        setLoadingAbandoned(false);
      }
    };
    
    fetchSubscriptions();
    fetchAbandonedCarts();
  }, [user]);
  
  // Função para desativar uma assinatura (carrinho abandonado)
  const handleDeactivateCart = async (cartId: string) => {
    try {
      console.log(`Desativando carrinho abandonado ID: ${cartId}`);
      const sessionToken = getSessionToken();
      
      // Usar a nova rota PATCH específica para carrinhos abandonados
      const response = await fetch('/api/reports/abandoned-carts', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-session-token': sessionToken
        },
        body: JSON.stringify({
          id: cartId,
          status: 'inactive'
        })
      });
      
      if (!response.ok) {
        throw new Error(`Falha ao desativar carrinho: ${response.status}`);
      }
      
      // Atualizar o estado local após a desativação bem-sucedida
      toast.success('Carrinho abandonado desativado com sucesso!');
      
      // Atualizar lista de carrinhos abandonados
      setAbandonedCarts(prev => 
        prev.map(cart => 
          cart.id === cartId 
            ? { ...cart, status: 'inactive' } 
            : cart
        )
      );
      
      setFilteredAbandonedCarts(prev => 
        prev.map(cart => 
          cart.id === cartId 
            ? { ...cart, status: 'inactive' } 
            : cart
        )
      );
      
    } catch (error) {
      console.error('Erro ao desativar carrinho abandonado:', error);
      toast.error('Não foi possível desativar o carrinho abandonado');
    }
  };
  
  // Função auxiliar para mapear status da assinatura
  const mapSubscriptionStatus = (status: string): "active" | "canceled" | "expired" | "pending" | "trial" => {
    if (!status) return "active";
    
    const statusMap: Record<string, "active" | "canceled" | "expired" | "pending" | "trial"> = {
      'active': 'active',
      'ativa': 'active',
      'canceled': 'canceled',
      'cancelled': 'canceled',
      'cancelada': 'canceled',
      'expired': 'expired',
      'expirada': 'expired',
      'pending': 'pending',
      'pendente': 'pending',
      'trial': 'trial',
      'teste': 'trial'
    };
    
    return statusMap[status.toLowerCase()] || 'active';
  };
  
  // Função para realizar busca
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    
    if (!term.trim()) {
      applyStatusFilter(selectedStatusFilter);
      return;
    }
    
    const lowercaseTerm = term.toLowerCase();
    
    const filtered = subscriptions.filter(subscription => 
      (subscription.member.name && subscription.member.name.toLowerCase().includes(lowercaseTerm)) ||
      (subscription.member.email && subscription.member.email.toLowerCase().includes(lowercaseTerm)) ||
      (subscription.member.phone && subscription.member.phone.toLowerCase().includes(lowercaseTerm)) ||
      (subscription.planName && subscription.planName.toLowerCase().includes(lowercaseTerm))
    );
    
    setFilteredSubscriptions(filtered);
    setCurrentPage(1);
  };
  
  // Aplicar filtro por status
  const applyStatusFilter = (statuses: string[]) => {
    setSelectedStatusFilter(statuses);
    
    if (statuses.length === 0) {
      // Se não houver filtro de status, aplicar apenas o filtro de busca
      if (searchTerm) {
        handleSearch(searchTerm);
      } else {
        setFilteredSubscriptions(subscriptions);
      }
      return;
    }
    
    let filtered = subscriptions;
    
    // Aplicar o filtro de busca primeiro
    if (searchTerm) {
      const lowercaseTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(subscription => 
        (subscription.member.name && subscription.member.name.toLowerCase().includes(lowercaseTerm)) ||
        (subscription.member.email && subscription.member.email.toLowerCase().includes(lowercaseTerm)) ||
        (subscription.member.phone && subscription.member.phone.toLowerCase().includes(lowercaseTerm)) ||
        (subscription.planName && subscription.planName.toLowerCase().includes(lowercaseTerm))
      );
    }
    
    // Aplicar o filtro de status
    filtered = filtered.filter(subscription => statuses.includes(subscription.status));
    
    setFilteredSubscriptions(filtered);
    setCurrentPage(1);
  };
  
  // Toggle de status no filtro
  const toggleStatusFilter = (status: string) => {
    const newStatusFilter = selectedStatusFilter.includes(status)
      ? selectedStatusFilter.filter(s => s !== status)
      : [...selectedStatusFilter, status];
    
    applyStatusFilter(newStatusFilter);
  };
  
  // Filtrar carrinhos abandonados por termo de pesquisa
  const handleSearchAbandonedCarts = (term: string) => {
    if (!term.trim()) {
      setFilteredAbandonedCarts(abandonedCarts);
      return;
    }
    
    const lowercaseTerm = term.toLowerCase();
    
    const filtered = abandonedCarts.filter(cart => 
      cart.userName.toLowerCase().includes(lowercaseTerm) ||
      (cart.userEmail && cart.userEmail.toLowerCase().includes(lowercaseTerm)) ||
      (cart.userPhone && cart.userPhone.toLowerCase().includes(lowercaseTerm)) ||
      (cart.rawData && cart.rawData.toLowerCase().includes(lowercaseTerm))
    );
    
    setFilteredAbandonedCarts(filtered);
    setAbandonedCartPage(1);
  };
  
  // Função para desativar múltiplos carrinhos abandonados de uma vez
  const handleBulkDeactivateCarts = async () => {
    if (selectedCarts.length === 0) return;
    
    try {
      setProcessingBulkAction(true);
      console.log(`Desativando ${selectedCarts.length} carrinhos abandonados`);
      const sessionToken = getSessionToken();
      
      // Desativar cada carrinho sequencialmente
      let successCount = 0;
      let failCount = 0;
      
      for (const cartId of selectedCarts) {
        try {
          const response = await fetch('/api/reports/abandoned-carts', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'x-session-token': sessionToken
            },
            body: JSON.stringify({
              id: cartId,
              status: 'inactive'
            })
          });
          
          if (response.ok) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          console.error(`Erro ao desativar carrinho ${cartId}:`, error);
          failCount++;
        }
      }
      
      // Atualizar o estado local após a desativação em lote
      if (successCount > 0) {
        // Atualizar status de carrinhos desativados com sucesso
        setAbandonedCarts(prev => 
          prev.map(cart => 
            selectedCarts.includes(cart.id) 
              ? { ...cart, status: 'inactive' } 
              : cart
          )
        );
        
        setFilteredAbandonedCarts(prev => 
          prev.map(cart => 
            selectedCarts.includes(cart.id) 
              ? { ...cart, status: 'inactive' } 
              : cart
          )
        );
        
        // Mostrar mensagem de sucesso
        if (successCount === selectedCarts.length) {
          toast.success(`${successCount} carrinhos abandonados desativados com sucesso!`);
        } else {
          toast.success(`${successCount} de ${selectedCarts.length} carrinhos abandonados desativados com sucesso.`);
        }
      }
      
      if (failCount > 0) {
        toast.error(`Falha ao desativar ${failCount} carrinhos abandonados.`);
      }
      
      // Limpar seleção após a operação
      setSelectedCarts([]);
      
    } catch (error) {
      console.error('Erro ao desativar carrinhos abandonados em lote:', error);
      toast.error('Ocorreu um erro ao desativar os carrinhos abandonados.');
    } finally {
      setProcessingBulkAction(false);
    }
  };
  
  // Função para selecionar/desselecionar todos os carrinhos
  const toggleSelectAllCarts = (checked: boolean | 'indeterminate') => {
    // Pegar todos os carrinhos filtrados que não estão desativados
    const allSelectableItems = filteredAbandonedCarts
      .filter(cart => cart.status !== 'inactive');
    
    const allSelectableItemIds = allSelectableItems.map(cart => cart.id);
    
    if (checked === true) {
      // Selecionar todos os carrinhos filtrados
      setSelectedCarts(allSelectableItemIds);
    } else {
      // Desselecionar todos
      setSelectedCarts([]);
    }
  };
  
  // Função para alternar a seleção de um único carrinho
  const toggleCartSelection = (checked: boolean | 'indeterminate', cartId: string) => {
    if (checked === true) {
      // Adicionar à seleção se não estiver já incluído
      setSelectedCarts(prev => 
        prev.includes(cartId) ? prev : [...prev, cartId]
      );
    } else {
      // Remover da seleção
      setSelectedCarts(prev => prev.filter(id => id !== cartId));
    }
  };
  
  // Verificar se todos os carrinhos filtrados estão selecionados
  const isAllFilteredItemsSelected = () => {
    const allSelectableItems = filteredAbandonedCarts
      .filter(cart => cart.status !== 'inactive');
    
    return allSelectableItems.length > 0 && 
           allSelectableItems.every(cart => selectedCarts.includes(cart.id));
  };
  
  // Verificar se há pelo menos um item selecionado
  const hasSelectedItems = selectedCarts.length > 0;
  
  // Função para desativar uma assinatura
  const handleDeactivateSubscription = async (subscriptionId: string) => {
    try {
      setDeactivatingSubscription(subscriptionId);
      console.log(`Desativando assinatura ID: ${subscriptionId}`);
      const sessionToken = getSessionToken();
      
      // Usar a rota PATCH existente em /api/reports/subscriptions
      const response = await fetch('/api/reports/subscriptions', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-session-token': sessionToken
        },
        body: JSON.stringify({
          id: subscriptionId,
          status: 'inactive'
        })
      });
      
      if (!response.ok) {
        throw new Error(`Falha ao desativar assinatura: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("Resposta da API de desativação:", result);
      
      // Atualizar o estado local após a desativação bem-sucedida
      toast.success('Assinatura desativada com sucesso!');
      
      // Atualizar a lista de assinaturas localmente
      setSubscriptions(prev => 
        prev.map(subscription => 
          subscription.id === subscriptionId 
            ? { ...subscription, status: 'inactive' } 
            : subscription
        )
      );
      
      setFilteredSubscriptions(prev => 
        prev.map(subscription => 
          subscription.id === subscriptionId 
            ? { ...subscription, status: 'inactive' } 
            : subscription
        )
      );
      
    } catch (error) {
      console.error('Erro ao desativar assinatura:', error);
      toast.error('Não foi possível desativar a assinatura');
    } finally {
      setDeactivatingSubscription(null);
    }
  };
  
  // Função para desativar múltiplas assinaturas de uma vez
  const handleBulkDeactivateSubscriptions = async () => {
    if (selectedSubscriptions.length === 0) return;
    
    try {
      setProcessingBulkSubscriptionAction(true);
      console.log(`Desativando ${selectedSubscriptions.length} assinaturas em lote`);
      const sessionToken = getSessionToken();
      
      // Usar a nova API de operações em lote para assinaturas
      const response = await fetch('/api/reports/subscriptions/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-token': sessionToken
        },
        body: JSON.stringify({
          ids: selectedSubscriptions,
          status: 'inactive'
        })
      });
      
      if (!response.ok) {
        throw new Error(`Falha na operação em lote: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("Resultado da operação em lote:", result);
      
      // Verificar o resultado da operação
      if (result.success) {
        // Atualizar assinaturas no estado local
        if (result.successful && result.successful.length > 0) {
          setSubscriptions(prev => 
            prev.map(subscription => 
              result.successful.includes(subscription.id)
                ? { ...subscription, status: 'inactive' } 
                : subscription
            )
          );
          
          setFilteredSubscriptions(prev => 
            prev.map(subscription => 
              result.successful.includes(subscription.id)
                ? { ...subscription, status: 'inactive' } 
                : subscription
            )
          );
          
          // Mostrar mensagem de sucesso
          toast.success(`${result.successCount} assinaturas desativadas com sucesso`);
        }
        
        // Mostrar mensagem se houver falhas
        if (result.failCount > 0) {
          toast.error(`Falha ao desativar ${result.failCount} assinaturas`);
        }
      } else {
        toast.error('Falha ao processar desativação em lote');
      }
      
      // Limpar seleção após a operação
      setSelectedSubscriptions([]);
      
    } catch (error) {
      console.error('Erro ao desativar assinaturas em lote:', error);
      toast.error('Ocorreu um erro ao desativar as assinaturas');
    } finally {
      setProcessingBulkSubscriptionAction(false);
    }
  };
  
  // Função para selecionar/desselecionar todas as assinaturas
  const toggleSelectAllSubscriptions = (checked: boolean | 'indeterminate') => {
    // Pegar todas as assinaturas filtradas ativas (que podem ser desativadas)
    const activeSubscriptions = filteredSubscriptions
      .filter(sub => sub.status === 'active');
    
    const activeSubscriptionIds = activeSubscriptions.map(sub => sub.id);
    
    if (checked === true) {
      // Selecionar todas as assinaturas ativas
      setSelectedSubscriptions(activeSubscriptionIds);
    } else {
      // Desselecionar todas
      setSelectedSubscriptions([]);
    }
  };
  
  // Função para alternar a seleção de uma única assinatura
  const toggleSubscriptionSelection = (checked: boolean | 'indeterminate', subscriptionId: string) => {
    if (checked === true) {
      // Adicionar à seleção se não estiver já incluído
      setSelectedSubscriptions(prev => 
        prev.includes(subscriptionId) ? prev : [...prev, subscriptionId]
      );
    } else {
      // Remover da seleção
      setSelectedSubscriptions(prev => prev.filter(id => id !== subscriptionId));
    }
  };
  
  // Verificar se todas as assinaturas ativas estão selecionadas
  const isAllActiveSubscriptionsSelected = () => {
    const activeSubscriptions = filteredSubscriptions
      .filter(sub => sub.status === 'active');
    
    return activeSubscriptions.length > 0 && 
           activeSubscriptions.every(sub => selectedSubscriptions.includes(sub.id));
  };
  
  // Verificar se há pelo menos uma assinatura selecionada
  const hasSelectedSubscriptions = selectedSubscriptions.length > 0;
  
  // Renderizar o componente de relatório de assinantes
  return (
    <div className="space-y-6">
      {/* KPIs */}
      <SubscribersKPIOverview subscriptions={subscriptions} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <SubscriptionStatusChart subscriptions={subscriptions} />
        <RevenueChart subscriptions={subscriptions} />
      </div>
      
      <SubscriptionTrendsChart subscriptions={subscriptions} />
      
      {/* Pesquisa e filtros para a tabela */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex-1 w-full md:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input 
              className="pl-10 bg-white"
              placeholder="Buscar por nome, email ou telefone..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2 w-full md:w-auto justify-between md:justify-end gap-2">
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={selectedStatusFilter.includes("active") ? "default" : "outline"}
              size="sm"
              onClick={() => toggleStatusFilter("active")}
              className="text-xs px-2 py-1 h-auto"
            >
              Ativos
            </Button>
            <Button 
              variant={selectedStatusFilter.includes("canceled") ? "default" : "outline"}
              size="sm"
              onClick={() => toggleStatusFilter("canceled")}
              className="text-xs px-2 py-1 h-auto"
            >
              Cancelados
            </Button>
            <Button 
              variant={selectedStatusFilter.includes("expired") ? "default" : "outline"}
              size="sm"
              onClick={() => toggleStatusFilter("expired")}
              className="text-xs px-2 py-1 h-auto"
            >
              Expirados
            </Button>
          </div>
          
          {selectedStatusFilter.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => applyStatusFilter([])}
              className="ml-2"
            >
              <X className="h-4 w-4 mr-1" /> Limpar
            </Button>
          )}
        </div>
      </div>
      
      {/* Tabela de assinantes */}
      <Card className="shadow-sm">
        <div className="p-6 border-b border-zinc-100">
          <h3 className="text-lg font-medium flex items-center">
            <DollarSign className="mr-2 h-5 w-5 text-zinc-500" />
            Listagem de Assinantes
          </h3>
          <p className="text-sm text-zinc-500 mt-1">
            Detalhes dos assinantes e status das assinaturas
          </p>
        </div>
        
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : filteredSubscriptions.length === 0 ? (
            <div className="bg-white rounded-lg p-8 text-center">
              <div className="mx-auto w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
                <DollarSign className="h-8 w-8 text-zinc-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">Nenhum assinante encontrado</h3>
              <p className="text-zinc-500 mb-4">
                Não encontramos assinantes com os filtros aplicados.
              </p>
              {(selectedStatusFilter.length > 0 || searchTerm) && (
                <Button variant="outline" onClick={() => {
                  setSearchTerm('');
                  applyStatusFilter([]);
                }}>
                  Limpar Filtros
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="mb-4 flex justify-between items-center">
                {hasSelectedSubscriptions && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-zinc-500">
                      {selectedSubscriptions.length} {selectedSubscriptions.length === 1 ? 'assinatura selecionada' : 'assinaturas selecionadas'}
                    </span>
                    <Button 
                      variant="destructive"
                      size="sm"
                      onClick={handleBulkDeactivateSubscriptions}
                      disabled={processingBulkSubscriptionAction}
                      className="whitespace-nowrap"
                    >
                      {processingBulkSubscriptionAction ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                          Processando...
                        </>
                      ) : (
                        'Desativar Selecionadas'
                      )}
                    </Button>
                  </div>
                )}
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">
                      <div className="flex items-center">
                        <Checkbox
                          checked={isAllActiveSubscriptionsSelected()}
                          onCheckedChange={toggleSelectAllSubscriptions}
                          className="rounded border-zinc-300 text-primary focus:ring-primary"
                        />
                      </div>
                    </TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email / Telefone</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Data da Compra</TableHead>
                    <TableHead>Expiração</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Vouchers</TableHead>
                    {/* <TableHead className="text-right">Ações</TableHead> */}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Aplicar paginação */}
                  {filteredSubscriptions
                    .slice((currentPage - 1) * 10, currentPage * 10)
                    .map((subscription) => {
                      const startDate = convertToDate(subscription.startDate);
                      const endDate = convertToDate(subscription.endDate);
                      const isActive = subscription.status === 'active';
                      const isInactive = subscription.status === 'inactive';
                      
                      return (
                        <TableRow key={subscription.id}>
                          <TableCell>
                            {isActive && !isInactive && (
                              <Checkbox
                                checked={selectedSubscriptions.includes(subscription.id)}
                                onCheckedChange={(checked) => toggleSubscriptionSelection(checked, subscription.id)}
                                className="rounded border-zinc-300 text-primary focus:ring-primary"
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-8 w-8">
                                {subscription.member.photoURL ? (
                                  <AvatarImage src={subscription.member.photoURL} alt={subscription.member.name} />
                                ) : (
                                  <AvatarFallback className="bg-primary/10 text-primary">
                                    {subscription.member.name.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              <span className="font-medium">{subscription.member.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {subscription.member.email && (
                                <div className="flex items-center">
                                  <svg className="h-3 w-3 mr-1 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                  {subscription.member.email}
                                </div>
                              )}
                              <div className="flex items-center mt-1">
                                <svg className="h-3 w-3 mr-1 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                {subscription.member.phone}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{subscription.planName}</span>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">R$ {subscription.planPrice?.toFixed(2)}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm whitespace-nowrap">
                              {format(startDate, "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm whitespace-nowrap">
                              {format(endDate, "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge className={`
                              ${subscription.status === 'active' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : ''}
                              ${subscription.status === 'canceled' ? 'bg-red-100 text-red-700 border-red-200' : ''}
                              ${subscription.status === 'expired' ? 'bg-zinc-100 text-zinc-700 border-zinc-200' : ''}
                              ${subscription.status === 'pending' ? 'bg-amber-100 text-amber-700 border-amber-200' : ''}
                              ${subscription.status === 'trial' ? 'bg-blue-100 text-blue-700 border-blue-200' : ''}
                              ${subscription.status === 'inactive' ? 'bg-zinc-100 text-zinc-700 border-zinc-200' : ''}
                            `}>
                              {subscription.status === 'active' && 'Ativo'}
                              {subscription.status === 'canceled' && 'Cancelado'}
                              {subscription.status === 'expired' && 'Expirado'}
                              {subscription.status === 'pending' && 'Pendente'}
                              {subscription.status === 'trial' && 'Trial'}
                              {subscription.status === 'inactive' && 'Inativo'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {subscription.metadata?.voucherCount || 0}
                            </Badge>
                          </TableCell>
                          {/* <TableCell className="text-right">
                            {isActive && !isInactive && (
                              <Button 
                                variant="destructive"
                                size="sm"
                                className="text-xs px-2 py-0 h-6"
                                onClick={() => handleDeactivateSubscription(subscription.id)}
                                disabled={deactivatingSubscription === subscription.id}
                              >
                                {deactivatingSubscription === subscription.id ? (
                                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                ) : (
                                  'Desativar'
                                )}
                              </Button>
                            )}
                          </TableCell> */}
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
              
              {/* Adicionar controles de paginação */}
              {filteredSubscriptions.length > 10 && (
                <div className="flex justify-between items-center p-4 border-t">
                  <div className="text-sm text-zinc-500">
                    Mostrando {Math.min((currentPage - 1) * 10 + 1, filteredSubscriptions.length)}-
                    {Math.min(currentPage * 10, filteredSubscriptions.length)} de {filteredSubscriptions.length}
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage(currentPage > 1 ? currentPage - 1 : 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    {Array.from(
                      { length: Math.min(5, Math.ceil(filteredSubscriptions.length / 10)) },
                      (_, i) => {
                        // Calcular quais páginas mostrar, mostrando no máximo 5 páginas
                        const totalPages = Math.ceil(filteredSubscriptions.length / 10);
                        let pageNumber;
                        
                        if (totalPages <= 5) {
                          pageNumber = i + 1;
                        } else {
                          // Mostrar páginas em torno da página atual
                          const startPage = Math.max(1, currentPage - 2);
                          const endPage = Math.min(totalPages, startPage + 4);
                          pageNumber = startPage + i;
                          
                          // Ajustar se estiver perto do fim
                          if (pageNumber > totalPages) {
                            return null;
                          }
                        }
                        
                        return (
                          <Button
                            key={pageNumber}
                            variant={currentPage === pageNumber ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNumber)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNumber}
                          </Button>
                        );
                      }
                    ).filter(Boolean)}
                    
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage(
                        currentPage < Math.ceil(filteredSubscriptions.length / 10) 
                          ? currentPage + 1 
                          : Math.ceil(filteredSubscriptions.length / 10)
                      )}
                      disabled={currentPage >= Math.ceil(filteredSubscriptions.length / 10)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Nova seção: Tabela de Carrinhos Abandonados */}
      <Card className="shadow-sm mt-8">
        <div className="p-6 border-b border-zinc-100">
          <h3 className="text-lg font-medium flex items-center">
            <svg className="mr-2 h-5 w-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Carrinhos Abandonados
          </h3>
          <p className="text-sm text-zinc-500 mt-1">
            Usuários que abandonaram o carrinho e não finalizaram a compra
          </p>
        </div>
        
        <div className="p-6">
          {loadingAbandoned ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : filteredAbandonedCarts.length === 0 ? (
            <div className="bg-white rounded-lg p-8 text-center">
              <div className="mx-auto w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2">Nenhum carrinho abandonado encontrado</h3>
              <p className="text-zinc-500 mb-4">
                Não há registros de carrinhos abandonados no momento.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="mb-4 flex justify-between items-center">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input 
                    className="pl-10 bg-white"
                    placeholder="Buscar carrinho abandonado..."
                    onChange={(e) => handleSearchAbandonedCarts(e.target.value)}
                  />
                </div>
                
                {hasSelectedItems && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-zinc-500">
                      {selectedCarts.length} {selectedCarts.length === 1 ? 'item selecionado' : 'itens selecionados'}
                    </span>
                    <Button 
                      variant="destructive"
                      size="sm"
                      onClick={handleBulkDeactivateCarts}
                      disabled={processingBulkAction}
                      className="whitespace-nowrap"
                    >
                      {processingBulkAction ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                          Processando...
                        </>
                      ) : (
                        'Desativar Selecionados'
                      )}
                    </Button>
                  </div>
                )}
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">
                      <div className="flex items-center">
                        <Checkbox
                          checked={isAllFilteredItemsSelected()}
                          onCheckedChange={toggleSelectAllCarts}
                          className="rounded border-zinc-300 text-primary focus:ring-primary"
                        />
                      </div>
                    </TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Email / Telefone</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Dados</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Aplicar paginação */}
                  {filteredAbandonedCarts
                    .slice((abandonedCartPage - 1) * 10, abandonedCartPage * 10)
                    .map((cart) => {
                      const createdDate = convertToDate(cart.createdAt);
                      // Extrair email do rawData se não estiver disponível
                      const email = cart.userEmail || extractEmailFromRawData(cart.rawData);
                      const isDisabled = cart.status === 'inactive';
                      
                      return (
                        <TableRow key={cart.id} className={isDisabled ? 'opacity-60' : ''}>
                          <TableCell>
                            {!isDisabled && (
                              <Checkbox
                                checked={selectedCarts.includes(cart.id)}
                                onCheckedChange={(checked) => toggleCartSelection(checked, cart.id)}
                                className="rounded border-zinc-300 text-primary focus:ring-primary"
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-red-100 text-red-500">
                                  {cart.userName.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{cart.userName}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {email && (
                                <div className="flex items-center">
                                  <svg className="h-3 w-3 mr-1 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                  {email}
                                </div>
                              )}
                              {cart.userPhone && (
                                <div className="flex items-center mt-1">
                                  <svg className="h-3 w-3 mr-1 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                  </svg>
                                  {cart.userPhone}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm whitespace-nowrap">
                              {format(createdDate, "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge className={`
                              ${cart.status === 'inactive' 
                                ? 'bg-red-100 text-red-700 border-red-200' 
                                : 'bg-amber-100 text-amber-700 border-amber-200'}
                            `}>
                              {cart.status === 'inactive' ? 'Desativado' : 'Abandonado'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-xs px-2 py-0 h-6"
                              onClick={() => {
                                toast.info(cart.rawData.slice(0, 200) + (cart.rawData.length > 200 ? '...' : ''), {
                                  duration: 5000,
                                });
                              }}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Visualizar
                            </Button>
                          </TableCell>
                          <TableCell className="text-right">
                            {cart.status !== 'inactive' && (
                              <Button 
                                variant="destructive"
                                size="sm"
                                className="text-xs px-2 py-0 h-6"
                                onClick={() => handleDeactivateCart(cart.id)}
                              >
                                Desativar
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
              
              {/* Paginação para carrinhos abandonados */}
              {filteredAbandonedCarts.length > 10 && (
                <div className="flex justify-between items-center p-4 border-t">
                  <div className="text-sm text-zinc-500">
                    Mostrando {Math.min((abandonedCartPage - 1) * 10 + 1, filteredAbandonedCarts.length)}-
                    {Math.min(abandonedCartPage * 10, filteredAbandonedCarts.length)} de {filteredAbandonedCarts.length}
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setAbandonedCartPage(abandonedCartPage > 1 ? abandonedCartPage - 1 : 1)}
                      disabled={abandonedCartPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    {Array.from(
                      { length: Math.min(5, Math.ceil(filteredAbandonedCarts.length / 10)) },
                      (_, i) => {
                        // Calcular quais páginas mostrar, mostrando no máximo 5 páginas
                        const totalPages = Math.ceil(filteredAbandonedCarts.length / 10);
                        let pageNumber;
                        
                        if (totalPages <= 5) {
                          pageNumber = i + 1;
                        } else {
                          // Mostrar páginas em torno da página atual
                          const startPage = Math.max(1, abandonedCartPage - 2);
                          const endPage = Math.min(totalPages, startPage + 4);
                          pageNumber = startPage + i;
                          
                          // Ajustar se estiver perto do fim
                          if (pageNumber > totalPages) {
                            return null;
                          }
                        }
                        
                        return (
                          <Button
                            key={pageNumber}
                            variant={abandonedCartPage === pageNumber ? "default" : "outline"}
                            size="sm"
                            onClick={() => setAbandonedCartPage(pageNumber)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNumber}
                          </Button>
                        );
                      }
                    ).filter(Boolean)}
                    
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setAbandonedCartPage(
                        abandonedCartPage < Math.ceil(filteredAbandonedCarts.length / 10) 
                          ? abandonedCartPage + 1 
                          : Math.ceil(filteredAbandonedCarts.length / 10)
                      )}
                      disabled={abandonedCartPage >= Math.ceil(filteredAbandonedCarts.length / 10)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

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
  
  // Definir aqui a função interna que contém a interface principal
  const MemberReportsPage = () => {
  // Estado para as abas
    const [activeTab, setActiveTab] = useState<'charts' | 'data' | 'products' | 'subscribers'>('charts');
  
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [viewMode, setViewMode] = useState<"list" | "kanban">("kanban")
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [filteredVouchers, setFilteredVouchers] = useState<Voucher[]>([])
  const [searchTerm, setSearchTerm] = useState('');
  
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

    const itemsPerPage = 10;
  
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

  // Função para carregar dados iniciais
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

  // Função para buscar vouchers
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

  // Função para aplicar os filtros
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
        const voucherDate = convertToDate(v.createdAt);
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

  // Função para verificar se há filtros ativos
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

  // Função para limpar filtros
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

  // Função para realizar a pesquisa global
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

    // Função para alterar a página
    const handlePageChange = (page: number) => {
      setCurrentPage(page)
    }

    // Função para ordenar vouchers
    const orderVouchers = (vouchers: Voucher[]) => {
      const statusOrder = { pending: 0, verified: 1, used: 2, expired: 3 };
      
      return [...vouchers].sort((a, b) => {
        if (orderBy === 'date') {
          const dateA = convertToDate(a.createdAt).getTime();
          const dateB = convertToDate(b.createdAt).getTime();
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

  // Renderização do componente
  return (
    <>
    <div className="container mx-auto max-w-7xl px-4 py-6 pb-24">
      <div className="flex flex-col md:flex-row items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Relatório de Cupons</h1>
      </div>

      {/* Toolbar com pesquisa e filtros - visível nas abas de vouchers */}
        {(activeTab !== 'products' && activeTab !== 'subscribers') && (
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
        </div>
      )}

      {/* Abas */}
      <Tabs 
        tabs={[
          { id: 'charts', label: 'Gráficos', icon: <BarChart className="h-4 w-4" /> }, 
            { id: 'data', label: 'Vouchers', icon: <LayoutGrid className="h-4 w-4" /> },
            { id: 'products', label: 'Produtos', icon: <Package className="h-4 w-4" /> },
            { id: 'subscribers', label: 'Assinantes', icon: <DollarSign className="h-4 w-4" /> }
        ]} 
        activeTab={activeTab} 
          setActiveTab={(id) => setActiveTab(id as 'charts' | 'data' | 'products' | 'subscribers')} 
      />

      {activeTab === 'products' ? (
        <ProductsReport />
        ) : activeTab === 'subscribers' ? (
          <SubscribersReport />
      ) : loading ? (
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
          {activeTab === 'charts' ? (
            <ChartsTab vouchers={filteredVouchers} />
          ) : (
            <>
                {/* Opções de visualização para a aba de dados/vouchers */}
              <div className="flex justify-end mb-4">
                <div className="flex items-center">
                  <span className="text-zinc-500 text-sm mr-2 hidden md:inline">Ordenar:</span>
                  <div className="border rounded-md flex divide-x text-sm mr-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`rounded-l-md rounded-r-md ${orderBy === "date" ? "bg-zinc-100 font-medium" : ""}`}
                      onClick={() => setOrder("date")}
                    >
                      Data {orderBy === "date" && (orderDirection === 'asc' ? '↑' : '↓')}
                    </Button>
                  </div>
                </div>
                
                <div className="border rounded-md flex divide-x">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`rounded-l-md ${viewMode === "kanban" ? "bg-zinc-100" : ""}`}
                    onClick={() => setViewMode("kanban")}
                  >
                    <Columns3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`rounded-r-md ${viewMode === "list" ? "bg-zinc-100" : ""}`}
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>

                {/* Conteúdo da aba de dados/vouchers */}
              {viewMode === "kanban" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Status Columns */}
                    <Card className="shadow-sm border-t-4 border-t-amber-500">
                      <div className="p-4 border-b border-zinc-100">
                        <h3 className="font-medium flex items-center justify-between">
                          <div className="flex items-center">
                            <span className="w-2 h-2 bg-amber-500 rounded-full mr-2"></span>
                            Pendentes
                          </div>
                          <span className="text-sm text-zinc-500">
                            {orderedVouchers.filter(v => v.status === "pending").length}
                          </span>
                        </h3>
                      </div>
                      <div className="p-2 space-y-2 max-h-[600px] overflow-y-auto">
                        {orderedVouchers
                          .filter(v => v.status === "pending")
                          .map(voucher => (
                            <VoucherCard 
                              key={voucher.id} 
                              voucher={voucher} 
                              onClick={() => {
                                setSelectedVoucher(voucher)
                                setIsDetailsOpen(true)
                              }} 
                            />
                          ))}
                      </div>
                    </Card>

                    <Card className="shadow-sm border-t-4 border-t-blue-500">
                      <div className="p-4 border-b border-zinc-100">
                        <h3 className="font-medium flex items-center justify-between">
                          <div className="flex items-center">
                            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                            Verificados
                          </div>
                          <span className="text-sm text-zinc-500">
                            {orderedVouchers.filter(v => v.status === "verified").length}
                          </span>
                        </h3>
                      </div>
                      <div className="p-2 space-y-2 max-h-[600px] overflow-y-auto">
                        {orderedVouchers
                          .filter(v => v.status === "verified")
                          .map(voucher => (
                            <VoucherCard 
                              key={voucher.id} 
                              voucher={voucher} 
                              onClick={() => {
                                setSelectedVoucher(voucher)
                                setIsDetailsOpen(true)
                              }} 
                            />
                          ))}
                      </div>
                    </Card>

                    <Card className="shadow-sm border-t-4 border-t-emerald-500">
                      <div className="p-4 border-b border-zinc-100">
                        <h3 className="font-medium flex items-center justify-between">
                          <div className="flex items-center">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
                            Utilizados
                          </div>
                          <span className="text-sm text-zinc-500">
                            {orderedVouchers.filter(v => v.status === "used").length}
                          </span>
                        </h3>
                      </div>
                      <div className="p-2 space-y-2 max-h-[600px] overflow-y-auto">
                        {orderedVouchers
                          .filter(v => v.status === "used")
                          .map(voucher => (
                            <VoucherCard 
                              key={voucher.id} 
                              voucher={voucher} 
                              onClick={() => {
                                setSelectedVoucher(voucher)
                                setIsDetailsOpen(true)
                              }} 
                            />
                          ))}
                      </div>
                    </Card>

                    <Card className="shadow-sm border-t-4 border-t-zinc-400">
                      <div className="p-4 border-b border-zinc-100">
                        <h3 className="font-medium flex items-center justify-between">
                          <div className="flex items-center">
                            <span className="w-2 h-2 bg-zinc-400 rounded-full mr-2"></span>
                            Expirados
                          </div>
                          <span className="text-sm text-zinc-500">
                            {orderedVouchers.filter(v => v.status === "expired").length}
                          </span>
                        </h3>
                      </div>
                      <div className="p-2 space-y-2 max-h-[600px] overflow-y-auto">
                        {orderedVouchers
                          .filter(v => v.status === "expired")
                          .map(voucher => (
                            <VoucherCard 
                              key={voucher.id} 
                              voucher={voucher} 
                              onClick={() => {
                                setSelectedVoucher(voucher)
                                setIsDetailsOpen(true)
                              }} 
                            />
                          ))}
                      </div>
                    </Card>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow-sm">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Cupom</TableHead>
                          <TableHead>Cliente</TableHead>
                            <TableHead>Estabelecimento</TableHead>
                            <TableHead 
                              className="w-[100px] cursor-pointer"
                              onClick={() => setOrder("date")}
                            >
                              <div className="flex items-center">
                                Data 
                                {orderBy === "date" && (
                                  <span className="ml-1">
                                    {orderDirection === 'asc' ? '↑' : '↓'}
                                  </span>
                                )}
                              </div>
                            </TableHead>
                            <TableHead 
                              className="w-[100px] cursor-pointer"
                              onClick={() => setOrder("status")}
                            >
                              <div className="flex items-center">
                                Status 
                                {orderBy === "status" && (
                                  <span className="ml-1">
                                    {orderDirection === 'asc' ? '↑' : '↓'}
                                  </span>
                                )}
                              </div>
                            </TableHead>
                            <TableHead className="w-[50px]">Valor</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentVouchers.map((voucher) => (
                            <TableRow key={voucher.id}>
                              <TableCell className="font-mono text-xs">
                                {voucher.code}
                              </TableCell>
                            <TableCell>
                                <div className="flex items-center">
                                  <Avatar className="h-8 w-8 mr-2">
                                    {voucher.member.photoURL ? (
                                  <AvatarImage src={voucher.member.photoURL} />
                                    ) : (
                                      <AvatarFallback className="bg-primary/10 text-primary">
                                        {voucher.member.name.charAt(0)}
                                      </AvatarFallback>
                                    )}
                                </Avatar>
                                  <div>
                                    <div className="font-medium">{voucher.member.name}</div>
                                    <div className="text-xs text-zinc-500">{voucher.member.phone}</div>
                                  </div>
                              </div>
                            </TableCell>
                            <TableCell>
                                <div className="font-medium">{voucher.establishment.name}</div>
                              </TableCell>
                              <TableCell>
                                {format(convertToDate(voucher.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                              </TableCell>
                              <TableCell>
                                <Badge className={`
                                  ${voucher.status === 'pending' ? 'bg-amber-100 text-amber-700 border-amber-200' : ''}
                                  ${voucher.status === 'verified' ? 'bg-blue-100 text-blue-700 border-blue-200' : ''}
                                  ${voucher.status === 'used' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : ''}
                                  ${voucher.status === 'expired' ? 'bg-zinc-100 text-zinc-700 border-zinc-200' : ''}
                                `}>
                                {getStatusText(voucher.status)}
                              </Badge>
                            </TableCell>
                              <TableCell>
                                {voucher.discount && `${voucher.discount}`}
                              </TableCell>
                              <TableCell>
                              <Button 
                                variant="ghost" 
                                  size="icon"
                                  onClick={() => {
                                    setSelectedVoucher(voucher)
                                    setIsDetailsOpen(true)
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
                      <div className="flex justify-between items-center p-4 border-t">
                        <div className="text-sm text-zinc-500">
                          Mostrando {startIndex + 1}-{Math.min(startIndex + itemsPerPage, orderedVouchers.length)} de {orderedVouchers.length}
                        </div>
                        <div className="flex space-x-1">
                      <Button
                        variant="outline"
                            size="icon"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                            <ChevronLeft className="h-4 w-4" />
                      </Button>
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                              <Button
                              key={page}
                                variant={currentPage === page ? "default" : "outline"}
                                size="sm"
                                onClick={() => handlePageChange(page)}
                                className="w-8 h-8 p-0"
                              >
                                {page}
                              </Button>
                          ))}
                      <Button
                        variant="outline"
                            size="icon"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                            <ChevronRight className="h-4 w-4" />
                      </Button>
                        </div>
                    </div>
                  )}
                </div>
              )}
            </>
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
          <Sheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
            <SheetContent className="bg-zinc-100 w-[400px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="text-zinc-500">Detalhes do Cupom</SheetTitle>
              </SheetHeader>
              
              <div className="space-y-6 mt-6">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-center py-2">
                    <h2 className="text-xl font-mono">{selectedVoucher.code}</h2>
                    <Badge className={`mt-1 ${
                      selectedVoucher.status === 'pending' ? 'bg-amber-100 text-amber-700 border-amber-200' : 
                      selectedVoucher.status === 'verified' ? 'bg-blue-100 text-blue-700 border-blue-200' : 
                      selectedVoucher.status === 'used' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 
                      'bg-zinc-100 text-zinc-700 border-zinc-200'
                    }`}>
                      {getStatusText(selectedVoucher.status)}
                    </Badge>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h3 className="text-sm font-medium text-zinc-500 mb-3">Informações do Cupom</h3>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-zinc-500 text-sm">Desconto:</span>
                      <span className="font-medium">{selectedVoucher.discount}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-zinc-500 text-sm">Data de criação:</span>
                      <span>{format(convertToDate(selectedVoucher.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-zinc-500 text-sm">Expira em:</span>
                      <span>{format(convertToDate(selectedVoucher.expiresAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                    </div>
                    
                    {selectedVoucher.status === 'used' && selectedVoucher.usedAt && (
                      <div className="flex justify-between">
                        <span className="text-zinc-500 text-sm">Utilizado em:</span>
                        <span>{format(convertToDate(selectedVoucher.usedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                      </div>
      )}
    </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h3 className="text-sm font-medium text-zinc-500 mb-3">Cliente</h3>
                  
                  <div className="flex items-center mb-3">
                    <Avatar className="h-10 w-10 mr-3">
                      {selectedVoucher.member.photoURL ? (
                        <AvatarImage src={selectedVoucher.member.photoURL} />
                      ) : (
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {selectedVoucher.member.name.charAt(0)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <div className="font-medium">{selectedVoucher.member.name}</div>
                      <div className="text-xs text-zinc-500">{selectedVoucher.member.email || 'Email não disponível'}</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start">
                      <svg className="h-4 w-4 mr-2 text-zinc-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span>{selectedVoucher.member.phone}</span>
          </div>
        </div>
      </div>
                
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h3 className="text-sm font-medium text-zinc-500 mb-3">Estabelecimento</h3>
                  <div className="font-medium">{selectedVoucher.establishment.name}</div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </>
  );
};
  
  return <MemberReportsPage />;
} 