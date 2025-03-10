import { ThemeProvider } from "@/components/providers/theme-provider"
import { NotificationProvider } from "@/contexts/NotificationContext"
import { EstablishmentProvider } from "@/contexts/EstablishmentContext"
import { AuthProvider } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"
import type { Metadata } from "next"
import { Poppins } from "next/font/google"
import type React from "react"
import { VoucherNotificationProvider } from "@/contexts/VoucherNotificationContext"
import { Toaster } from "sonner"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
})


export const metadata: Metadata = {
  title: "Passport Gourmet Orlando",
  description: "Vouchers de descontos exclusivos em restaurantes de Orlando",
    generator: 'passportgourmetorlando.com'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-white font-sans antialiased", poppins.variable)} style={{ position: 'relative' }}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          storageKey="ntc-theme"
        >
          <AuthProvider>
            <NotificationProvider>
              <VoucherNotificationProvider>
                <EstablishmentProvider>
                  {children}
                  <Toaster />
                </EstablishmentProvider>
              </VoucherNotificationProvider>
            </NotificationProvider>
          </AuthProvider>
          
        </ThemeProvider>
      </body>
    </html>
  )
}



import './globals.css'
