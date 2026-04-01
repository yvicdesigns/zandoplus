import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const DocumentPreviewModal = ({ isOpen, onClose, documentUrl, documentType, isLoading, error }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>Aperçu du document : {documentType}</DialogTitle>
          <DialogDescription>
            Examinez le document ci-dessous.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow p-4 overflow-auto flex items-center justify-center">
          {isLoading && (
            <div className="flex flex-col items-center justify-center text-gray-500">
              <Loader2 className="w-12 h-12 animate-spin mb-4" />
              <p>Chargement du document sécurisé...</p>
            </div>
          )}
          {error && (
            <div className="text-red-500 text-center">
              <p className="font-semibold">Erreur de chargement</p>
              <p>{error}</p>
            </div>
          )}
          {!isLoading && !error && documentUrl && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <img src={documentUrl} alt={`Aperçu de ${documentType}`} className="max-w-full max-h-[75vh] object-contain rounded-md" />
            </motion.div>
          )}
        </div>
        <div className="p-4 border-t flex justify-end">
           <Button variant="outline" onClick={onClose}>Fermer</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentPreviewModal;