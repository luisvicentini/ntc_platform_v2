import { Award } from "lucide-react"

const clubName = process.env.NEXT_PUBLIC_APP_PROJECTNAME

export function FeaturedBadge() {
  return (
    <div className="top-2 right-2 bg-primary text-white px-2 py-1 rounded-full text-xs flex items-center">
      <Award className="w-3 h-3 mr-1 fill-current" />
      Selo: {clubName}
    </div>
  )
}
