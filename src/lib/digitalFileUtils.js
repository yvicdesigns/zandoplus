import { supabase } from '@/lib/customSupabaseClient';

// Envoie le fichier numérique vendu dans le bucket privé 'digital-products'
// (jamais d'URL publique — le téléchargement passe toujours par l'edge
// function get-digital-download-url, qui vérifie l'achat avant de signer
// un lien temporaire). Retourne le chemin de stockage, pas une URL.
export const uploadDigitalFile = async (file, userId) => {
  const ext = file.name.split('.').pop();
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const path = `${userId}/${safeName}`;

  const { error } = await supabase.storage.from('digital-products').upload(path, file);
  if (error) throw error;

  return path;
};
