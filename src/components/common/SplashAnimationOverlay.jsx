import React, { useEffect, useRef, useState } from 'react';
import lottie from 'lottie-web';
import { Capacitor } from '@capacitor/core';

const SplashAnimationOverlay = ({ onComplete }) => {
  const containerRef = useRef(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;

    const anim = lottie.loadAnimation({
      container: containerRef.current,
      renderer: 'svg',
      loop: false,
      autoplay: true,
      path: '/lottie/zandoplusanim.json',
      assetsPath: '/lottie/images/',
    });

    const handleComplete = () => {
      setVisible(false);
      setTimeout(() => onComplete?.(), 350);
    };

    anim.addEventListener('complete', handleComplete);

    // Sécurité : cache après 4s si l'animation ne se termine pas
    const timeout = setTimeout(handleComplete, 4000);

    return () => {
      anim.removeEventListener('complete', handleComplete);
      anim.destroy();
      clearTimeout(timeout);
    };
  }, [onComplete]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.35s ease',
      }}
    >
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%', maxWidth: 480 }}
      />
    </div>
  );
};

// Seulement sur iOS — Android a déjà une SplashActivity native Lottie
const isIOS = Capacitor.getPlatform() === 'ios';

const ConditionalSplash = ({ onComplete }) => {
  // IMPORTANT: ne jamais appeler onComplete() pendant le render —
  // React interdit de modifier l'état d'un composant parent en cours de render.
  // On passe par useEffect qui s'exécute APRÈS le premier rendu.
  useEffect(() => {
    if (!isIOS) onComplete?.();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isIOS) return null;
  return <SplashAnimationOverlay onComplete={onComplete} />;
};

export default ConditionalSplash;
