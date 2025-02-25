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
              "bg-[#131320] border-[#1a1b2d] hover:bg-[#1a1b2d] hover:border-[#7435db]",
              hasActiveFilters && "border-[#7435db]"
            )}
          >
            <Filter className="h-4 w-4 text-[#7a7b9f]" />
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-[#131320] border-[#1a1b2d]">
          <DialogHeader>
            <DialogTitle className="text-[#e5e2e9]">Filtros</DialogTitle>
          </DialogHeader>
          
          <div className="mt-4 space-y-10">
            <div className="space-y-3">
              <Label className="text-[#e5e2e9]">Status</Label>
              <RadioGroup 
                value={statusFilter} 
                onValueChange={(value) => {
                  onStatusChange(value)
                  setOpen(false)
                }}
                className="flex flex-col space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all" className="border-[#7435db]" />
                  <Label htmlFor="all" className="text-[#e5e2e9]">Todos</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="active" id="active" className="border-[#7435db]" />
                  <Label htmlFor="active" className="text-[#e5e2e9]">Ativos</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="inactive" id="inactive" className="border-[#7435db]" />
                  <Label htmlFor="inactive" className="text-[#e5e2e9]">Inativos</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label className="text-[#e5e2e9]">Período de Expiração</Label>
              <div className="rounded-md border border-[#1a1b2d] p-3">
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
                  className="bg-[#131320]"
                />
              </div>
              {dateRange?.from && (
                <div className="text-sm text-[#7a7b9f]">
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
          className="bg-[#131320] text-rose-500 hover:text-rose-500 border-rose-500 hover:bg-rose-500/20 hover:border-rose-500 w-auto px-2"
        >
          <X className="h-4 w-4" /> Limpar filtros
        </Button>
      )}
    </div>
  )
} 