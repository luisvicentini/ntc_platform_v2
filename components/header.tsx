"use client"

import { Logo } from "./ui/logo"
import { Button } from "./ui/button"
import Link from "next/link"
import { LogOut, Bell, MoonIcon, SunIcon } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { useNotification } from "@/contexts/NotificationContext"
import { useAuth } from "@/contexts/auth-context"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { RatingCard } from "./rating-card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import React from "react"
import { cn } from "@/lib/utils/utils"
import { usePathname } from "next/navigation"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface MenuItem {
  href: string
  icon: React.ReactNode
  label: string
  isActive?: boolean
}

interface HeaderProps {
  menuItems?: MenuItem[]
}

interface UserDropdownProps {
  userData: {
    displayName: string;
    email: string;
    photoURL: string;
  };
  user: any;
  theme?: string;
  setTheme: (theme: string) => void;
}

const UserDropdown: React.FC<UserDropdownProps> = ({ userData, user, theme = "dark", setTheme }) => {
  const { signOut } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false)
  
  const handleLogout = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage 
              src={userData.photoURL || user?.photoURL || undefined} 
              alt={userData.displayName || user?.displayName || "User"}
              referrerPolicy="no-referrer"
            />
            <AvatarFallback>{userData.displayName?.charAt(0) || user?.displayName?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-white border-zinc-200 text-zinc-500" align="end">
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-1 leading-none">
            <p className="font-medium truncate max-w-[180px]">{userData.displayName || user?.displayName || "Nome não informado"}</p>
            <p className="text-sm text-zinc-400 truncate max-w-[180px]">{userData.email || user?.email || "Email não informado"}</p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Link href={`/${user?.userType}/profile`}>Editar Perfil</Link>
        </DropdownMenuItem>
        {/* <DropdownMenuItem onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
          {theme === "light" ? <MoonIcon className="mr-2 h-4 w-4" /> : <SunIcon className="mr-2 h-4 w-4" />}
          <span>{theme === "light" ? "Modo Escuro" : "Modo Claro"}</span>
        </DropdownMenuItem> */}
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="cursor-pointer" 
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const NotificationButton: React.FC<{ isOpen: boolean; onOpenChange: (open: boolean) => void; notifications: any[]; removeNotification: (id: string) => void }> = ({ 
  isOpen, 
  onOpenChange, 
  notifications, 
  removeNotification 
}) => (
  <Sheet open={isOpen} onOpenChange={onOpenChange}>
    <SheetTrigger asChild>
      <Button variant="ghost" size="sm" className="relative hover:bg-zinc-100 hover:text-zinc-500">
        <Bell className="h-5 w-5 text-zinc-500" />
        {notifications.length > 0 && <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500" />}
      </Button>
    </SheetTrigger>
    <SheetContent className="w-[400px] bg-zinc-100 border-zinc-200 text-zinc-500 overflow-y-auto">
      <SheetHeader>
        <SheetTitle className="text-zinc-500">Notificações</SheetTitle>
      </SheetHeader>
      <div className="mt-6 space-y-4">
        {notifications.map((notification) => (
          <RatingCard
            key={notification.id}
            establishmentId={notification.establishmentId}
            establishmentName={notification.establishmentName}
            notificationId={notification.id}
            onRate={() => removeNotification(notification.id)}
          />
        ))}
        {notifications.length === 0 && <p className="text-center text-zinc-400">Não há notificações no momento.</p>}
      </div>
    </SheetContent>
  </Sheet>
)

export function Header({ menuItems = [] }: HeaderProps) {
  const { user } = useAuth()
  const { notifications, removeNotification } = useNotification()
  const [isOpen, setIsOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()
  const [userData, setUserData] = useState({
    displayName: "",
    email: "",
    photoURL: "",
  })

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return

      try {
        const userRef = doc(db, "users", user.uid)
        const userSnap = await getDoc(userRef)

        if (userSnap.exists()) {
          const data = userSnap.data()
          setUserData({
            displayName: data.name || "",
            email: data.email || "",
            photoURL: data.photoURL || "",
          })
        }
      } catch (error) {
        console.error("Erro ao buscar dados do usuário:", error)
      }
    }

    fetchUserData()
  }, [user])

  return (
    <>
      {/* Desktop Header */}
      <header className="border-b bg-white border-zinc-200 hidden md:block">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Logo />

            <nav className="flex-1 flex justify-center space-x-1">
              {menuItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "flex items-center space-x-2",
                      pathname === item.href
                        ? "bg-zinc-100 text-zinc-500"
                        : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-500",
                    )}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Button>
                </Link>
              ))}
            </nav>

            <div className="flex items-center space-x-4">
              <NotificationButton 
                isOpen={isOpen}
                onOpenChange={setIsOpen}
                notifications={notifications}
                removeNotification={removeNotification}
              />
              <UserDropdown 
                userData={userData}
                user={user}
                theme={theme}
                setTheme={setTheme}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Footer */}
      <footer className="fixed bottom-0 left-0 right-0 border-t bg-white border-zinc-200 md:hidden z-50">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="relative w-[60px]">
              <Logo />
            </div>

            <nav className="flex items-center space-x-2">
              {menuItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    size="default"
                    className={cn(pathname === item.href ? "bg-zinc-100 text-zinc-500" : "text-zinc-500")}
                  >
                    {item.icon}
                  </Button>
                </Link>
              ))}
              <NotificationButton 
                isOpen={isOpen}
                onOpenChange={setIsOpen}
                notifications={notifications}
                removeNotification={removeNotification}
              />
            </nav>
            <div className="relative w-[60px]">
              <UserDropdown 
                userData={userData}
                user={user}
                theme={theme}
                setTheme={setTheme}
                />
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
