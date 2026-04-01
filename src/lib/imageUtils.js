import { supabase } from '@/lib/customSupabaseClient';

// WATERMARK_LOGO_URL will now be passed dynamically
const WATERMARK_OPTIONS = {
  scale: 0.15, // Increased from 0.12 to 0.15 for a larger watermark
  opacity: 0.6,
  position: 'center', // Changed to center
  margin: 0.05 
};

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


export const applyWatermark = async (imageFile, watermarkLogoUrl) => {
  if (!watermarkLogoUrl) {
    console.warn("Watermark logo URL is not provided. Skipping watermark application.");
    return imageFile;
  }
  try {
    const [mainImg, watermarkImg] = await Promise.all([
      createImageBitmap(imageFile),
      fetchWatermarkImage(watermarkLogoUrl)
    ]);

    const canvas = document.createElement('canvas');
    canvas.width = mainImg.width;
    canvas.height = mainImg.height;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(mainImg, 0, 0);

    const watermarkWidth = mainImg.width * WATERMARK_OPTIONS.scale;
    const watermarkHeight = (watermarkImg.height / watermarkImg.width) * watermarkWidth;
    
    let x, y;
    switch (WATERMARK_OPTIONS.position) {
      case 'center':
        x = (mainImg.width - watermarkWidth) / 2;
        y = (mainImg.height - watermarkHeight) / 2;
        break;
      default:
        x = (mainImg.width - watermarkWidth) / 2;
        y = (mainImg.height - watermarkHeight) / 2;
        break;
    }

    ctx.globalAlpha = WATERMARK_OPTIONS.opacity;
    ctx.drawImage(watermarkImg, x, y, watermarkWidth, watermarkHeight);
    ctx.globalAlpha = 1.0;

    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', 0.85));
    
    const watermarkedFile = new File([blob], `watermarked_${sanitizeFileName(imageFile.name)}`, {
      type: 'image/webp',
      lastModified: Date.now(),
    });

    return watermarkedFile;

  } catch (error) {
    console.error('Error applying watermark:', error);
    return imageFile; 
  }
};

export const uploadImagesWithWatermark = async (imageFiles, userId, watermarkLogoUrl) => {
    if (!userId || !imageFiles.length) return [];

    const watermarkedFiles = await Promise.all(imageFiles.map(img => applyWatermark(img.file, watermarkLogoUrl)));

    const uploadPromises = watermarkedFiles.map((file) => {
      const sanitizedName = sanitizeFileName(file.name);
      const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(2)}_${sanitizedName}`;
      return supabase.storage.from('listing_images').upload(fileName, file);
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