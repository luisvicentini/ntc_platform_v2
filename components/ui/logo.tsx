export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ntc-purple">
        <span className="text-lg font-bold text-white">NT</span>
      </div>
      <span className="text-lg font-semibold text-ntc-purple md:inline hidden">NTC Platform</span>
    </div>
  )
}

