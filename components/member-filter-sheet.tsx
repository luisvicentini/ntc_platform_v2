"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Filter } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
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
}

export function MemberFilterSheet({
  statusFilter,
  onStatusChange,
  dateRange,
  onDateRangeChange,
}: FilterProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="icon"
          className="bg-zinc-100 border-zinc-200 hover:bg-zinc-100 hover:border-[#7435db]"
        >
          <Filter className="h-4 w-4 text-zinc-400" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] bg-zinc-100 border-l border-zinc-200">
        <SheetHeader>
          <SheetTitle className="text-zinc-500">Filtros</SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          <div className="space-y-3">
            <Label className="text-zinc-500">Status</Label>
            <RadioGroup 
              value={statusFilter} 
              onValueChange={onStatusChange}
              className="flex flex-col space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all" className="border-[#7435db]" />
                <Label htmlFor="all" className="text-zinc-500">Todos</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="active" id="active" className="border-[#7435db]" />
                <Label htmlFor="active" className="text-zinc-500">Ativos</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="inactive" id="inactive" className="border-[#7435db]" />
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
                onSelect={onDateRangeChange}
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
      </SheetContent>
    </Sheet>
  )
} 