import { Star } from "lucide-react"

export function FeaturedBadge() {
  return (
    <div className="absolute top-2 right-2 bg-[#7435db] text-white px-2 py-1 rounded-full text-xs flex items-center">
      <Star className="w-3 h-3 mr-1 fill-current" />
      Destaque
    </div>
  )
}

