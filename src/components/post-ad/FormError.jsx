import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

const FormError = ({ message }) => {
  if (!message) return null;
  return (
    <motion.p 
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-xs text-red-500 mt-1 flex items-center"
    >
      <AlertTriangle className="w-3 h-3 mr-1" />
      {message}
    </motion.p>
  );
};

export default FormError;