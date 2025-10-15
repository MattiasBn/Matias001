import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

import { AuthProvider } from "@/context/AuthContext";
import { CookiesProvider } from "next-client-cookies/server";
import { ThemeProvider } from "@/components/animacao/ThemeProvider";
import { RouteTransition } from "@/components/layout/RouteTransition"; // Importe a transição

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MatiaSistem",
  description: "Sistemas Profisional",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br" suppressHydrationWarning>
      <body className={inter.className}>
        <CookiesProvider>
          <AuthProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
               <Toaster richColors position="top-right" />
                <RouteTransition>
                  {children}
                </RouteTransition>
            </ThemeProvider>
          </AuthProvider>
        </CookiesProvider>
      </body>
    </html>
  );
}