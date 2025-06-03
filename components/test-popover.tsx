"use client"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function TestPopover() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Abrir Popover</Button>
      </PopoverTrigger>
      <PopoverContent>
        <div>Conteúdo do Popover</div>
      </PopoverContent>
    </Popover>
  )
} 