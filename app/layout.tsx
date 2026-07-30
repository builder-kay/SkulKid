import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import { PwaExperience } from "@/components/pwa/pwa-experience";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap"
});

export const metadata: Metadata = {
  applicationName: "SkulKid",
  title: {
    default: "SkulKid",
    template: "%s | SkulKid"
  },
  description: "A gamified learning foundation for primary school students.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SkulKid"
  },
  formatDetection: {
    telephone: false
  },
  icons: {
    icon: [
      { url: "/pwa/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/pwa/icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [{ url: "/pwa/apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#2563eb",
  colorScheme: "light"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={plusJakarta.variable}>
        {children}
        <PwaExperience />
        <Script
          id="pushalert-unified"
          src="https://cdn.pushalert.co/unified_e34bec8a86a6ffbe16e5ff6e395375d5.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
