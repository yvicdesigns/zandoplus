import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const PaginationControls = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-center items-center space-x-4 mt-12"
    >
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center space-x-1 hover:bg-gray-100 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Précédent</span>
      </Button>
      
      <div className="text-sm font-medium text-gray-600">
        Page {currentPage} sur {totalPages}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center space-x-1 hover:bg-gray-100 transition-colors"
      >
        <span>Suivant</span>
        <ChevronRight className="w-4 h-4" />
      </Button>
    </motion.div>
  );
};

export default PaginationControls;