import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Fraunces } from "next/font/google";
import { ServiceWorkerRegister } from "@/components/sw-register";
import { DealsProvider } from "@/context/deals-context";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Publix BOGO Tracker",
  description: "Track Publix Buy One Get One deals at your local store",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BOGO Tracker",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#3b7d23",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${jakarta.variable} ${fraunces.variable} antialiased bg-background`}>
        <ServiceWorkerRegister />
        <DealsProvider>
          {children}
        </DealsProvider>
      </body>
    </html>
  );
}
