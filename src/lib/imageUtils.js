import { supabase } from '@/lib/customSupabaseClient';
import imageCompression from 'browser-image-compression';

// WATERMARK_LOGO_URL will now be passed dynamically
const WATERMARK_OPTIONS = {
  scale: 0.15, // Increased from 0.12 to 0.15 for a larger watermark
  opacity: 0.6,
  position: 'center', // Changed to center
  margin: 0.05
};

// Le bucket Supabase 'listing_images' refuse tout fichier > 5 Mo. Le filigrane
// redessine la photo en pleine résolution puis la ré-encode : sans limite de
// dimension, une photo de bonne qualité (ex. photos pro de véhicules) peut
// ressortir plus grosse que l'original et dépasser cette limite — l'upload
// échoue alors côté Supabase, mais l'app affichait à tort "vérifiez votre
// connexion" au lieu du vrai problème. On plafonne donc la dimension avant
// de dessiner sur le canvas, ce qui reste largement suffisant à l'affichage
// et réduit aussi le poids/temps d'upload sur une connexion faible.
//
// 15/09/2026 : mesuré en prod — moyenne 837 Ko/photo, jusqu'à 5 Mo, et des
// pages qui rament sur mobile au Congo. 1920px + qualité 0.85 restait trop
// lourd pour de simples vignettes d'annonce ; redescendu à 1280px/0.75, qui
// reste net à l'affichage (aucune image n'est montrée en plus grand sur le
// site) et divise le poids par 3-4 environ.
const MAX_DIMENSION = 1280;
const WEBP_QUALITY = 0.75;

const fetchWatermarkImage = (watermarkLogoUrl) => {
  return new Promise((resolve, reject) => {
    const watermarkImg = new Image();
    watermarkImg.crossOrigin = 'anonymous'; // This is crucial for cross-origin images
    watermarkImg.onload = () => resolve(watermarkImg);
    watermarkImg.onerror = (err) => {
      console.error("Failed to load watermark image.", err);
      reject(new Error('Impossible de charger l\'image du filigrane.'));
    };
    watermarkImg.src = watermarkLogoUrl;
  });
};

const sanitizeFileName = (fileName) => {
  // Replace spaces and special characters with hyphens
  // Remove characters that are not url-friendly
  const cleanedName = fileName
    .normalize("NFD") // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^a-zA-Z0-9.\-_]/g, '-') // Replace invalid chars with hyphen
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Replace multiple hyphens with a single one
  
  // Remove original extension and add .webp
  const nameWithoutExtension = cleanedName.substring(0, cleanedName.lastIndexOf('.')) || cleanedName;
  return `${nameWithoutExtension}.webp`;
};


const compressWithoutWatermark = async (imageFile) => {
  try {
    return await imageCompression(imageFile, {
      maxSizeMB: 0.6,
      maxWidthOrHeight: MAX_DIMENSION,
      useWebWorker: true,
      fileType: 'image/webp',
    });
  } catch (compressionError) {
    console.error('Fallback compression failed:', compressionError);
    return imageFile;
  }
};

export const applyWatermark = async (imageFile, watermarkLogoUrl) => {
  if (!watermarkLogoUrl) {
    console.warn("Watermark logo URL is not provided. Compressing without watermark.");
    return compressWithoutWatermark(imageFile);
  }
  try {
    const [mainImg, watermarkImg] = await Promise.all([
      createImageBitmap(imageFile),
      fetchWatermarkImage(watermarkLogoUrl)
    ]);

    const scaleDown = Math.min(1, MAX_DIMENSION / Math.max(mainImg.width, mainImg.height));
    const targetWidth = Math.round(mainImg.width * scaleDown);
    const targetHeight = Math.round(mainImg.height * scaleDown);

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(mainImg, 0, 0, targetWidth, targetHeight);

    const watermarkWidth = targetWidth * WATERMARK_OPTIONS.scale;
    const watermarkHeight = (watermarkImg.height / watermarkImg.width) * watermarkWidth;

    let x, y;
    switch (WATERMARK_OPTIONS.position) {
      case 'center':
        x = (targetWidth - watermarkWidth) / 2;
        y = (targetHeight - watermarkHeight) / 2;
        break;
      default:
        x = (targetWidth - watermarkWidth) / 2;
        y = (targetHeight - watermarkHeight) / 2;
        break;
    }

    ctx.globalAlpha = WATERMARK_OPTIONS.opacity;
    ctx.drawImage(watermarkImg, x, y, watermarkWidth, watermarkHeight);
    ctx.globalAlpha = 1.0;

    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', WEBP_QUALITY));

    // 16/09/2026 : sur Safari/WebKit (iPhone), canvas.toBlob('image/webp', ...)
    // ne sait pas encoder en WebP et retombe silencieusement sur un PNG sans
    // compression, tout en gardant nos dimensions plafonnées — mesuré en
    // prod : des photos de 3-4 Mo malgré le "fix" du 15/09, renommées .webp
    // alors que ce sont de vrais PNG (vérifié aux octets magiques). Le type
    // réel du blob reflète ce que le navigateur a vraiment produit : s'il ne
    // correspond pas à webp, on recompresse via la librairie (qui applique
    // une vraie limite de taille) plutôt que d'uploader un PNG non compressé
    // déguisé en .webp.
    if (!blob || blob.type !== 'image/webp') {
      const rawFile = new File([blob], sanitizeFileName(imageFile.name), {
        type: blob?.type || imageFile.type,
        lastModified: Date.now(),
      });
      return compressWithoutWatermark(rawFile);
    }

    const watermarkedFile = new File([blob], `watermarked_${sanitizeFileName(imageFile.name)}`, {
      type: 'image/webp',
      lastModified: Date.now(),
    });

    return watermarkedFile;

  } catch (error) {
    console.error('Error applying watermark:', error);
    // 15/09/2026 : ce filet de secours renvoyait la photo BRUTE (jusqu'à
    // plusieurs Mo, format d'origine du téléphone) dès que le filigrane
    // échouait pour une raison ou une autre — mesuré en prod : 28% des
    // photos d'annonces avaient contourné toute compression par ce chemin.
    // On compresse quand même, juste sans filigrane, plutôt que de renoncer.
    return compressWithoutWatermark(imageFile);
  }
};

export const uploadImagesWithWatermark = async (imageFiles, userId, watermarkLogoUrl) => {
    if (!userId || !imageFiles.length) return [];

    const watermarkedFiles = await Promise.all(imageFiles.map(img => applyWatermark(img.file, watermarkLogoUrl)));

    const uploadPromises = watermarkedFiles.map((file) => {
      const sanitizedName = sanitizeFileName(file.name);
      const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(2)}_${sanitizedName}`;
      // cacheControl : sans ça, Supabase renvoyait "no-cache" -> chaque
      // affichage retéléchargeait la photo en entier, même pour la même
      // personne qui revient sur la page. Le nom de fichier est unique
      // (horodatage + aléatoire), donc la mettre en cache longtemps est sans
      // risque : une modification crée toujours un nouveau fichier.
      return supabase.storage.from('listing_images').upload(fileName, file, { cacheControl: '31536000' });
    });

    const uploadResults = await Promise.all(uploadPromises);

    const failedUploads = uploadResults.filter(result => result.error);
    if (failedUploads.length > 0) {
      failedUploads.forEach(({ error }) => {
        console.error("Erreur de téléchargement d'image:", error.message);
      });
      throw new Error("Certaines images n'ont pas pu être téléchargées. Vérifiez votre connexion et réessayez.");
    }

    const imageUrls = uploadResults.map(({ data }) => {
      const { data: { publicUrl } } = supabase.storage.from('listing_images').getPublicUrl(data.path);
      return publicUrl;
    });

    return imageUrls;
};