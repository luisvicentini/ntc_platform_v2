"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface BusinessHoursProps {
  value: string
  onChange: (value: string) => void
  label?: string
}

// Gerar horários de 30 em 30 minutos
const generateTimeOptions = () => {
  const times = []
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const formattedHour = hour.toString().padStart(2, "0")
      const formattedMinute = minute.toString().padStart(2, "0")
      times.push(`${formattedHour}:${formattedMinute}`)
    }
  }
  return times
}

const timeOptions = generateTimeOptions()

export function BusinessHours({ value, onChange, label = "Horário de Funcionamento" }: BusinessHoursProps) {
  const [startTime, setStartTime] = useState(value?.split(" às ")[0] || "")
  const [endTime, setEndTime] = useState(value?.split(" às ")[1] || "")

  const handleTimeChange = (type: "start" | "end", time: string) => {
    if (type === "start") {
      setStartTime(time)
      if (endTime) {
        onChange(`${time} às ${endTime}`)
      }
    } else {
      setEndTime(time)
      if (startTime) {
        onChange(`${startTime} às ${time}`)
      }
    }
  }

  return (
    <div className="grid grid-cols-4 items-center gap-4">
      <Label className="text-right">{label}</Label>
      <div className="col-span-3 flex gap-4 items-center">
        <Select
          value={startTime}
          onValueChange={(value) => handleTimeChange("start", value)}
        >
          <SelectTrigger className="w-[180px] border-zinc-200">
            <SelectValue placeholder="Horário inicial" />
          </SelectTrigger>
          <SelectContent className="border-zinc-200">
            {timeOptions.map((time) => (
              <SelectItem 
                key={time} 
                value={time}
                className="hover:bg-zinc-100 "
              >
                {time}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="text-zinc-400">às</span>

        <Select
          value={endTime}
          onValueChange={(value) => handleTimeChange("end", value)}
        >
          <SelectTrigger className="w-[180px] border-zinc-200">
            <SelectValue placeholder="Horário final" />
          </SelectTrigger>
          <SelectContent className="border-zinc-200">
            {timeOptions.map((time) => (
              <SelectItem 
                key={time} 
                value={time}
                className="hover:bg-zinc-100 "
              >
                {time}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
