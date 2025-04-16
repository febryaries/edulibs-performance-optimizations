import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google"
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/lib/auth-context"
import { QueryProvider } from "@/lib/query-provider";
import { RefetchProvider } from "@/lib/refetch-context";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "EDU Apps",
  description: "EDU Apps",
  icons: {
    icon: "/favicon.png"
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} antialiased bg-lightest dark:bg-lightest`}
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <AuthProvider>
            <QueryProvider>
              <RefetchProvider>
                {children}
              </RefetchProvider>
            </QueryProvider>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
