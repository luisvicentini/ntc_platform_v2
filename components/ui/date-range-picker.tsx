"use client"
import { CalendarIcon } from "@radix-ui/react-icons"
import { format } from "date-fns"
import type { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DateRangePickerProps {
  dateRange: DateRange
  onDateRangeChange: (range: DateRange) => void
  predefinedRanges?: { label: string; value: Date[] }[]
}

export function DateRangePicker({ dateRange, onDateRangeChange, predefinedRanges = [] }: DateRangePickerProps) {
  return (
    <div className="grid gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal bg-[#1a1b2d] text-[#e5e2e9] border-[#7435db]",
              !dateRange && "text-[#7a7b9f]",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                </>
              ) : (
                format(dateRange.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-[#131320]" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={onDateRangeChange}
            numberOfMonths={2}
            className="bg-[#131320]"
          />
          {predefinedRanges && predefinedRanges.length > 0 && (
            <div className="grid grid-cols-2 gap-2 p-2">
              {predefinedRanges.map((range) => (
                <Button
                  key={range.label}
                  variant="outline"
                  className="text-xs bg-[#1a1b2d] text-[#e5e2e9] hover:bg-[#7435db] hover:text-[#e5e2e9]"
                  onClick={() => onDateRangeChange({ from: range.value[0], to: range.value[1] })}
                >
                  {range.label}
                </Button>
              ))}
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}

