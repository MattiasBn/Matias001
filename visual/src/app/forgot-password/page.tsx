'use client'

import { EsqueceuSenhaForm } from "@/components/auth/EsqueceuSenhaForm";
import { motion, Variants } from "framer-motion";
//import { Metadata } from "next";

const pageVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.6 } },
};

// Next.js não suporta metadata dentro de um 'use client' file. 
// A metadata deve ser definida em um arquivo de layout ou em um arquivo de página do servidor.
// Por isso, esta metadata não será aplicada.

export default function EsqueceuSenhaPage() {
  return (
    <motion.div 
        className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900"
        initial="hidden"
        animate="visible"
        variants={pageVariants}
    >
      <EsqueceuSenhaForm />
    </motion.div>
  );
}