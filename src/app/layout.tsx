import type { Metadata, Viewport } from "next"
import Script from "next/script"
import { Barlow, IBM_Plex_Mono, Saira_Condensed } from "next/font/google"
import "./globals.css"

// Condensed and fast, like the lettering on an instrument cluster.
const display = Saira_Condensed({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "700", "800"],
})

const sans = Barlow({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
})

// Telemetry: readouts, labels, the odometer.
const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
})

export const metadata: Metadata = {
  title: "Vedh Pokharkar · Software engineer",
  description: "Vedh Pokharkar is a software engineer who builds fast, dependable software, and likes night skies, long roads and fast machines.",
}

export const viewport: Viewport = {
  themeColor: "#0b0c0e",
  // A dark cockpit by design: it stays dark even when the device is in light mode.
  colorScheme: "dark",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // Browser extensions often add attributes to <html> before React hydrates; ignore those.
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <body>
        {/* Decide before hydration whether the ignition sequence plays (once per session). */}
        <Script id="intro-gate" strategy="beforeInteractive">
          {"try{if(sessionStorage.getItem('vp-intro'))document.documentElement.dataset.intro='skip';else sessionStorage.setItem('vp-intro','1')}catch(e){document.documentElement.dataset.intro='skip'}"}
        </Script>
        {children}
      </body>
    </html>
  )
}
