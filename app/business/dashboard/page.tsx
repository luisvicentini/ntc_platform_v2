"use client"

import { useState } from "react"
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
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Ticket, CheckSquare, TrendingUp, Search, Filter, MoreVertical } from "lucide-react"
import { subDays } from "date-fns"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const voucherData = [
  { name: "Jan", vouchers: 400, checkins: 300 },
  { name: "Feb", vouchers: 300, checkins: 250 },
  { name: "Mar", vouchers: 200, checkins: 180 },
  { name: "Apr", vouchers: 278, checkins: 240 },
  { name: "May", vouchers: 189, checkins: 160 },
  { name: "Jun", vouchers: 239, checkins: 220 },
]

const conversionData = [
  { name: "Jan", rate: 75 },
  { name: "Feb", rate: 83 },
  { name: "Mar", rate: 90 },
  { name: "Apr", rate: 86 },
  { name: "May", rate: 85 },
  { name: "Jun", rate: 92 },
]

const customerTypeData = [
  { name: "Novos", value: 400 },
  { name: "Recorrentes", value: 300 },
  { name: "VIP", value: 100 },
]

const COLORS = ["#7435db", "#a85fdd", "#2dd4bf"]

const predefinedRanges = [
  { label: "Hoje", value: [new Date(), new Date()] },
  { label: "Ontem", value: [subDays(new Date(), 1), subDays(new Date(), 1)] },
  { label: "Última semana", value: [subDays(new Date(), 7), new Date()] },
  { label: "Último mês", value: [subDays(new Date(), 30), new Date()] },
  { label: "Últimos 60 dias", value: [subDays(new Date(), 60), new Date()] },
  { label: "Último ano", value: [subDays(new Date(), 365), new Date()] },
]

const checkIns = [
  {
    id: "1",
    customerName: "Luis Henrique Vicentini",
    customerPhone: "+55 (19) 98430-5001",
    associatedBusiness: "Não Tem Chef",
    checkInDate: "02/02/2025",
    status: "completed",
    voucherCode: "123456",
  },
  {
    id: "2",
    customerName: "Maria Silva",
    customerPhone: "+55 (19) 99999-8888",
    associatedBusiness: "Não Tem Chef",
    checkInDate: "03/02/2025",
    status: "completed",
    voucherCode: "234567",
  },
  {
    id: "3",
    customerName: "João Santos",
    customerPhone: "+55 (19) 97777-6666",
    associatedBusiness: "Não Tem Chef",
    checkInDate: "04/02/2025",
    status: "expired",
    voucherCode: "345678",
  },
]

export default function BusinessDashboardPage() {
  const [dateRange, setDateRange] = useState({ from: subDays(new Date(), 30), to: new Date() })
  const [searchTerm, setSearchTerm] = useState("")

  const filteredCheckIns = checkIns.filter((checkIn) =>
    checkIn.customerName.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-[#042f2e] text-[#2dd4bf] hover:bg-[#042f2e]">Check-in Realizado</Badge>
      case "expired":
        return (
          <Badge variant="secondary" className="bg-yellow-900/50 text-yellow-500">
            Voucher Expirado
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary" className="bg-gray-900/50 text-gray-400">
            Desconhecido
          </Badge>
        )
    }
  }

  return (
    <div className="container mx-auto py-6 px-4">
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card className="bg-[#131320] border-[#1a1b2d]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#7a7b9f]">Vouchers Gerados Hoje</CardTitle>
            <Ticket className="h-4 w-4 text-[#7a7b9f]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#e5e2e9]">54</div>
            <p className="text-xs text-[#7a7b9f]">+12% em relação a ontem</p>
          </CardContent>
        </Card>
        <Card className="bg-[#131320] border-[#1a1b2d]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#7a7b9f]">Check-ins Realizados Hoje</CardTitle>
            <CheckSquare className="h-4 w-4 text-[#7a7b9f]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#e5e2e9]">42</div>
            <p className="text-xs text-[#7a7b9f]">77% dos vouchers gerados</p>
          </CardContent>
        </Card>
        <Card className="bg-[#131320] border-[#1a1b2d]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#7a7b9f]">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-[#7a7b9f]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#e5e2e9]">77%</div>
            <p className="text-xs text-[#7a7b9f]">+5% em relação à média semanal</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 mb-8">
        <Card className="bg-[#131320] border-[#1a1b2d]">
          <CardHeader>
            <CardTitle className="text-[#e5e2e9]">Vouchers e Check-ins</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={voucherData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1b2d" />
                <XAxis dataKey="name" stroke="#7a7b9f" />
                <YAxis stroke="#7a7b9f" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#131320", border: "1px solid #1a1b2d" }}
                  labelStyle={{ color: "#e5e2e9" }}
                />
                <Legend wrapperStyle={{ color: "#7a7b9f" }} />
                <Bar dataKey="vouchers" fill="#7435db" name="Vouchers" />
                <Bar dataKey="checkins" fill="#a85fdd" name="Check-ins" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="bg-[#131320] border-[#1a1b2d]">
          <CardHeader>
            <CardTitle className="text-[#e5e2e9]">Taxa de Conversão</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={conversionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1b2d" />
                <XAxis dataKey="name" stroke="#7a7b9f" />
                <YAxis stroke="#7a7b9f" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#131320", border: "1px solid #1a1b2d" }}
                  labelStyle={{ color: "#e5e2e9" }}
                />
                <Legend wrapperStyle={{ color: "#7a7b9f" }} />
                <Line type="monotone" dataKey="rate" stroke="#2dd4bf" name="Taxa de Conversão (%)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[#131320] border-[#1a1b2d] mb-8">
        <CardHeader>
          <CardTitle className="text-[#e5e2e9]">Tipos de Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={customerTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {customerTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: "#131320", border: "1px solid #1a1b2d" }}
                labelStyle={{ color: "#e5e2e9" }}
              />
              <Legend wrapperStyle={{ color: "#7a7b9f" }} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="bg-[#131320] border-[#1a1b2d]">
        <CardHeader>
          <CardTitle className="text-[#e5e2e9]">Relatório de Check-ins</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6 gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7a7b9f]" />
              <Input
                placeholder="Pesquisar clientes"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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

          <Table>
            <TableHeader>
              <TableRow className="border-[#1a1b2d] hover:bg-[#1a1b2d]">
                <TableHead className="text-[#7a7b9f]">Cliente</TableHead>
                <TableHead className="text-[#7a7b9f]">Data do Check-in</TableHead>
                <TableHead className="text-[#7a7b9f]">Status</TableHead>
                <TableHead className="text-[#7a7b9f]">Código do Cupom</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCheckIns.map((checkIn) => (
                <TableRow key={checkIn.id} className="border-[#1a1b2d] hover:bg-[#1a1b2d]">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-[#e5e2e9]">{checkIn.customerName}</span>
                      <span className="text-sm text-[#7a7b9f]">{checkIn.customerPhone}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-[#7a7b9f]">{checkIn.checkInDate}</TableCell>
                  <TableCell>{getStatusBadge(checkIn.status)}</TableCell>
                  <TableCell className="font-medium text-[#e5e2e9]">{checkIn.voucherCode}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 text-[#7a7b9f] hover:text-[#e5e2e9]">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#131320] border-[#1a1b2d] text-[#e5e2e9]">
                        <DropdownMenuItem className="hover:bg-[#1a1b2d]">Ver detalhes</DropdownMenuItem>
                        <DropdownMenuItem className="hover:bg-[#1a1b2d]">Exportar PDF</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

