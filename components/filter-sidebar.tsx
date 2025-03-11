"use client"

import { useState } from "react"
import { DateRange } from "react-day-picker"
import { subDays } from "date-fns"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

export function FilterSidebar({ onFilterChange }: { onFilterChange: (filters: any) => void }) {
  const [filters, setFilters] = useState({
    code: "",
    memberName: "",
    email: "",
    phone: "",
    establishment: "",
    status: [] as string[],
    dateRange: {
      from: subDays(new Date(), 30),
      to: new Date(),
    } as DateRange,
  })

  const handleStatusChange = (status: string) => {
    setFilters(prev => ({
      ...prev,
      status: prev.status.includes(status)
        ? prev.status.filter(s => s !== status)
        : [...prev.status, status]
    }))
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Filtros</Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] bg-zinc-100 border-zinc-200 text-zinc-500">
        <SheetHeader>
          <SheetTitle className="text-zinc-500">Filtros</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Código do Cupom</Label>
            <Input
              placeholder="Digite o código"
              value={filters.code}
              onChange={(e) => setFilters({ ...filters, code: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Nome do Cliente</Label>
            <Input
              placeholder="Digite o nome"
              value={filters.memberName}
              onChange={(e) => setFilters({ ...filters, memberName: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              placeholder="Digite o email"
              value={filters.email}
              onChange={(e) => setFilters({ ...filters, email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Telefone</Label>
            <Input
              placeholder="Digite o telefone"
              value={filters.phone}
              onChange={(e) => setFilters({ ...filters, phone: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Estabelecimento</Label>
            <Input
              placeholder="Digite o estabelecimento"
              value={filters.establishment}
              onChange={(e) => setFilters({ ...filters, establishment: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <RadioGroup className="grid grid-cols-2 gap-2">
              {["Pendente", "Verificado", "Utilizado", "Expirado"].map((status) => (
                <div
                  key={status}
                  className={`border rounded-md p-2 cursor-pointer ${
                    filters.status.includes(status) ? "bg-zinc-100 border-primary" : "border-zinc-200"
                  }`}
                  onClick={() => handleStatusChange(status)}
                >
                  {status}
                </div>
              ))}
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <Label>Período</Label>
            <DateRangePicker
              date={filters.dateRange}
              onDateChange={(date) => setFilters({ ...filters, dateRange: date || {} as DateRange })}
            />
          </div>
          <Button
            className="w-full bg-primary hover:bg-primary/90"
            onClick={() => onFilterChange(filters)}
          >
            Aplicar Filtros
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
} 