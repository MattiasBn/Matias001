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
    router.push("/login");
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
            // Adiciona um fallback simples enquanto a animação carrega
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
        <motion.div className="mt-8 flex gap-4 justify-center" variants={itemVariants}>
          {onReset && (
            <Button
              onClick={onReset}
              className="px-8 py-4 text-lg font-bold bg-green-600 hover:bg-green-700 text-white"
            >
              Tentar Novamente
            </Button>
          )}
          <Button
            onClick={handleGoHome}
            className="px-8 py-4 text-lg font-bold bg-blue-600 hover:bg-blue-700 text-white"
          >
            Ir para o Login
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}