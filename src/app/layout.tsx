import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CleanIndia QR - Smart Toilet Monitoring & Hygiene Feedback Platform",
  description: "QR-based hygiene monitoring system for public toilets. Enable instant feedback, staff tracking, and real-time monitoring for cleaner facilities.",
  keywords: ["CleanIndia", "QR Code", "Hygiene", "Toilet Monitoring", "Public Health", "Feedback System", "Cleanliness"],
  authors: [{ name: "CleanIndia QR Team" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "CleanIndia QR - Smart Toilet Monitoring",
    description: "QR-based hygiene monitoring system for cleaner public facilities",
    url: "https://chat.z.ai",
    siteName: "CleanIndia QR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CleanIndia QR - Smart Toilet Monitoring",
    description: "QR-based hygiene monitoring system for cleaner public facilities",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
