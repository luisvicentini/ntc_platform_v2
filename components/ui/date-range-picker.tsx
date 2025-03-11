"use client"

import * as React from "react"
import { format, subDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"
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
      <PopoverContent align="start" className="w-auto p-4">
        <div className="space-y-4">
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
          <div className="rounded-md border">
            <Calendar
              mode="range"
              selected={date}
              onSelect={onDateChange}
              numberOfMonths={2}
              locale={ptBR}
              initialFocus
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
} 