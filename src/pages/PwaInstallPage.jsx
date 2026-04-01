import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { isIOS, isAndroid } from 'react-device-detect';
import { ArrowDownToLine, Share, PlusSquare, Download, CheckCircle, Smartphone, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { motion } from 'framer-motion';

const IOSInstructions = () => (
  <div className="space-y-6 text-gray-700">
    <h2 className="text-2xl font-semibold text-gray-800">Pour les utilisateurs iPhone & iPad</h2>
    <div className="flex items-start space-x-4">
      <div className="flex-shrink-0 w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xl">1</div>
      <p className="pt-1">Ouvrez ce site dans le navigateur <span className="font-bold">Safari</span>.</p>
    </div>
    <div className="flex items-start space-x-4">
      <div className="flex-shrink-0 w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xl">2</div>
      <p className="pt-1">Appuyez sur l'icône de partage <Share className="inline-block w-5 h-5 mx-1" /> en bas de l'écran.</p>
    </div>
    <div className="flex items-start space-x-4">
      <div className="flex-shrink-0 w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xl">3</div>
      <p className="pt-1">Faites défiler vers le bas et sélectionnez <span className="font-bold">"Sur l'écran d'accueil"</span> <PlusSquare className="inline-block w-5 h-5 mx-1" />.</p>
    </div>
    <div className="flex items-start space-x-4">
      <div className="flex-shrink-0 w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xl">4</div>
      <p className="pt-1">Appuyez sur <span className="font-bold">"Ajouter"</span> en haut à droite.</p>
    </div>
  </div>
);

const AndroidInstructions = () => {
  const { canInstall, triggerInstall } = usePwaInstall();
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsStandalone(true);
    }
  }, []);

  if (isStandalone) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center text-green-700 bg-green-50 p-6 rounded-lg shadow-inner"
      >
        <CheckCircle className="mx-auto h-12 w-12 mb-4 text-green-600" />
        <h2 className="text-2xl font-semibold">Application installée !</h2>
        <p className="mt-2">Vous utilisez déjà l'application Zando+. Profitez bien !</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6 text-gray-700">
      <h2 className="text-2xl font-semibold text-gray-800">Pour les utilisateurs Android</h2>
      
      {canInstall ? (
        <div className="text-center">
          <p className="mb-4">Cliquez sur le bouton ci-dessous pour installer l'application directement.</p>
          <Button onClick={triggerInstall} size="lg" className="gradient-bg w-full sm:w-auto animate-pulse">
            <Download className="mr-2 h-5 w-5" />
            Installer l'application
          </Button>
        </div>
      ) : (
        <p className="text-center bg-yellow-50 p-3 rounded-md text-yellow-800 border border-yellow-200">L'installation directe n'est pas disponible. Suivez les étapes manuelles ci-dessous.</p>
      )}

      <div className="pt-4">
        <p className="text-sm text-gray-500 text-center">Si le bouton n'apparaît pas ou ne fonctionne pas, suivez ces étapes :</p>
        <div className="flex items-start space-x-4 mt-4">
          <div className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold text-lg">1</div>
          <p className="pt-0.5">Ouvrez ce site dans le navigateur <span className="font-bold">Chrome</span>.</p>
        </div>
        <div className="flex items-start space-x-4 mt-2">
          <div className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold text-lg">2</div>
          <p className="pt-0.5">Appuyez sur le menu (les trois points en haut à droite).</p>
        </div>
        <div className="flex items-start space-x-4 mt-2">
          <div className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold text-lg">3</div>
          <p className="pt-0.5">Sélectionnez <span className="font-bold">"Installer l'application"</span>.</p>
        </div>
      </div>
    </div>
  );
};

const PwaInstallPage = () => {

  const handleProceed = () => {
    localStorage.setItem('hasVisitedPwaPage', 'true');
  };

  return (
    <>
      <Helmet>
        <title>Installer l'application Zando+ Congo</title>
        <meta name="description" content="Suivez les instructions pour installer l'application Zando+ sur votre appareil mobile pour un accès rapide et facile." />
        <meta property="og:title" content="Installer l'application Zando+ Congo" />
        <meta property="og:description" content="Suivez les instructions pour installer l'application Zando+ sur votre appareil mobile pour un accès rapide et facile." />
      </Helmet>
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 px-4 py-12 relative overflow-hidden">
        {/* Decorative elements */}
        <motion.div
          initial={{ x: -100, y: -100, opacity: 0 }}
          animate={{ x: 0, y: 0, opacity: 0.1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="absolute top-0 left-0 w-48 h-48 bg-custom-green-400 rounded-full mix-blend-multiply filter blur-xl opacity-10"
        ></motion.div>
        <motion.div
          initial={{ x: 100, y: 100, opacity: 0 }}
          animate={{ x: 0, y: 0, opacity: 0.1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="absolute bottom-0 right-0 w-64 h-64 bg-custom-green-500 rounded-full mix-blend-multiply filter blur-xl opacity-10"
        ></motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="bg-white p-8 sm:p-12 rounded-2xl shadow-2xl max-w-2xl w-full text-center border-t-8 border-custom-green-500 relative z-10 overflow-hidden"
        >
          <div className="absolute inset-0 bg-hero-pattern opacity-5 pointer-events-none"></div>
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
            className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-custom-green-100 mb-6 shadow-lg"
          >
            <Smartphone className="h-14 w-14 text-custom-green-600" />
          </motion.div>
          <motion.h1
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-extrabold text-gray-800 mb-4 gradient-text"
          >
            Installez Zando+ sur votre appareil !
          </motion.h1>
          <motion.p
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-gray-600 mb-8 text-lg leading-relaxed"
          >
            Obtenez un accès instantané et une expérience plus rapide en ajoutant notre application à votre écran d'accueil.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-left p-6 border rounded-lg bg-gray-50 shadow-inner"
          >
            {isIOS && <IOSInstructions />}
            {isAndroid && <AndroidInstructions />}
            {!isIOS && !isAndroid && (
              <p className="text-center text-gray-700">
                Ouvrez cette page sur votre téléphone ou tablette pour voir les instructions d'installation.
              </p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-8"
          >
            <Button asChild className="w-full sm:w-auto text-lg px-8 py-3 shadow-md hover:shadow-lg transition-all duration-300" variant="outline" onClick={handleProceed}>
              <Link to="/">
                <Rocket className="mr-2 h-5 w-5" />
                Continuer vers le site
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
};

export default PwaInstallPage;