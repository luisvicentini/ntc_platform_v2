"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Building, Ticket, TrendingUp } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { subDays } from "date-fns"

interface DashboardData {
  totalUsers: number
  totalPartners: number
  totalVouchers: number
  monthlyData: Array<{
    name: string
    vouchers: number
    checkins: number
  }>
  growthRate: string
}

const predefinedRanges = [
  { label: "Hoje", value: [new Date(), new Date()] },
  { label: "Ontem", value: [subDays(new Date(), 1), subDays(new Date(), 1)] },
  { label: "Última semana", value: [subDays(new Date(), 7), new Date()] },
  { label: "Último mês", value: [subDays(new Date(), 30), new Date()] },
  { label: "Últimos 60 dias", value: [subDays(new Date(), 60), new Date()] },
  { label: "Último ano", value: [subDays(new Date(), 365), new Date()] },
]

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState({ from: subDays(new Date(), 30), to: new Date() })
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/dashboard/master?from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}`, {
          headers: {
            'x-session-token': localStorage.getItem('session_token') || ''
          }
        })
        
        if (!response.ok) throw new Error('Falha ao carregar dados')
        
        const data = await response.json()
        setDashboardData(data)
      } catch (error) {
        console.error('Erro ao carregar dashboard:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [dateRange])

  if (isLoading) {
    return <div>Carregando...</div>
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <h2 className="text-3xl font-bold tracking-tight text-zinc-500 mb-6">Dashboard</h2>

      <div className="mb-6">
        <DateRangePicker
          dateRange={dateRange}
          onDateRangeChange={(newRange) => {
            setDateRange(newRange)
            // Here you would typically fetch new data based on the date range
            console.log("New date range:", newRange)
          }}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="bg-zinc-100 border-zinc-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-500">{dashboardData?.totalUsers}</div>
            <p className="text-xs text-zinc-400">+0% em relação ao mês passado</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-100 border-zinc-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Parceiros Ativos</CardTitle>
            <Building className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-500">0</div>
            <p className="text-xs text-zinc-400">0 novos esta semana</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-100 border-zinc-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Total de Vouchers</CardTitle>
            <Ticket className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-500">0</div>
            <p className="text-xs text-zinc-400">+0% em relação ao mês passado</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-100 border-zinc-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Crescimento Mensal</CardTitle>
            <TrendingUp className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-500">0%</div>
            <p className="text-xs text-zinc-400">+0% em relação ao mês anterior</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-zinc-100 border-zinc-200">
          <CardHeader>
            <CardTitle className="text-zinc-500">Vouchers e Check-ins</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dashboardData?.monthlyData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1b2d" />
                <XAxis dataKey="name" stroke="#7a7b9f" />
                <YAxis stroke="#7a7b9f" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#131320", border: "1px solid #1a1b2d" }}
                  labelStyle={{ color: "#e5e2e9" }}
                />
                <Legend wrapperStyle={{ color: "#7a7b9f" }} />
                <Bar dataKey="vouchers" fill="#7435db" />
                <Bar dataKey="checkins" fill="#a85fdd" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

