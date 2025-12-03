import type { Metadata } from "next";
//import { Inter } from "next/font/google";

import "./globals.css";
import { Toaster } from "sonner";
//import {ReactNode} from  "react";
import { SettingsProvider} from "@/context/SettingsContext";
import { AuthProvider } from "@/context/AuthContext";
import { CookiesProvider } from "next-client-cookies/server";
import { ThemeProvider } from "@/components/animacao/ThemeProvider";
import { RouteTransition } from "@/components/layout/RouteTransition"; // Importe a transição

const inter = { className: "font-sans" };

//import type { Metadata } from "next";

// MUDE ESTA URL PARA O SEU DOMÍNIO REAL!
const SISTEMA_URL = "https://sismatias.onrender.com"; 

export const metadata: Metadata = {
  // Configurações Básicas de SEO
  title: "Matias Sistemas | Sistemas Empresarial",
  description: "A solução completa para gestão de estoque, finanças, vendas e automação de processos. Gerencie seu negócio de forma eficiente e inteligente.",
  
  // URL canônica do seu site
  metadataBase: new URL(SISTEMA_URL), 
  
  // 1. Configuração do Favicon/Ícones (LOGO NA ABA)
  icons: {
    // ✅ Caminho para o seu PNG na pasta public/images/
    icon: '/images/MatiasSistemas.png', 
    shortcut: '/images/MatiasSistemas.png',
    // Se tiver um ícone apple, você pode usar um nome como '/images/apple-icon.png'
  },
  
  // 2. Configuração do Open Graph (OG - Para WhatsApp, Facebook, Telegram, etc.)
  openGraph: {
    title: 'Matias Sistemas | Gestão Eficiente',
    description: 'Sistema completo para gestão de estoque, finanças e automação de vendas. Aumente a produtividade do seu negócio.',
    url: SISTEMA_URL, 
    siteName: 'Matias Sistemas',
    images: [
      {
        // 🚨 CAMINHO DO SEU LOGO para o Open Graph 
        // A URL DEVE SER ABSOLUTA para funcionar no compartilhamento externo.
        url: `${SISTEMA_URL}/images/MatiaSistemas_og.png`, 
        width: 1200, 
        height: 630, // Proporção padrão Open Graph
        alt: 'Logo Matias Sistemas - Software de Gestão',
      },
    ],
    locale: 'pt_AO', // Recomendo usar o código do seu país, ex: pt_BR, pt_AO, pt_PT
    type: 'website',
  },

  // 3. Configuração do Twitter Card (Para Twitter/X)
  twitter: {
    card: 'summary_large_image', // Usar a imagem grande para destaque
    title: 'Matias Sistemas | Gestão',
    description: 'Gestão de Estoque, Vendas e Finanças em uma só plataforma.',
    // Usa o mesmo logo
    images: [`${SISTEMA_URL}/images/MatiaSistemas_og.png`], 
  },

  // Outras tags importantes (opcional)
  authors: [{ name: "Matias Sistemas" }],
  keywords: ["sistema de gestão", "software erp", "gestão de estoque", "automação de vendas"],

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
                   <SettingsProvider>
                  {children}
                  </SettingsProvider>
                </RouteTransition>
            </ThemeProvider>
          </AuthProvider>
        </CookiesProvider>
      </body>
    </html>
  );
}