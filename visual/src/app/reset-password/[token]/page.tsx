"use client";

import { RedefinirSenhaForm } from "@/components/auth/RedefinirSenhaForm";
import { motion, Variants } from "framer-motion";

const pageVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6 } },
};

export default function RedefinirSenhaPage() {
  return (
    <motion.div
      className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900"
      initial="hidden"
      animate="visible"
      variants={pageVariants}
    >

      <RedefinirSenhaForm />
    </motion.div>
  );
}
