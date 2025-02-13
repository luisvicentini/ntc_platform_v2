
import Image from "next/image";

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-white p-1">
        <Image
          src="/ntc_logo.svg"
          alt="NTC"
          fill
          className="object-contain p-1 text-black"
          priority
        />
      </div>
      <span className="text-lg font-medium text-white md:inline hidden">Club</span>
    </div>
  )
}
