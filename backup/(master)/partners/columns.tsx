"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { MoreHorizontal } from "lucide-react"
import type { Partner } from "./types" // Import the Partner type

export const columns: ColumnDef<Partner>[] = [
  {
    accessorKey: "name",
    header: "Nome",
  },
  {
    accessorKey: "establishments",
    header: "Estabelecimentos",
  },
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const partner = row.original

      return (
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      )
    },
  },
]

