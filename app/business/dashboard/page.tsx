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
import { Percent, BadgeCheck, Ticket } from "lucide-react"
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
          <Badge className="bg-emerald-200 text-emerald-700 hover:bg-emerald-300">
            Check-in Realizado
          </Badge>
        )
      case "verified":
        return (
          <Badge className="bg-emerald-200 text-emerald-700 hover:bg-emerald-300">
            Verificado
          </Badge>
        )
      case "used":
        return (
          <Badge className="bg-emerald-200 text-emerald-700 hover:bg-emerald-300">
            Utilizado
          </Badge>
        )
      case "expired":
        return (
          <Badge className="bg-yellow-200 text-yellow-700 hover:bg-yellow-300">
            Voucher Expirado
          </Badge>
        )
      default:
        return (
          <Badge className="bg-zinc-200 text-zinc-700 hover:bg-zinc-300">
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
        <div className="bg-zinc-50 border border-zinc-100 p-6 rounded-lg">
          <div className="flex items-center justify-between gap-2">            
            <h3 className="text-sm font-sm text-zinc-400 mb-4">Vouchers Gerados no período</h3>
            <Ticket className="text-zinc-400 w-6 h-6 mb-4" />
          </div>
          <div className="text-3xl font-bold text-zinc-600">{dashboardData.todayMetrics.vouchers}</div>
          <div className="text-sm text-muted-foreground">
            {dashboardData.todayMetrics.voucherGrowth > 0 ? "+" : ""}
            {dashboardData.todayMetrics.voucherGrowth}% em relação ao período anterior
          </div>
        </div>

        {/* Card de Check-ins */}
        <div className="bg-zinc-50 border border-zinc-100 p-6 rounded-lg">
          <div className="flex items-center justify-between gap-2">            
            <h3 className="text-sm font-sm text-zinc-400 mb-4">Check-ins Realizados no período</h3>
            <BadgeCheck className="text-zinc-400 w-6 h-6 mb-4" />
          </div>
          <div className="text-3xl font-bold text-zinc-600">{dashboardData.todayMetrics.checkins}</div>
          <div className="text-sm text-muted-foreground">
            {dashboardData.todayMetrics.vouchers > 0 
              ? `${dashboardData.todayMetrics.checkins / dashboardData.todayMetrics.vouchers * 100}% dos vouchers gerados`
              : "0% dos vouchers gerados"}
          </div>
        </div>

        {/* Card de Taxa de Conversão */}
        <div className="bg-zinc-50 border border-zinc-100 p-6 rounded-lg">
          <div className="flex items-center justify-between gap-2">            
            <h3 className="text-sm font-sm text-zinc-400 mb-4">Taxa de Conversão no período</h3>
            <Percent className="text-zinc-400 w-6 h-6 mb-4" />
          </div>
          <div className="text-3xl font-bold text-zinc-600">
            {dashboardData.todayMetrics.conversionRate}%
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-zinc-50 border border-zinc-100 p-6 rounded-lg">
          <h3 className="text-sm font-sm text-zinc-400 mb-4">Vouchers e Check-ins</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dashboardData.monthlyData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#c4c4c4" />
              <XAxis dataKey="name" stroke="#c4c4c4" />
              <YAxis stroke="#c4c4c4" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff',
                  border: '1px solid #c4c4c4'
                }}
              />
              <Legend />
              <Bar dataKey="vouchers" name="Vouchers" fill="#791cc8" />
              <Bar dataKey="checkins" name="Check-ins" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-zinc-50 border border-zinc-100 p-6 rounded-lg">
          <h3 className="text-sm font-sm text-zinc-400 mb-4">Taxa de Conversão</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dashboardData.monthlyData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#c4c4c4" />
              <XAxis dataKey="name" stroke="#c4c4c4" />
              <YAxis stroke="#c4c4c4" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff',
                  border: '1px solid #c4c4c4'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="conversionRate" 
                name="Taxa de Conversão (%)" 
                stroke="#791cc8" 
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      
      <CardContent className="p-0">
        <Card className="bg-zinc-50 border-zinc-100">
          <CardHeader>
            <CardTitle className="text-sm font-sm text-zinc-400 mb-4">Últimos Check-ins</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-zinc-400">Cliente</TableHead>
                  <TableHead className="text-zinc-400">Telefone</TableHead>
                  <TableHead className="text-zinc-400">Data</TableHead>
                  <TableHead className="text-zinc-400">Status</TableHead>
                  <TableHead className="text-zinc-400">Código do Voucher</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboardData.recentCheckins.map((checkIn) => (
                  <TableRow key={checkIn.id}>
                    <TableCell className="font-medium text-zinc-500">
                      {checkIn.customerName}
                    </TableCell>
                    <TableCell className="text-zinc-400">
                      {checkIn.customerPhone}
                    </TableCell>
                    <TableCell className="text-zinc-400">
                      {checkIn.checkInDate}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(checkIn.status)}
                    </TableCell>
                    <TableCell className="font-medium text-zinc-500">
                      {checkIn.voucherCode}
                    </TableCell>
                  </TableRow>
                ))}
                {(!dashboardData.recentCheckins || dashboardData.recentCheckins.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-zinc-400">
                      Nenhum check-in encontrado no período
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </CardContent>
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
        <h1 className="text-2xl font-bold text-zinc-500">Dashboard</h1>
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

