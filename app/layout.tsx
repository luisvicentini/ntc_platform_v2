import { ThemeProvider } from "@/components/providers/theme-provider"
import { NotificationProvider } from "@/contexts/NotificationContext"
import { EstablishmentProvider } from "@/contexts/EstablishmentContext"
import { cn } from "@/lib/utils"
import "@/styles/globals.css"
import type { Metadata } from "next"
import { Poppins } from "next/font/google"
import type React from "react"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
})

export const metadata: Metadata = {
  title: "NTC Platform",
  description: "Plataforma de gerenciamento de vouchers e estabelecimentos",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased", poppins.variable)}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} storageKey="ntc-theme">
          <NotificationProvider>
            <EstablishmentProvider>{children}</EstablishmentProvider>
          </NotificationProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}



import './globals.css'