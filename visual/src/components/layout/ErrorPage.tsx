"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Lottie from "lottie-react";
import { useState, useEffect } from "react";

interface ErrorPageProps {
  statusCode?: number;
  message?: string;
  title?: string;
  onReset?: () => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

// URL da animação Lottie de um servidor público
const errorAnimationUrl = "https://assets3.lottiefiles.com/packages/lf20_0apkn3k1.json";

export function ErrorPage({ statusCode, title, message, onReset }: ErrorPageProps) {
  const router = useRouter();
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    fetch(errorAnimationUrl)
      .then((res) => res.json())
      .then((data) => setAnimationData(data))
      .catch((err) => console.error("Falha ao carregar animação Lottie:", err));
  }, []);

  const handleGoHome = () => {
    router.push("/login"); // Vai sempre para a página de login
  };
  
  // FUNÇÃO MELHORADA: Tenta voltar no histórico, se não conseguir, vai para o login
  const handleGoBack = () => {
    // Verifica se há histórico de navegação para voltar
    if (window.history.length > 2) { 
        router.back();
    } else {
        // Se não houver histórico anterior significativo, redireciona para um local seguro.
        // Mantenho o /login como fallback, mas o ideal seria /dashboard se o usuário já estiver logado.
        router.push("/login"); 
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center text-white bg-black">
      <motion.div
        className="text-center p-8 z-10 max-w-2xl w-full"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="w-full h-auto max-w-sm mx-auto">
          {animationData ? (
            <Lottie animationData={animationData} loop={true} />
          ) : (
            <div className="h-64 flex items-center justify-center">
              <span className="text-xl">A carregar animação...</span>
            </div>
          )}
        </motion.div>

        <motion.h1 className="text-7xl font-extrabold text-red-500 mt-4" variants={itemVariants}>
          {statusCode || "Erro"}
        </motion.h1>
        <motion.h2 className="text-3xl font-bold mt-2" variants={itemVariants}>
          {title || "Algo deu errado!"}
        </motion.h2>
        <motion.p className="mt-4 max-w-md mx-auto text-lg" variants={itemVariants}>
          {message || "A rota que você tentou acessar não existe ou a internet caiu. Tente novamente."}
        </motion.p>
        
        {/* REESTRUTURAÇÃO E ORGANIZAÇÃO PROFISSIONAL DOS BOTÕES */}
        <motion.div 
            className="mt-8 flex flex-col sm:flex-row gap-3 justify-center items-center w-full" 
            variants={itemVariants}
        >
            {/* 1. BOTÃO PRINCIPAL (Tentar Novamente - Se existir) */}
            {onReset && (
              <Button
                onClick={onReset}
                className="w-full sm:w-auto px-6 py-3 font-semibold bg-green-600 hover:bg-green-700 text-white transition duration-200"
              >
                Tentar Novamente
              </Button>
            )}
            
            {/* CONTAINER PARA OS BOTÕES DISCRETOS (Flexível e Responsivo) */}
            <div className="flex gap-4 justify-center flex-wrap">
                {/* 2. BOTÃO VOLTAR (Discreto) */}
                <Button
                  onClick={handleGoBack}
                  variant="link" // Estilo mais discreto (parece um link)
                  className="text-gray-400 hover:text-white px-2 py-1 text-base font-normal"
                >
                  Voltar à Página Anterior
                </Button>

                {/* 3. BOTÃO IR PARA O LOGIN (Discreto) */}
                <Button
                  onClick={handleGoHome}
                  variant="link" // Estilo mais discreto (parece um link)
                  className="text-gray-400 hover:text-white px-2 py-1 text-base font-normal"
                >
                  Voltar ao Login
                </Button>
            </div>
        </motion.div>
      </motion.div>
    </div>
  );
}