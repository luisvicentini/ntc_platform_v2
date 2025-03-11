"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Filter, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface FilterProps {
  statusFilter: string
  onStatusChange: (status: string) => void
  dateRange: DateRange | undefined
  onDateRangeChange: (range: DateRange | undefined) => void
  onClearFilters: () => void
  hasActiveFilters: boolean
}

export function MemberFilterModal({
  statusFilter,
  onStatusChange,
  dateRange,
  onDateRangeChange,
  onClearFilters,
  hasActiveFilters
}: FilterProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <div className="flex items-center gap-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            size="icon"
            className={cn(
              "bg-zinc-100 border-zinc-200 hover:bg-zinc-100 hover:border-primary",
              hasActiveFilters && "border-primary"
            )}
          >
            <Filter className="h-4 w-4 text-zinc-400" />
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-zinc-100 border-zinc-200">
          <DialogHeader>
            <DialogTitle className="text-zinc-500">Filtros</DialogTitle>
          </DialogHeader>
          
          <div className="mt-4 space-y-10">
            <div className="space-y-3">
              <Label className="text-zinc-500">Status</Label>
              <RadioGroup 
                value={statusFilter} 
                onValueChange={(value) => {
                  onStatusChange(value)
                  setOpen(false)
                }}
                className="flex flex-col space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all" className="border-primary" />
                  <Label htmlFor="all" className="text-zinc-500">Todos</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="active" id="active" className="border-primary" />
                  <Label htmlFor="active" className="text-zinc-500">Ativos</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="inactive" id="inactive" className="border-primary" />
                  <Label htmlFor="inactive" className="text-zinc-500">Inativos</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label className="text-zinc-500">Período de Expiração</Label>
              <div className="rounded-md border border-zinc-200 p-3">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={(range) => {
                    onDateRangeChange(range)
                    if (range?.from && range?.to) {
                      setOpen(false)
                    }
                  }}
                  numberOfMonths={2}
                  locale={ptBR}
                  className="bg-zinc-100"
                />
              </div>
              {dateRange?.from && (
                <div className="text-sm text-zinc-400">
                  {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })}
                  {dateRange.to && (
                    <> - {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}</>
                  )}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {hasActiveFilters && (
        <Button
          variant="outline"
          size="icon"
          onClick={onClearFilters}
          className="bg-zinc-100 text-rose-500 hover:text-rose-500 border-rose-500 hover:bg-rose-500/20 hover:border-rose-500 w-auto px-2"
        >
          <X className="h-4 w-4" /> Limpar filtros
        </Button>
      )}
    </div>
  )
} 