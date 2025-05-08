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

  // Ordenar estabelecimentos por quantidade de vouchers (top 5)
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
    .slice(0, 5);

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
          Top 5 estabelecimentos por volume de cupons gerados
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
      <TrendsChart vouchers={vouchers} />
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

// Função principal para a página de relatórios de membros
function MemberReportsPage() {
  // Estado para as abas
  const [activeTab, setActiveTab] = useState<'charts' | 'data' | 'products'>('charts');
  
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

  // Função para obter a cor do status
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
  const formatCompactDate = (date: string | FirebaseTimestamp | undefined) => {
    if (!date) return "Indisponível";
    
    try {
      const dateObj = convertToDate(date);
      // Formatar como DD/MM/YYYY
      return format(dateObj, "dd/MM/yyyy", { locale: ptBR });
    } catch (error) {
      return "Data inválida";
    }
  };
  
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

  // Função para exibir o card do cupom
  const VoucherCard = ({ voucher }: { voucher: Voucher }) => {
    // Calcular se está próximo de expirar (menos de 3 dias)
    const isNearExpiry = () => {
      if (!voucher.expiresAt) return false;
      
      try {
        const expiryDate = convertToDate(voucher.expiresAt);
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
            <p className="text-xs text-zinc-500"><span className="font-medium text-zinc-500">{voucher.voucherDescription}</span></p>
            <p className="text-xs text-zinc-500"><span className="font-medium text-zinc-500">{voucher.discountRules}</span></p>
            <p className="text-xs text-zinc-500"><span className="font-medium text-zinc-500">{voucher.usageLimit}</span></p>

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

  // Função para alterar a página
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
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

  // Função para exibir os detalhes do cupom
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
      <div className="flex overflow-x-auto gap-4 md:gap-6 pb-4">
        {columns.map(column => {
          const columnVouchers = orderedVouchers.filter(v => v.status === column.status);
          return (
            <div key={column.status} className="space-y-4 min-w-[350px] max-w-[350px]">
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

  // Renderização do componente
  return (
    <div className="container mx-auto max-w-7xl px-4 py-6 pb-24">
      <div className="flex flex-col md:flex-row items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Relatório de Cupons</h1>
        <div className="flex items-center space-x-3 mt-2 md:mt-0">
          <DollarSign className="h-5 w-5 text-emerald-500" />
          <span className="text-lg font-medium text-emerald-500">
            Total: {filteredVouchers.length} cupons
          </span>
        </div>
      </div>

      {/* Toolbar com pesquisa e filtros - visível nas abas de vouchers */}
      {activeTab !== 'products' && (
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
          { id: 'data', label: 'Dados', icon: <LayoutGrid className="h-4 w-4" /> },
          { id: 'products', label: 'Produtos', icon: <Package className="h-4 w-4" /> }
        ]} 
        activeTab={activeTab} 
        setActiveTab={(id) => setActiveTab(id as 'charts' | 'data' | 'products')} 
      />

      {activeTab === 'products' ? (
        <ProductsReport />
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
              {/* Opções de visualização para a aba de dados */}
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

              {viewMode === "kanban" ? (
                <KanbanView vouchers={filteredVouchers} />
              ) : (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
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
                    <div className="flex items-center justify-center mt-6 space-x-2 pb-4">
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
                          ))}
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
            setSelectedVoucher(null);
            setIsDetailsOpen(false);
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