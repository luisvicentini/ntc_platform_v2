"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface PaginationProps {
  onPageChange?: (page: number) => void
  currentPage: number
  className?: string
}

export function PaginationPrevious({
  onPageChange,
  currentPage,
  className,
  ...props
}: PaginationProps) {
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => onPageChange?.(currentPage - 1)}
      disabled={currentPage === 1}
      className={cn("bg-zinc-100 text-zinc-500 border-zinc-200", className)}
      {...props}
    >
      <ChevronLeft className="h-4 w-4" />
    </Button>
  )
}

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  const renderPageNumbers = () => {
    const maxVisiblePages = 5
    const halfVisible = Math.floor(maxVisiblePages / 2)
    let startPage = Math.max(currentPage - halfVisible, 1)
    let endPage = Math.min(startPage + maxVisiblePages - 1, totalPages)

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(endPage - maxVisiblePages + 1, 1)
    }

    const pageNumbers = []

    if (startPage > 1) {
      pageNumbers.push(1)
      if (startPage > 2) {
        pageNumbers.push("...")
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i)
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pageNumbers.push("...")
      }
      pageNumbers.push(totalPages)
    }

    return pageNumbers
  }

  return (
    <div className="flex items-center space-x-2">
      <PaginationPrevious
        onPageChange={onPageChange}
        currentPage={currentPage}
        className="bg-zinc-100 text-zinc-500 border-zinc-200 hover:bg-zinc-200 hover:text-zinc-500 p-2"
      />

      {renderPageNumbers().map((page, index) => (
        typeof page === "number" ? (
          <Button
            key={index}
            variant={currentPage === page ? "default" : "outline"}
            onClick={() => onPageChange(page)}
            className={currentPage === page ? 
              "bg-primary text-white hover:bg-primary/90 " : 
              "bg-zinc-100 text-zinc-500 border-zinc-200 hover:bg-zinc-200 hover:text-zinc-500"
            }
          >
            {page}
          </Button>
        ) : (
          <span key={index} className="text-zinc-400">...</span>
        )
      ))}

      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="bg-zinc-100 text-zinc-500 border-zinc-200 hover:bg-zinc-200 hover:text-zinc-500 p-2"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
