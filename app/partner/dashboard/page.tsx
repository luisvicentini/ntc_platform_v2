"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from "recharts"
import { format, parseISO, subDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import type { DateRange } from "@/components/ui/date-range-picker"

interface Metrics {
  totalEstablishments: number
  totalMembers: number
  activeMembers: number
  newMembers: number
  canceledMembers: number
  totalVouchers: number
  totalCheckins: number
  conversionRate: number
  vouchersGraph: Array<{
    date: string
    vouchers: number
    checkins: number
  }>
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date()
  })

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const params = new URLSearchParams({
          startDate: dateRange.from.toISOString(),
          endDate: dateRange.to.toISOString()
        })

        const response = await fetch(`/api/partner/metrics?${params}`)
        const data = await response.json()
        setMetrics(data)
      } catch (error) {
        console.error("Erro ao buscar métricas:", error)
      }
    }

    fetchMetrics()
  }, [dateRange])

  if (!metrics) return null

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#e5e2e9]">Dashboard</h1>
        <DateRangePicker 
          date={dateRange}
          onDateChange={(date) => {
            if (date) setDateRange(date)
          }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-[#131320] border-[#1a1b2d]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#e5e2e9]">
              Estabelecimentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#e5e2e9]">{metrics.totalEstablishments}</div>
          </CardContent>
        </Card>

        <Card className="bg-[#131320] border-[#1a1b2d]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#e5e2e9]">
              Total de Membros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#e5e2e9]">{metrics.totalMembers}</div>
            <p className="text-xs text-[#7a7b9f]">
              {metrics.activeMembers} ativos • {metrics.newMembers} novos • {metrics.canceledMembers} cancelados
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#131320] border-[#1a1b2d]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#e5e2e9]">
              Vouchers Gerados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#e5e2e9]">{metrics.totalVouchers}</div>
          </CardContent>
        </Card>

        <Card className="bg-[#131320] border-[#1a1b2d]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#e5e2e9]">
              Check-ins Realizados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#e5e2e9]">{metrics.totalCheckins}</div>
            <p className="text-xs text-[#7a7b9f]">
              Taxa de conversão: {(metrics.conversionRate || 0).toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 mt-6">
        {/* Gráfico de Vouchers e Check-ins */}
        <Card className="bg-[#131320] border-[#1a1b2d] p-6">
          <CardHeader>
            <CardTitle className="text-[#e5e2e9]">Vouchers e Check-ins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics.vouchersGraph}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1b2d" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#7a7b9f"
                    tick={{ fill: '#7a7b9f' }}
                    tickFormatter={(date) => format(parseISO(date), 'dd/MM', { locale: ptBR })}
                  />
                  <YAxis stroke="#7a7b9f" tick={{ fill: '#7a7b9f' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#131320',
                      border: '1px solid #1a1b2d',
                      color: '#e5e2e9'
                    }}
                    formatter={(value: number) => [value, '']}
                    labelFormatter={(date) => format(parseISO(date), 'dd/MM/yyyy', { locale: ptBR })}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="vouchers"
                    stroke="#7435db"
                    name="Vouchers"
                  />
                  <Line
                    type="monotone"
                    dataKey="checkins"
                    stroke="#4ade80"
                    name="Check-ins"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Membros */}
        <Card className="bg-[#131320] border-[#1a1b2d] p-6">
          <CardHeader>
            <CardTitle className="text-[#e5e2e9]">Evolução de Membros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[{
                  name: 'Membros',
                  total: metrics.totalMembers,
                  ativos: metrics.activeMembers,
                  novos: metrics.newMembers,
                  cancelados: metrics.canceledMembers
                }]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1b2d" />
                  <XAxis dataKey="name" stroke="#7a7b9f" tick={{ fill: '#7a7b9f' }} />
                  <YAxis stroke="#7a7b9f" tick={{ fill: '#7a7b9f' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#131320',
                      border: '1px solid #1a1b2d',
                      color: '#e5e2e9'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="ativos" fill="#4ade80" name="Ativos" />
                  <Bar dataKey="novos" fill="#7435db" name="Novos" />
                  <Bar dataKey="cancelados" fill="#ef4444" name="Cancelados" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

