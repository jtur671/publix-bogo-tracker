import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Fraunces } from "next/font/google";
import Script from "next/script";
import { ServiceWorkerRegister } from "@/components/sw-register";
import { AuthProvider } from "@/context/auth-context";
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
  title: "Publix BOGO — The Smartest Shopping List for Publix",
  description:
    "The smartest shopping list for Publix shoppers. Add your items, see which ones are on BOGO or sale, and shop with a built-in checklist. Free, no account required.",
  openGraph: {
    title: "The smartest shopping list for Publix shoppers",
    description:
      "Add your grocery items, get matched to 100+ weekly deals automatically, and shop with a built-in checklist. Save money every single week.",
    type: "website",
    siteName: "Publix BOGO",
  },
  twitter: {
    card: "summary_large_image",
    title: "The smartest shopping list for Publix shoppers",
    description:
      "Your shopping list + automatic deal matching. Save money on every Publix trip.",
  },
  keywords: [
    "Publix BOGO",
    "Publix shopping list",
    "Publix deals",
    "Buy One Get One",
    "grocery deals",
    "grocery savings",
    "Publix app",
    "smart shopping list",
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Publix BOGO",
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
      <Script
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXX"
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />
      <body className={`${jakarta.variable} ${fraunces.variable} antialiased bg-background`}>
        <ServiceWorkerRegister />
        <AuthProvider>
          <DealsProvider>
            {children}
          </DealsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
