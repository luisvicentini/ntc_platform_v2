
import Image from "next/image";

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="relative items-center justify-center w-[80px] h-[60px]">
        <Image
          src="/logo.svg"
          alt={`${process.env.NEXT_PUBLIC_APP_PROJECTNAME}`}
          fill
          className="object-contain p-1 text-black"
          priority
        />
      </div>      
    </div>
  )
}
