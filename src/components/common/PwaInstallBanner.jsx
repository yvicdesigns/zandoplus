import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDownToLine, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { isMobile, isIOS } from 'react-device-detect';
import { Link } from 'react-router-dom';

const PwaInstallBanner = () => {
  const { canInstall, triggerInstall } = usePwaInstall();
  const [isVisible, setIsVisible] = useState(true);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsStandalone(true);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
  };

  const showBanner = isVisible && isMobile && !isStandalone;

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 bg-custom-green-600 text-white p-3 shadow-lg z-50 flex items-center justify-between pb-[env(safe-area-inset-bottom)]"
        >
          <div className="flex items-center">
            <img className="w-10 h-10 mr-3 rounded-lg" alt="Zando+ App Icon" src="https://images.unsplash.com/photo-1683029240907-1b195812422c" />
            <div>
              <p className="font-bold text-sm">Installer l'application Zando+</p>
              <p className="text-xs">Rapide, simple et gratuit.</p>
            </div>
          </div>
          <div className="flex items-center">
            {canInstall && !isIOS ? (
              <Button size="sm" onClick={triggerInstall} className="bg-white text-custom-green-600 hover:bg-gray-200 mr-2">
                Installer
              </Button>
            ) : (
              <Button asChild size="sm" className="bg-white text-custom-green-600 hover:bg-gray-200 mr-2">
                <Link to="/installer-app">Voir</Link>
              </Button>
            )}
            <Button size="icon" variant="ghost" onClick={handleClose} className="h-8 w-8 hover:bg-custom-green-500">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PwaInstallBanner;