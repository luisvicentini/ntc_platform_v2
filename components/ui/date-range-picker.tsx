"use client"

import * as React from "react"
import { format, subDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface DateRangePickerProps {
  date?: DateRange
  onDateChange: (date: DateRange | undefined) => void
}

export function DateRangePicker({ date, onDateChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  
  const presets = [
    { label: "Hoje", value: "today" },
    { label: "Ontem", value: "yesterday" },
    { label: "Últimos 7 dias", value: "last7" },
    { label: "Últimos 30 dias", value: "last30" },
    { label: "Últimos 60 dias", value: "last60" },
    { label: "Último ano", value: "last365" },
  ]

  const handleSelect = (value: string) => {
    const today = new Date()
    let range: DateRange | undefined

    switch (value) {
      case "today":
        range = { from: today, to: today }
        break
      case "yesterday":
        const yesterday = subDays(today, 1)
        range = { from: yesterday, to: yesterday }
        break
      case "last7":
        range = { from: subDays(today, 7), to: today }
        break
      case "last30":
        range = { from: subDays(today, 30), to: today }
        break
      case "last60":
        range = { from: subDays(today, 60), to: today }
        break
      case "last365":
        range = { from: subDays(today, 365), to: today }
        break
    }

    onDateChange(range)
    setIsOpen(false)
  }

  // Estilo personalizado para o calendário
  const calendarClassNames = {
    months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
    month: "space-y-4",
    caption: "flex justify-center pt-1 relative items-center",
    caption_label: "text-sm font-medium",
    nav: "space-x-1 flex items-center",
    nav_button: cn(
      "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border border-zinc-200 rounded-md"
    ),
    nav_button_previous: "absolute left-1",
    nav_button_next: "absolute right-1",
    table: "w-full border-collapse",
    head_row: "flex w-full",
    head_cell: "text-zinc-500 w-9 font-normal text-[0.8rem] text-center",
    row: "flex w-full mt-2",
    cell: "h-9 w-9 text-center text-sm relative p-0 focus-within:relative focus-within:z-20",
    day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-md hover:bg-zinc-100",
    day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
    day_today: "bg-zinc-100 text-zinc-900",
    day_outside: "text-zinc-400 opacity-50",
    day_disabled: "text-zinc-400 opacity-50",
    day_range_middle: "aria-selected:bg-zinc-100 aria-selected:text-zinc-900",
    day_hidden: "invisible",
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger>
        <Button
          variant="outline"
          className={cn(
            "hover:bg-zinc-100 border-zinc-200 text-zinc-500 w-[330px] justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date?.from ? (
            date.to ? (
              <>
                {format(date.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                {format(date.to, "dd/MM/yyyy", { locale: ptBR })}
              </>
            ) : (
              format(date.from, "dd/MM/yyyy", { locale: ptBR })
            )
          ) : (
            <span>Selecione um período</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <div className="space-y-4 p-3">
          <Select onValueChange={handleSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um período predefinido" />
            </SelectTrigger>
            <SelectContent position="popper">
              {presets.map((preset) => (
                <SelectItem key={preset.value} value={preset.value}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="border border-zinc-200 rounded-md overflow-hidden bg-white">
            <Calendar
              mode="range"
              selected={date}
              onSelect={onDateChange}
              numberOfMonths={2}
              locale={ptBR}
              initialFocus
              classNames={calendarClassNames}
              weekStartsOn={0} // Domingo como primeiro dia da semana
              fixedWeeks={true} // Manter sempre 6 semanas visíveis
              showOutsideDays={true} // Mostrar dias fora do mês atual
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
} 