"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Filter } from "lucide-react"
import { cn } from "@/lib/utils/utils"
import { addDays, format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface FilterProps {
  statusFilter: string
  onStatusChange: (status: string) => void
  dateRange: DateRange | undefined
  onDateRangeChange: (range: DateRange | undefined) => void
}

export function MemberFilter({
  statusFilter,
  onStatusChange,
  dateRange,
  onDateRangeChange,
}: FilterProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="icon"
          className="bg-zinc-100 border-zinc-200 hover:bg-zinc-100 hover:border-primary"
        >
          <Filter className="h-4 w-4 text-zinc-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[240px] bg-zinc-100 border-zinc-200"
        forceMount
      >
        <DropdownMenuLabel className="text-zinc-500 px-2 py-1.5">
          Status
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-zinc-100" />
        <DropdownMenuItem
          onClick={() => {
            onStatusChange("all")
            setOpen(false)
          }}
          className={cn(
            "cursor-pointer text-zinc-500 hover:bg-zinc-100 focus:bg-zinc-100 focus:text-zinc-500",
            statusFilter === "all" && "bg-zinc-100"
          )}
        >
          Todos
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            onStatusChange("active")
            setOpen(false)
          }}
          className={cn(
            "cursor-pointer text-zinc-500 hover:bg-zinc-100 focus:bg-zinc-100 focus:text-zinc-500",
            statusFilter === "active" && "bg-zinc-100"
          )}
        >
          Ativos
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            onStatusChange("inactive")
            setOpen(false)
          }}
          className={cn(
            "cursor-pointer text-zinc-500 hover:bg-zinc-100 focus:bg-zinc-100 focus:text-zinc-500",
            statusFilter === "inactive" && "bg-zinc-100"
          )}
        >
          Inativos
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="bg-zinc-100" />
        <div className="p-3">
          <span className="text-sm text-zinc-500 mb-2 block">
            Período de Expiração
          </span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal bg-zinc-100 border-[#2a2b3d] text-zinc-500",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                      {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                    </>
                  ) : (
                    format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })
                  )
                ) : (
                  <span>Selecione um período</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-zinc-100 border-zinc-200" align="start">
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
            </PopoverContent>
          </Popover>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 