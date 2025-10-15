"use client";

import { motion, type Variants } from "framer-motion";
import React from "react";

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

const ButtonLoader = () => {
  return (
    <motion.div
      className="flex w-6 h-4 justify-around items-center"
      variants={loadingContainerVariants}
      initial="start"
      animate="end"
    >
      <motion.span
        className="block w-1.5 h-1.5 bg-white rounded-full"
        variants={loadingCircleVariants}
        transition={{
          duration: 0.4,
          repeat: Infinity,
          ease: "easeInOut",
          repeatType: "reverse",
        }}
      />
      <motion.span
        className="block w-1.5 h-1.5 bg-white rounded-full"
        variants={loadingCircleVariants}
        transition={{
          duration: 0.4,
          repeat: Infinity,
          ease: "easeInOut",
          repeatType: "reverse",
        }}
      />
      <motion.span
        className="block w-1.5 h-1.5 bg-white rounded-full"
        variants={loadingCircleVariants}
        transition={{
          duration: 0.4,
          repeat: Infinity,
          ease: "easeInOut",
          repeatType: "reverse",
        }}
      />
    </motion.div>
  );
};

export default ButtonLoader;