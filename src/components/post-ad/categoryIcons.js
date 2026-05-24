export const CATEGORY_ICONS = {
  'electronics':            { emoji: '💻', color: 'from-blue-500 to-indigo-600' },
  'phones-tablets':         { emoji: '📱', color: 'from-custom-green-500 to-teal-600' },
  'vehicles':               { emoji: '🚗', color: 'from-sky-500 to-blue-600' },
  'real-estate':            { emoji: '🏠', color: 'from-orange-500 to-red-600' },
  'fashion':                { emoji: '👗', color: 'from-pink-500 to-rose-600' },
  'maison-meubles':         { emoji: '🛋️', color: 'from-amber-500 to-orange-600' },
  'beaute-soins':           { emoji: '💄', color: 'from-fuchsia-500 to-pink-600' },
  'services':               { emoji: '🔧', color: 'from-yellow-500 to-amber-600' },
  'reparation-construction':{ emoji: '🏗️', color: 'from-slate-500 to-gray-600' },
  'equipement-commercial':  { emoji: '📦', color: 'from-cyan-500 to-blue-600' },
  'loisirs-sports':         { emoji: '⚽', color: 'from-green-500 to-emerald-600' },
  'bebes-enfants':          { emoji: '👶', color: 'from-violet-500 to-purple-600' },
  'animaux':                { emoji: '🐾', color: 'from-amber-600 to-yellow-500' },
  'agro-alimentaire':       { emoji: '🌾', color: 'from-lime-600 to-green-600' },
  'jobs':                   { emoji: '💼', color: 'from-purple-500 to-violet-600' },
  'traditional-medicine':   { emoji: '🌿', color: 'from-emerald-500 to-green-600' },
};

export const getCategoryEmoji = (slug) => CATEGORY_ICONS[slug]?.emoji ?? '🏷️';
export const getCategoryColor = (slug) => CATEGORY_ICONS[slug]?.color ?? 'from-gray-500 to-gray-600';
