import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID;

// Helpers exportés pour fire des events depuis n'importe quelle page
export const fbTrack = (event, params = {}) => {
  if (window.fbq) window.fbq('track', event, params);
};

const MetaPixel = () => {
  const location = useLocation();

  useEffect(() => {
    if (!PIXEL_ID) return;

    // Inject le script Meta Pixel une seule fois
    if (!window.fbq) {
      const script = document.createElement('script');
      script.innerHTML = `
        !function(f,b,e,v,n,t,s){
          if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window,document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init','${PIXEL_ID}');
      `;
      document.head.appendChild(script);

      const noscript = document.createElement('noscript');
      noscript.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1"/>`;
      document.head.appendChild(noscript);
    }
  }, []);

  // PageView à chaque changement de route
  useEffect(() => {
    if (!PIXEL_ID) return;
    fbTrack('PageView');
  }, [location]);

  return null;
};

export default MetaPixel;
