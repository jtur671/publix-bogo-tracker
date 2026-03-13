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
  title: "Publix BOGO Tracker — Never Miss a Deal Again",
  description:
    "Track every Publix Buy One Get One deal automatically. Build your shopping list, get matched to BOGO deals, and shop smarter with Shop Mode. Free, no account required.",
  openGraph: {
    title: "Stop leaving free groceries on the shelf",
    description:
      "Publix runs 100+ BOGO deals every week. This app matches them to your shopping list automatically — so you never miss a deal you actually want.",
    type: "website",
    siteName: "Publix BOGO Tracker",
  },
  twitter: {
    card: "summary_large_image",
    title: "Stop leaving free groceries on the shelf",
    description:
      "Track every Publix BOGO deal. Match your shopping list. Save money every single week.",
  },
  keywords: [
    "Publix BOGO",
    "Publix deals",
    "Buy One Get One",
    "grocery deals",
    "Publix shopping list",
    "grocery savings",
    "Publix app",
    "BOGO tracker",
  ],
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
