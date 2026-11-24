import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/layout/toaster";
import { OfflineBanner } from "@/components/layout/offline-banner";
import { SiteHeader } from "@/components/layout/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "SmartPrep — Private AI study sets, quizzes, and flashcards",
    template: "%s · SmartPrep",
  },
  description:
    "A free account is required to create private study sets from PDFs or pasted notes. Generate and edit AI multiple-choice questions, practice with scored quizzes and SM-2 flashcards, track analytics, and print exam sheets with answer keys.",
  applicationName: "SmartPrep",
  openGraph: {
    title: "SmartPrep — Private AI study sets, quizzes, and flashcards",
    description:
      "Create private study sets from PDFs or pasted notes, practice with AI-generated quizzes and SM-2 flashcards, track progress, and print exam sheets with answer keys.",
    siteName: "SmartPrep",
    type: "website",
  },
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
