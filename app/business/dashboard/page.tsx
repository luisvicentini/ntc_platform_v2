"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, Filter } from "lucide-react"
import { subDays, isToday } from "date-fns"
import { DateRange } from "react-day-picker"

interface DashboardData {
  todayMetrics: {
    vouchers: number
    checkins: number
    conversionRate: number
    voucherGrowth: number
  }
  monthlyData: Array<{
    name: string
    vouchers: number
    checkins: number
    conversionRate: number
  }>
  recentCheckins: Array<{
    id: string
    customerName: string
    customerPhone: string
    checkInDate: string
    status: string
    voucherCode: string
  }>
}

const predefinedRanges = [
  { label: "Hoje", value: [new Date(), new Date()] },
  { label: "Ontem", value: [subDays(new Date(), 1), subDays(new Date(), 1)] },
  { label: "Última semana", value: [subDays(new Date(), 7), new Date()] },
  { label: "Último mês", value: [subDays(new Date(), 30), new Date()] },
  { label: "Últimos 60 dias", value: [subDays(new Date(), 60), new Date()] },
  { label: "Último ano", value: [subDays(new Date(), 365), new Date()] },
]

// Componente para o conteúdo dinâmico
function DashboardContent({ dateRange }: { dateRange: DateRange }) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true)
        const sessionToken = localStorage.getItem("sessionToken") || ""
        
        const response = await fetch(
          `/api/dashboard/business?from=${dateRange.from?.toISOString()}&to=${dateRange.to?.toISOString()}`,
          {
            headers: {
              "x-session-token": sessionToken,
            },
          }
        )

        if (!response.ok) throw new Error("Falha ao carregar dados")
        
        const data = await response.json()
        setDashboardData(data)
      } catch (error) {
        console.error("Erro ao carregar dashboard:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (dateRange.from && dateRange.to) {
      fetchDashboardData()
    }
  }, [dateRange])

  const getTitleSuffix = () => {
    if (isToday(dateRange.from) && isToday(dateRange.to)) {
      return "hoje"
    }
    return "no período"
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-[#042f2e] text-[#2dd4bf] hover:bg-[#042f2e]">
            Check-in Realizado
          </Badge>
        )
      case "verified":
        return (
          <Badge className="bg-blue-900/50 text-blue-500">
            Verificado
          </Badge>
        )
      case "used":
        return (
          <Badge className="bg-green-900/50 text-green-500">
            Utilizado
          </Badge>
        )
      case "expired":
        return (
          <Badge className="bg-yellow-900/50 text-yellow-500">
            Voucher Expirado
          </Badge>
        )
      default:
        return (
          <Badge className="bg-gray-900/50 text-gray-400">
            Desconhecido
          </Badge>
        )
    }
  }

  if (isLoading) return <div>Carregando...</div>
  if (!dashboardData) return null

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-6">
        {/* Card de Vouchers */}
        <div className="bg-[#131320] border border-[#1a1b2d] p-6 rounded-lg">
          <h3>Vouchers Gerados no período</h3>
          <div className="text-3xl font-bold">{dashboardData.todayMetrics.vouchers}</div>
          <div className="text-sm text-muted-foreground">
            {dashboardData.todayMetrics.voucherGrowth > 0 ? "+" : ""}
            {dashboardData.todayMetrics.voucherGrowth}% em relação ao período anterior
          </div>
        </div>

        {/* Card de Check-ins */}
        <div className="bg-[#131320] border border-[#1a1b2d] p-6 rounded-lg">
          <h3>Check-ins Realizados no período</h3>
          <div className="text-3xl font-bold">{dashboardData.todayMetrics.checkins}</div>
          <div className="text-sm text-muted-foreground">
            {dashboardData.todayMetrics.vouchers > 0 
              ? `${dashboardData.todayMetrics.checkins / dashboardData.todayMetrics.vouchers * 100}% dos vouchers gerados`
              : "0% dos vouchers gerados"}
          </div>
        </div>

        {/* Card de Taxa de Conversão */}
        <div className="bg-[#131320] border border-[#1a1b2d] p-6 rounded-lg">
          <h3>Taxa de Conversão no período</h3>
          <div className="text-3xl font-bold">
            {dashboardData.todayMetrics.conversionRate}%
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-[#131320] border border-[#1a1b2d] p-6 rounded-lg">
          <h3>Vouchers e Check-ins</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dashboardData.monthlyData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#282942" />
              <XAxis dataKey="name" stroke="#7a7b9f" />
              <YAxis stroke="#7a7b9f" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1a1b2d',
                  border: '1px solid #282942'
                }}
              />
              <Legend />
              <Bar dataKey="vouchers" name="Vouchers" fill="#2563eb" />
              <Bar dataKey="checkins" name="Check-ins" fill="#16a34a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-[#131320] border border-[#1a1b2d] p-6 rounded-lg">
          <h3>Taxa de Conversão</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dashboardData.monthlyData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#282942" />
              <XAxis dataKey="name" stroke="#7a7b9f" />
              <YAxis stroke="#7a7b9f" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1a1b2d',
                  border: '1px solid #282942'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="conversionRate" 
                name="Taxa de Conversão (%)" 
                stroke="#8b5cf6" 
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <Card className="bg-[#131320] border-[#1a1b2d] mb-8">
        <CardHeader>
          <CardTitle className="text-[#e5e2e9]">Relatório de Check-ins</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6 gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7a7b9f]" />
              <Input
                placeholder="Pesquisar clientes"
                className="pl-10 bg-[#1a1b2d] text-[#e5e2e9] border-[#131320]"
              />
            </div>
            <Button
              variant="outline"
              className="bg-[#1a1b2d] text-[#e5e2e9] border-[#131320] hover:bg-[#131320] hover:text-[#e5e2e9]"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtrar
            </Button>
          </div>

          <div className="space-y-6">
            <Card className="bg-[#131320] border-[#1a1b2d]">
              <CardHeader>
                <CardTitle className="text-[#e5e2e9]">Últimos Check-ins</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[#7a7b9f]">Cliente</TableHead>
                      <TableHead className="text-[#7a7b9f]">Telefone</TableHead>
                      <TableHead className="text-[#7a7b9f]">Data</TableHead>
                      <TableHead className="text-[#7a7b9f]">Status</TableHead>
                      <TableHead className="text-[#7a7b9f]">Código do Voucher</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dashboardData.recentCheckins.map((checkIn) => (
                      <TableRow key={checkIn.id}>
                        <TableCell className="font-medium text-[#e5e2e9]">
                          {checkIn.customerName}
                        </TableCell>
                        <TableCell className="text-[#7a7b9f]">
                          {checkIn.customerPhone}
                        </TableCell>
                        <TableCell className="text-[#7a7b9f]">
                          {checkIn.checkInDate}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(checkIn.status)}
                        </TableCell>
                        <TableCell className="font-medium text-[#e5e2e9]">
                          {checkIn.voucherCode}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!dashboardData.recentCheckins || dashboardData.recentCheckins.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-[#7a7b9f]">
                          Nenhum check-in encontrado no período
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Componente principal
export default function DashboardPage() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
  })

  return (
    <div className="p-8">
      {/* Parte estática - não será re-renderizada com os dados */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <DateRangePicker
          date={dateRange}
          onDateChange={(date) => {
            if (date) setDateRange(date)
          }}
        />
      </div>

      {/* Parte dinâmica - será re-renderizada quando os dados mudarem */}
      <DashboardContent dateRange={dateRange} />
    </div>
  )
}

