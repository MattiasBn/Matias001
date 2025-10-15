"use client";

import { motion, Transition, Variants } from "framer-motion"; // Adicione 'Variants' e 'Transition' aqui
import React from "react";

// ... (as outras constantes permanecem as mesmas)

const loadingContainerVariants: Variants = {
  start: {
    transition: {
      staggerChildren: 0.1,
    },
  },
  end: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const loadingCircleVariants: Variants = {
  start: {
    y: "0%",
  },
  end: {
    y: "100%",
  },
};

const loadingCircleTransition: Transition = {
  duration: 0.4,
  repeat: Infinity,
  ease: "easeInOut",
  repeatType: "reverse", // A string já é tipada corretamente
};

const Loader = () => {
  return (
    <div className="flex justify-center items-center h-screen">
      <motion.div
        className="flex w-20 h-20 justify-around"
        variants={loadingContainerVariants}
        initial="start"
        animate="end"
      >
        <motion.span
          className="block w-4 h-4 bg-gray-900 dark:bg-white rounded-full"
          variants={loadingCircleVariants}
          transition={loadingCircleTransition}
        />
        <motion.span
          className="block w-4 h-4 bg-gray-900 dark:bg-white rounded-full"
          variants={loadingCircleVariants}
          transition={loadingCircleTransition}
        />
        <motion.span
          className="block w-4 h-4 bg-gray-900 dark:bg-white rounded-full"
          variants={loadingCircleVariants}
          transition={loadingCircleTransition}
        />
      </motion.div>
    </div>
  );
};

export default Loader;