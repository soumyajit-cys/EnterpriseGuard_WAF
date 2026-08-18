import type { Metadata } from "next"
import { IBM_Plex_Sans, JetBrains_Mono, Space_Grotesk } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"

const plex = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-plex",
  weight: ["400", "500", "600"],
})

const grotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-grotesk",
  weight: ["500", "600", "700"],
})

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  weight: ["400", "500", "700"],
})

export const metadata: Metadata = {
  title: "EnterpriseGuard WAF",
  description:
    "Web Application Firewall console — inspect every request, prove every block, control the rules.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="darkreader-lock" />
      </head>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
