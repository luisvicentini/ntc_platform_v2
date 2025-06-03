import { ThemeProvider } from "@/components/providers/theme-provider"
import { NotificationProvider } from "@/contexts/NotificationContext"
import { EstablishmentProvider } from "@/contexts/EstablishmentContext"
import { AuthProvider } from "@/contexts/auth-context"
import { cn } from "@/lib/utils/utils"
import type { Metadata } from "next"
import { Poppins, Dela_Gothic_One, Archivo_Black } from "next/font/google"
import type React from "react"
import { VoucherNotificationProvider } from "@/contexts/VoucherNotificationContext"
import { Toaster } from "sonner"
import Script from "next/script"
import { Analytics } from "@vercel/analytics/react"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
})

const fontPrimaryNTC = Archivo_Black({
  subsets: ["latin-ext"],
  weight: ["400"],
  variable: "--font-primary-ntc",
})


export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_PROJECTNAME,
  description: "O único clube de vantagens que te dá descontos de até 50% nos melhores restaurantes de verdade",
  generator: "naotemchef.com.br",
  icons: {
    icon: '/favicon.ico',
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: process.env.NEXT_PUBLIC_APP_PROJECTNAME,
    description: "O único clube de vantagens que te dá descontos de até 50% nos melhores restaurantes de verdade",
    url: 'https://naotemchef.com.br',
    siteName: 'Não Tem Chef',
    images: [
      {
        url: '/homepage/capa-seo.jpg',
        width: 1200,
        height: 630,
        alt: 'Não Tem Chef - Clube de vantagens para restaurantes',
      },
    ],
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: process.env.NEXT_PUBLIC_APP_PROJECTNAME,
    description: "O único clube de vantagens que te dá descontos de até 50% nos melhores restaurantes de verdade",
    images: ['/homepage/capa-seo.jpg'],
    creator: '@naotemchef',
    site: '@naotemchef',
  },
  alternates: {
    canonical: 'https://naotemchef.com.br',
  },
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
        className={cn("min-h-screen bg-white font-sans antialiased", poppins.variable, fontPrimaryNTC.variable)}
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

        {/* Meta Pixel Code */}
        <Script id="facebook-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${process.env.NEXT_PUBLIC_META_PIXEL_ID || ""}');
            fbq('track', 'PageView');
          `}
        </Script>

        <Script id="hotjar-script" strategy="afterInteractive">
          {`
            (function(h,o,t,j,a,r){
                h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
                h._hjSettings={hjid:6424062,hjsv:6};
                a=o.getElementsByTagName('head')[0];
                r=o.createElement('script');r.async=1;
                r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
                a.appendChild(r);
            })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
          `}
        </Script>
        
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src={`https://www.facebook.com/tr?id=${process.env.NEXT_PUBLIC_META_PIXEL_ID || ""}&ev=PageView&noscript=1`}
            alt=""
          />
        </noscript>
        {/* End Meta Pixel Code */}

        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="theme">
          <AuthProvider>
            <NotificationProvider>
              <VoucherNotificationProvider>
                <EstablishmentProvider>
                  <Analytics />
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
