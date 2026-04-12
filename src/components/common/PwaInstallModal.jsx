import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { isMobile, isIOS } from 'react-device-detect';

const PwaInstallModal = () => {
  const { canInstall, triggerInstall } = usePwaInstall();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const alreadyShown = localStorage.getItem('pwaModalShown');

    if (!isMobile || isStandalone || alreadyShown) return;

    const timer = setTimeout(() => {
      setIsVisible(true);
      localStorage.setItem('pwaModalShown', 'true');
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => setIsVisible(false);

  const handleInstall = () => {
    triggerInstall();
    setIsVisible(false);
  };

  if (!isMobile) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            backgroundColor: 'rgba(0,0,0,0.6)',
          }}
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            style={{
              width: '100%',
              maxWidth: '384px',
              backgroundColor: 'white',
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header vert */}
            <div className="gradient-bg p-6 text-center relative">
              <button
                onClick={handleClose}
                className="absolute top-3 right-3 text-white/70 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="w-16 h-16 bg-white rounded-2xl mx-auto mb-3 flex items-center justify-center shadow-md">
                <img
                  src="/android-chrome-192x192.png"
                  alt="Zando+"
                  className="w-12 h-12 rounded-xl"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
              <h2 className="text-white font-bold text-xl">Zando+</h2>
              <p className="text-white/80 text-sm mt-1">Application mobile</p>
            </div>

            {/* Contenu */}
            <div className="p-6 text-center">
              <Smartphone className="w-8 h-8 text-custom-green-500 mx-auto mb-3" />
              <h3 className="font-bold text-gray-800 text-lg mb-2">
                Installez l'application
              </h3>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                Accédez à Zando+ directement depuis votre écran d'accueil, sans passer par le Play Store. Rapide et gratuit.
              </p>

              {isIOS ? (
                <div className="text-sm text-gray-600 bg-gray-50 rounded-xl p-4 text-left space-y-2">
                  <p className="font-semibold text-gray-700">Comment installer :</p>
                  <p>1. Appuyez sur <span className="font-mono bg-gray-200 px-1 rounded">⬆ Partager</span></p>
                  <p>2. Puis <span className="font-semibold">"Sur l'écran d'accueil"</span></p>
                </div>
              ) : canInstall ? (
                <Button
                  onClick={handleInstall}
                  className="w-full gradient-bg hover:opacity-90 rounded-full h-12 text-base font-semibold"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Installer maintenant
                </Button>
              ) : (
                <div className="text-sm text-gray-500 bg-gray-50 rounded-xl p-4">
                  Ouvrez ce site dans <span className="font-semibold">Chrome</span> pour pouvoir l'installer sur votre écran d'accueil.
                </div>
              )}

              <button
                onClick={handleClose}
                className="mt-4 text-sm text-gray-400 hover:text-gray-600 w-full"
              >
                Plus tard
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PwaInstallModal;
