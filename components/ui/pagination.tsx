"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

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
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="bg-[#1a1b2d] text-[#e5e2e9] border-[#131320]"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {renderPageNumbers().map((page, index) => (
        typeof page === "number" ? (
          <Button
            key={index}
            variant={currentPage === page ? "default" : "outline"}
            onClick={() => onPageChange(page)}
            className={currentPage === page ? 
              "bg-[#7435db] text-white hover:bg-[#7435db]/90" : 
              "bg-[#1a1b2d] text-[#e5e2e9] border-[#131320]"
            }
          >
            {page}
          </Button>
        ) : (
          <span key={index} className="text-[#7a7b9f]">...</span>
        )
      ))}

      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="bg-[#1a1b2d] text-[#e5e2e9] border-[#131320]"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
