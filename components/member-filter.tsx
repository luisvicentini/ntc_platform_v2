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
import { cn } from "@/lib/utils"
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
          className="bg-[#131320] border-[#1a1b2d] hover:bg-[#1a1b2d] hover:border-[#7435db]"
        >
          <Filter className="h-4 w-4 text-[#7a7b9f]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[240px] bg-[#131320] border-[#1a1b2d]"
        forceMount
      >
        <DropdownMenuLabel className="text-[#e5e2e9] px-2 py-1.5">
          Status
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-[#1a1b2d]" />
        <DropdownMenuItem
          onClick={() => {
            onStatusChange("all")
            setOpen(false)
          }}
          className={cn(
            "cursor-pointer text-[#e5e2e9] hover:bg-[#1a1b2d] focus:bg-[#1a1b2d] focus:text-[#e5e2e9]",
            statusFilter === "all" && "bg-[#1a1b2d]"
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
            "cursor-pointer text-[#e5e2e9] hover:bg-[#1a1b2d] focus:bg-[#1a1b2d] focus:text-[#e5e2e9]",
            statusFilter === "active" && "bg-[#1a1b2d]"
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
            "cursor-pointer text-[#e5e2e9] hover:bg-[#1a1b2d] focus:bg-[#1a1b2d] focus:text-[#e5e2e9]",
            statusFilter === "inactive" && "bg-[#1a1b2d]"
          )}
        >
          Inativos
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="bg-[#1a1b2d]" />
        <div className="p-3">
          <span className="text-sm text-[#e5e2e9] mb-2 block">
            Período de Expiração
          </span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal bg-[#1a1b2d] border-[#2a2b3d] text-[#e5e2e9]",
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
            <PopoverContent className="w-auto p-0 bg-[#131320] border-[#1a1b2d]" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={onDateRangeChange}
                numberOfMonths={2}
                locale={ptBR}
                className="bg-[#131320]"
              />
            </PopoverContent>
          </Popover>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 