"use client"

import * as React from "react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium text-[#e5e2e9]",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-[#1a1b2d] border-[#131320] hover:bg-[#1a1b2d]/80 p-0 text-[#e5e2e9]"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-[#7a7b9f] rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-[#1a1b2d]/50 [&:has([aria-selected])]:bg-[#1a1b2d] first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100 text-[#e5e2e9] hover:bg-[#1a1b2d]"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-[#7435db] text-[#e5e2e9] hover:bg-[#7435db] hover:text-[#e5e2e9] focus:bg-[#7435db] focus:text-[#e5e2e9]",
        day_today: "bg-[#1a1b2d] text-[#e5e2e9]",
        day_outside:
          "day-outside text-[#7a7b9f] opacity-50 aria-selected:bg-[#1a1b2d]/50 aria-selected:text-[#7a7b9f] aria-selected:opacity-30",
        day_disabled: "text-[#7a7b9f] opacity-50",
        day_range_middle:
          "aria-selected:bg-[#1a1b2d] aria-selected:text-[#e5e2e9]",
        day_hidden: "invisible",
        ...classNames,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
