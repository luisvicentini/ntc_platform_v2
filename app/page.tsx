import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-[#0f0f1a]">
      <h1 className="text-4xl font-bold mb-6 text-[#e5e2e9]">Bem-vindo à NTC Platform</h1>
      <p className="text-xl mb-8 text-[#b5b6c9]">Escolha seu perfil para continuar:</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/member/feed">
          <Button className="w-full bg-[#7435db] hover:bg-[#a85fdd] text-[#ffffff]">Membro</Button>
        </Link>
        <Link href="/business/dashboard">
          <Button className="w-full bg-[#7435db] hover:bg-[#a85fdd] text-[#ffffff]">Estabelecimento</Button>
        </Link>
        <Link href="/partner/dashboard">
          <Button className="w-full bg-[#7435db] hover:bg-[#a85fdd] text-[#ffffff]">Parceiro</Button>
        </Link>
        <Link href="/master/dashboard">
          <Button className="w-full bg-[#7435db] hover:bg-[#a85fdd] text-[#ffffff]">Administrador</Button>
        </Link>
      </div>
    </div>
  )
}

