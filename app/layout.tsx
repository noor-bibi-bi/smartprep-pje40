import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/layout/toaster";
import { OfflineBanner } from "@/components/layout/offline-banner";
import { SiteHeader } from "@/components/layout/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "SmartPrep — Turn any PDF into a quiz in seconds",
    template: "%s · SmartPrep",
  },
  description:
    "Upload lecture slides or paste study notes and SmartPrep instantly generates multiple-choice quizzes, flashcards, and spaced repetition study sets — powered by Groq AI.",
  applicationName: "SmartPrep",
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7F5EF" },
    { media: "(prefers-color-scheme: dark)", color: "#13101F" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <OfflineBanner />
          <SiteHeader />
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
