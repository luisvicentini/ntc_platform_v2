
import Image from "next/image";

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="relative w-[150px] h-[80px] items-center justify-center">
        <Image
          src="/logo.svg"
          alt="Passport Gourmet Orlando"
          fill
          className="object-contain p-1 text-black"
          priority
        />
      </div>      
    </div>
  )
}
