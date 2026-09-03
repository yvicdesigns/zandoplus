export const CATEGORY_ICONS = {
  'electronics':             { emoji: '💻', color: 'from-blue-500 to-indigo-600',    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=200&h=200&fit=crop&q=80' },
  'phones-tablets':          { emoji: '📱', color: 'from-teal-500 to-cyan-600',      image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=200&h=200&fit=crop&q=80' },
  'vehicles':                { emoji: '🚗', color: 'from-sky-500 to-blue-600',       image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=200&h=200&fit=crop&q=80' },
  'real-estate':             { emoji: '🏠', color: 'from-orange-500 to-red-600',     image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=200&h=200&fit=crop&q=80' },
  'maison-a-louer':          { emoji: '🔑', color: 'from-teal-500 to-emerald-600',   image: 'https://images.unsplash.com/photo-1560184897-ae75f418493e?w=200&h=200&fit=crop&q=80' },
  'fashion':                 { emoji: '👗', color: 'from-pink-500 to-rose-600',      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop&q=80' },
  'maison-meubles':          { emoji: '🛋️', color: 'from-amber-500 to-orange-600',  image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200&h=200&fit=crop&q=80' },
  'beaute-soins':            { emoji: '💄', color: 'from-fuchsia-500 to-pink-600',   image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=200&h=200&fit=crop&q=80' },
  'services':                { emoji: '🔧', color: 'from-yellow-500 to-amber-600',   image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=200&h=200&fit=crop&q=80' },
  'reparation-construction': { emoji: '🏗️', color: 'from-slate-500 to-gray-700',    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=200&h=200&fit=crop&q=80' },
  'equipement-commercial':   { emoji: '📦', color: 'from-cyan-500 to-blue-600',      image: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=200&h=200&fit=crop&q=80' },
  'loisirs-sports':          { emoji: '⚽', color: 'from-green-500 to-emerald-600',  image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=200&h=200&fit=crop&q=80' },
  'bebes-enfants':           { emoji: '👶', color: 'from-violet-500 to-purple-600',  image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=200&h=200&fit=crop&q=80' },
  'animaux':                 { emoji: '🐾', color: 'from-amber-500 to-yellow-600',   image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&h=200&fit=crop&q=80' },
  'agro-alimentaire':        { emoji: '🌾', color: 'from-lime-600 to-green-600',     image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&h=200&fit=crop&q=80' },
  'jobs':                    { emoji: '💼', color: 'from-purple-500 to-violet-600',  image: 'https://images.unsplash.com/photo-1664575602554-2087b04935a5?w=200&h=200&fit=crop&q=80' },
  'traditional-medicine':    { emoji: '🌿', color: 'from-emerald-500 to-green-600',  image: 'https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?w=200&h=200&fit=crop&q=80' },
};

export const getCategoryEmoji = (slug) => CATEGORY_ICONS[slug]?.emoji ?? '🏷️';
export const getCategoryColor = (slug) => CATEGORY_ICONS[slug]?.color ?? 'from-gray-500 to-gray-600';
export const getCategoryImage = (slug) => CATEGORY_ICONS[slug]?.image ?? null;
