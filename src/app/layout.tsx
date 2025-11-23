import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";
import { QueryProvider } from "@/lib/query-provider";
import { RefetchProvider } from "@/lib/refetch-context";
import { ToastRedirectHandler } from "@/components/ui/toast-redirect-handler";
import { AuthRedirectGuard } from "@/components/auth-guard";
import { AuthProvider } from "@/lib/auth-context";
import { Suspense } from "react";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "EDU Apps",
  description: "EDU Apps",
  icons: {
    icon: "/favicon.png",
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
        className={`${inter.variable} antialiased bg-lightest dark:bg-lightest`}
      >
        <QueryProvider>
          <AuthProvider>
            <RefetchProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="light"
                enableSystem={false}
              >
                <AuthRedirectGuard />
                {children}
                <Toaster />
                <Suspense fallback={null}>
                  <ToastRedirectHandler />
                </Suspense>
              </ThemeProvider>
            </RefetchProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
