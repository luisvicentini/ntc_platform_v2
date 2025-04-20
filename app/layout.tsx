import { ThemeProvider } from "@/components/providers/theme-provider"
import { NotificationProvider } from "@/contexts/NotificationContext"
import { EstablishmentProvider } from "@/contexts/EstablishmentContext"
import { AuthProvider } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"
import type { Metadata } from "next"
import { Poppins, Dela_Gothic_One } from "next/font/google"
import type React from "react"
import { VoucherNotificationProvider } from "@/contexts/VoucherNotificationContext"
import { Toaster } from "sonner"
import Script from "next/script"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
})

const delaGothicOne = Dela_Gothic_One({
  subsets: ["latin-ext"],
  weight: ["400"],
  variable: "--font-dela-gothic-one",
})

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_PROJECTNAME,
  description: "O único clube que te dá descontos nos melhores restaurantes de São Paulo",
  generator: "naotemchef.com.br",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="O único clube que te dá descontos nos melhores restaurantes de São Paulo" />
        <meta name="keywords" content="clube, restaurante, desconto, São Paulo" />
        <meta name="author" content="Naotemchef" />
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />
        <meta name="google" content="nosite:naotemchef.com.br" />
      </head>
      <body
        className={cn("min-h-screen bg-white font-sans antialiased", poppins.variable, delaGothicOne.variable)}
        style={{ position: "relative" }}
      >
        {/* Google Analytics */}
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-JH97KMXGDP" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-JH97KMXGDP');
          `}
        </Script>

        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="theme">
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

import "./globals.css"
