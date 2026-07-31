import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { getCategoryEmoji, getCategoryImage } from '@/components/post-ad/categoryIcons';

const CategoriesSection = ({ categoryCounts, loading }) => {
  const { categories: dbCategories } = useCategories();
  const categories = dbCategories.map(cat => ({
    slug: cat.slug,
    name: cat.name,
    emoji: getCategoryEmoji(cat.slug),
    image: cat.image_url || getCategoryImage(cat.slug),
    count: categoryCounts?.[cat.slug] || 0,
  }));

  return (
    <section className="py-6 bg-page-bg">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6">

        {/* En-tête */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[17px] sm:text-[19px] font-extrabold text-gray-900">Catégories populaires</h2>
          <Link
            to="/listings"
            className="flex items-center gap-1 text-[13px] font-semibold text-custom-green-500 hover:underline"
          >
            Voir tout <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* ── MOBILE : grille 3 colonnes — 6 max ── */}
        <div className="grid grid-cols-3 gap-2.5 sm:hidden">
          {categories.slice(0, 6).map((category) => (
            <Link
              key={category.slug}
              to={`/listings?category=${category.slug}`}
              className="bg-card-bg rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 active:scale-95"
            >
              <div className="w-full aspect-square bg-category-card flex items-center justify-center overflow-hidden">
                {category.image ? (
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl" role="img">{category.emoji}</span>
                )}
              </div>
              <div className="px-1 py-2 text-center">
                <p className="text-[11px] font-bold text-gray-900 leading-tight line-clamp-1">{category.name}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* ── DESKTOP : scroll horizontal original ── */}
        <div className="hidden sm:flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((category) => (
            <Link
              key={category.slug}
              to={`/listings?category=${category.slug}`}
              className="flex-shrink-0 w-[140px] bg-category-card rounded-xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="w-full h-[108px] bg-category-card flex items-center justify-center overflow-hidden">
                {category.image ? (
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-5xl" role="img">{category.emoji}</span>
                )}
              </div>
              <div className="px-2 py-3 text-center">
                <p className="text-[13px] font-bold text-gray-900 leading-tight">{category.name}</p>
                <p className="text-[11px] text-gray-500 mt-1">
                  {loading ? (
                    <span className="inline-block h-3 w-12 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    `${(category.count || 0).toLocaleString()}+ produits`
                  )}
                </p>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
};

export default CategoriesSection;
