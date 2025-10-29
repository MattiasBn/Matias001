'use client'

import  LoginForm  from "@/components/auth/LoginForm";
import { motion } from "framer-motion";

const pageVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6 } },
};

export default function LoginPage() {
  return (
    <motion.div 
      className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900"
      initial="hidden"
      animate="visible"
      variants={pageVariants}
    >
      <LoginForm />
    </motion.div>
  );
}