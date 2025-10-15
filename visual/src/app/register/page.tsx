'use client'

import RegisterForm from "@/components/auth/Register";
import { motion } from "framer-motion";

const pageVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6 } },
};

export default function RegisterPage() {
  return (
    <motion.div 
      className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900"
      initial="hidden"
      animate="visible"
      variants={pageVariants}
    >
      <RegisterForm />
    </motion.div>
  );
}