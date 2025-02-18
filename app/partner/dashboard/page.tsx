"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Users, Store, Ticket, CheckSquare } from "lucide-react"
import { subDays } from "date-fns"

interface DashboardData {
  establishmentData: Array<{
    establishmentId: string
    vouchers: number
    checkins: number
  }>
  monthlyData: Array<{
    name: string
    vouchers: number
    checkins: number
    rate: number
  }>
}

const data = [
  { name: "Jan", vouchers: 400, checkins: 240 },
  { name: "Feb", vouchers: 300, checkins: 139 },
  { name: "Mar", vouchers: 200, checkins: 980 },
  { name: "Apr", vouchers: 278, checkins: 390 },
  { name: "May", vouchers: 189, checkins: 480 },
  { name: "Jun", vouchers: 239, checkins: 380 },
]

const predefinedRanges = [
  { label: "Hoje", value: [new Date(), new Date()] },
  { label: "Ontem", value: [subDays(new Date(), 1), subDays(new Date(), 1)] },
  { label: "Última semana", value: [subDays(new Date(), 7), new Date()] },
  { label: "Último mês", value: [subDays(new Date(), 30), new Date()] },
  { label: "Últimos 60 dias", value: [subDays(new Date(), 60), new Date()] },
  { label: "Último ano", value: [subDays(new Date(), 365), new Date()] },
]

export default function PartnerDashboardPage() {
  const [dateRange, setDateRange] = useState({ from: subDays(new Date(), 30), to: new Date() })
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/dashboard/partner?from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}`, {
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

  // Calcular totais
  const totalVouchers = dashboardData?.establishmentData.reduce((acc, curr) => acc + curr.vouchers, 0) || 0
  const totalCheckins = dashboardData?.establishmentData.reduce((acc, curr) => acc + curr.checkins, 0) || 0
  const conversionRate = totalVouchers > 0 ? (totalCheckins / totalVouchers) * 100 : 0

  return (
    <div className="container py-6">
      <h2 className="text-3xl font-bold tracking-tight text-[#e5e2e9] mb-6">Dashboard</h2>

      <div className="mb-6">
        <DateRangePicker
          dateRange={dateRange}
          onDateRangeChange={(newRange) => {
            setDateRange(newRange)
            console.log("Novo intervalo de datas:", newRange)
          }}
          predefinedRanges={predefinedRanges}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="bg-[#131320] border-[#1a1b2d]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#7a7b9f]">Total de Vouchers</CardTitle>
            <Ticket className="h-4 w-4 text-[#7a7b9f]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#e5e2e9]">{totalVouchers}</div>
          </CardContent>
        </Card>
        <Card className="bg-[#131320] border-[#1a1b2d]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#7a7b9f]">Estabelecimentos</CardTitle>
            <Store className="h-4 w-4 text-[#7a7b9f]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#e5e2e9]">15</div>
            <p className="text-xs text-[#7a7b9f]">2 novos esta semana</p>
          </CardContent>
        </Card>
        <Card className="bg-[#131320] border-[#1a1b2d]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#7a7b9f]">Check-ins Realizados</CardTitle>
            <CheckSquare className="h-4 w-4 text-[#7a7b9f]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#e5e2e9]">{totalCheckins}</div>
          </CardContent>
        </Card>
        <Card className="bg-[#131320] border-[#1a1b2d]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#7a7b9f]">Taxa de Conversão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#e5e2e9]">{conversionRate.toFixed(2)}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-[#131320] border-[#1a1b2d]">
          <CardHeader>
            <CardTitle className="text-[#e5e2e9]">Vouchers e Check-ins</CardTitle>
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

