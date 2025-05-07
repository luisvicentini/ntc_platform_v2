"use client"

import { Logo } from "./ui/logo"
import { Button } from "./ui/button"
import Link from "next/link"
import { LogOut, Bell, MoonIcon, SunIcon, User } from "lucide-react"
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
import Image from "next/image"
// Objeto com cores para as letras do alfabeto
const avatarColors = {
  A: "bg-red-500 text-white",     // Vermelho
  B: "bg-blue-500 text-white",    // Azul
  C: "bg-green-500 text-white",   // Verde
  D: "bg-yellow-500 text-black",  // Amarelo
  E: "bg-purple-500 text-white",  // Roxo
  F: "bg-pink-500 text-white",    // Rosa
  G: "bg-indigo-500 text-white",  // Índigo
  H: "bg-orange-500 text-white",  // Laranja
  I: "bg-teal-500 text-white",    // Teal
  J: "bg-red-500 text-white",     // Vermelho
  K: "bg-blue-500 text-white",    // Azul
  L: "bg-green-500 text-white",   // Verde
  M: "bg-yellow-500 text-black",  // Amarelo
  N: "bg-purple-500 text-white",  // Roxo
  O: "bg-pink-500 text-white",    // Rosa
  P: "bg-indigo-500 text-white",  // Índigo
  Q: "bg-orange-500 text-white",  // Laranja
  R: "bg-teal-500 text-white",    // Teal
  S: "bg-cyan-500 text-white",    // Ciano
  T: "bg-lime-500 text-black",    // Lima
  U: "bg-red-500 text-white",     // Vermelho
  V: "bg-blue-500 text-white",    // Azul
  W: "bg-green-500 text-white",   // Verde
  X: "bg-yellow-500 text-black",  // Amarelo
  Y: "bg-purple-500 text-white",  // Roxo
  Z: "bg-pink-500 text-white",    // Rosa
};

// Função para obter a classe de cor com base na primeira letra do nome
const getAvatarColorClass = (name: string | undefined | null): string => {
  if (!name) return "bg-zinc-500 text-white"; // Cor padrão
  const firstChar = name.charAt(0).toUpperCase() as keyof typeof avatarColors;
  return avatarColors[firstChar] || "bg-zinc-500 text-white"; // Retorna a cor correspondente ou a cor padrão
};

interface MenuItem {
  href: string
  icon: React.ReactNode
  label: string
  isActive?: boolean
  onClick?: () => void
}

interface HeaderProps {
  menuItems?: MenuItem[]
  pageTitle?: string;
  rightContent?: React.ReactNode;
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

interface MobileFooterProps {
  menuItems: MenuItem[];
  userData: any;
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
  
  // Obter a cor de fundo do avatar com base no nome
  const nameForColor = userData.displayName || user?.displayName;
  const avatarColorClass = getAvatarColorClass(nameForColor);
  
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
            <AvatarFallback className={avatarColorClass}>{userData.displayName?.charAt(0) || user?.displayName?.charAt(0) || "U"}</AvatarFallback>
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
      <Button variant="ghost" size="sm" className="relative hover:bg-zinc-100 hover:text-zinc-500 rounded-xl">
        <Bell className="h-5 w-5 text-zinc-500" />
        {notifications.length > 0 && <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500" />}
      </Button>
    </SheetTrigger>
    <SheetContent className="w-[400px] max-sm:w-[320px] bg-zinc-100 border-zinc-200 text-zinc-500 overflow-y-auto">
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



// Novo componente para o Header Mobile
const MobileHeader: React.FC<{
  userData: any; 
  user: any; 
  isOpen: boolean; 
  onOpenChange: (open: boolean) => void; 
  notifications: any[]; 
  removeNotification: (id: string) => void; 
  pageTitle?: string;
  rightContent?: React.ReactNode;
  theme?: string;
  setTheme?: (theme: string) => void;
}> = ({ 
  userData, 
  user, 
  isOpen, 
  onOpenChange, 
  notifications, 
  removeNotification,
  theme,
  setTheme,
  pageTitle = "Home",
  rightContent
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 border-b bg-white border-zinc-200 md:hidden z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
           
          {/* Logo */}
          <div className="w-1/3 flex justify-start">
            <div className="relative w-[60px]">
              <Logo />
            </div>
          </div> 

          <div className="w-1/3 flex justify-center">
            {/* Título da página */}
            <h1 className="text-lg font-semibold text-zinc-700 text-center">
              {pageTitle}
            </h1>
          </div>

          {/* Avatar e nome do usuário */}
          <div className="w-1/3 flex justify-end space-x-2">
            {rightContent && (
              <div className="mr-2">{rightContent}</div>
            )}
            <NotificationButton 
              isOpen={isOpen}
              onOpenChange={onOpenChange}
              notifications={notifications}
              removeNotification={removeNotification}
            />

            <UserDropdown 
              userData={userData}
              user={user}
              theme={theme}
              setTheme={setTheme || (() => {})}
            />
          </div>

        </div>
      </div>
    </header>
  );
};

// Componente de Footer Mobile
const MobileFooter: React.FC<MobileFooterProps> = ({ menuItems, userData, user, theme, setTheme }) => {
  const pathname = usePathname();
  
  // Obter a cor de fundo do avatar com base no nome
  const nameForColor = userData.displayName || user?.displayName;
  const avatarColorClass = getAvatarColorClass(nameForColor);
  
  return (
    <footer className="fixed bottom-0 left-0 right-0 border-t bg-white border-zinc-200 md:hidden z-50">
      <div className="container mx-auto px-4 py-2">
        <div className="flex h-16 items-center justify-between">

          {/* Menu de navegação */}
          <div className="w-full justify-between z-10">
            <nav className="flex justify-between space-x-2"> 
              {menuItems.map((item) => (
                item.onClick ? (
                  <div className="flex flex-col items-center">
                    <Button
                      key={item.href}
                      variant="ghost"
                      size="default"
                      className={cn(
                        pathname === item.href ? "bg-zinc-100 text-zinc-500 rounded-xl text-xl flex flex-col items-center justify-center" : "text-zinc-400 hover:text-zinc-500 rounded-xl text-lg flex flex-col items-center justify-center"
                      )}
                      onClick={item.onClick}
                    >
                      {item.icon}
                      </Button>
                      <span className="text-[8px] text-zinc-400">{item.label}</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant="ghost"
                        size="default"
                        className={cn(
                          pathname === item.href ? "bg-zinc-100 text-zinc-500 rounded-xl text-xl flex flex-col items-center justify-between" : "text-zinc-400 hover:text-zinc-500 rounded-xl text-lg flex flex-col items-center justify-center"
                        )}
                      >
                        {item.icon}
                      </Button>
                    </Link>
                    <span className="text-[8px] text-zinc-400">{item.label}</span>
                  </div>
                )
              ))}
            </nav>
          </div>

        </div>
      </div>
    </footer>
  );
};

export function Header({ menuItems = [], pageTitle = "Home", rightContent }: HeaderProps) {
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

  // Determinar o título da página com base na rota atual (se não for fornecido)
  const determinePageTitle = () => {
    if (pageTitle !== "Home") return pageTitle;
    
    const pathSegments = pathname.split('/').filter(Boolean);
    if (pathSegments.length > 0) {
      const lastSegment = pathSegments[pathSegments.length - 1];
      // Capitalizar a primeira letra e substituir hífens por espaços
      return lastSegment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    return "Home";
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return

      try {
        const userRef = doc(db, "users", user.uid)
        const userSnap = await getDoc(userRef)

        if (userSnap.exists()) {
          const data = userSnap.data()
          setUserData({
            displayName: data.name || data.displayName || "",
            email: data.email || "",
            photoURL: data.photoURL || "",
          })
        }
      } catch (error) {
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
                item.onClick ? (
                  <Button
                    key={item.href}
                    variant="ghost"
                    className={cn(
                      "flex items-center space-x-2",
                      pathname === item.href
                        ? "bg-zinc-100 text-zinc-500 rounded-xl"
                        : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-500 hover:rounded-xl",
                    )}
                    onClick={item.onClick}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Button>
                ) : (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "flex items-center space-x-2",
                        pathname === item.href
                          ? "bg-zinc-100 text-zinc-500 rounded-xl"
                          : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-500 hover:rounded-xl",
                      )}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Button>
                  </Link>
                )
              ))}
            </nav>

            <div className="flex items-center space-x-4">
              {/* Botão para entrar na comunidade */}
              {rightContent && (
                <div className="mr-2">{rightContent}</div>
              )}

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

      {/* Mobile Header*/}
      <MobileHeader 
        userData={userData}
        user={user}
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        notifications={notifications}
        removeNotification={removeNotification}
        pageTitle={determinePageTitle()}
        rightContent={rightContent}
        theme={theme}
        setTheme={setTheme}
      />

      {/* Mobile Footer */}
      <MobileFooter 
        menuItems={menuItems}
        userData={userData}
        user={user}
        theme={theme}
        setTheme={setTheme}
      />
      
      {/* Adicionar espaço para compensar o header e footer fixos no mobile */}
      <div className="md:hidden pb-0 pt-16" />
    </>
  )
}
