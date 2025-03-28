import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Loader({ className, ...props }: LoaderProps) {
  return (
    <Loader2
      className={cn("h-4 w-4 animate-spin", className)}
      {...props}
    />
  )
} 