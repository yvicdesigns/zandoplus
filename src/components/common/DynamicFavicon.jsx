import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';

const DynamicFavicon = () => {
  const { siteSettings, loading } = useSiteSettings();

  if (loading || !siteSettings?.favicon_url) {
    // Fournit un favicon par défaut pendant le chargement ou si aucun n'est défini
    return (
      <Helmet>
        <link rel="icon" href="/favicon.png" type="image/png" />
      </Helmet>
    );
  }

  const faviconUrl = siteSettings.favicon_url;
  const fileExtension = faviconUrl.split('.').pop().split('?')[0];
  let mimeType;

  switch (fileExtension) {
    case 'svg':
      mimeType = 'image/svg+xml';
      break;
    case 'ico':
      mimeType = 'image/x-icon';
      break;
    case 'png':
      mimeType = 'image/png';
      break;
    case 'jpg':
    case 'jpeg':
      mimeType = 'image/jpeg';
      break;
    case 'webp':
      mimeType = 'image/webp';
      break;
    default:
      mimeType = 'image/png'; // Fallback
  }

  return (
    <Helmet>
      <link rel="icon" href={faviconUrl} type={mimeType} />
    </Helmet>
  );
};

export default DynamicFavicon;