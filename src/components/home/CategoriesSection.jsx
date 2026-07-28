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
    image: getCategoryImage(cat.slug),
    count: categoryCounts?.[cat.slug] || 0,
  }));

  return (
    <section className="py-6 bg-page-bg">
      <div className="max-w-[1280px] mx-auto px-6">

        {/* En-tête */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[19px] font-extrabold text-gray-900">Catégories populaires</h2>
          <Link
            to="/listings"
            className="flex items-center gap-1 text-[13px] font-semibold text-custom-green-500 hover:underline"
          >
            Voir toutes les catégories <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Scroll horizontal */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((category) => (
            <Link
              key={category.slug}
              to={`/listings?category=${category.slug}`}
              className="flex-shrink-0 w-[140px] bg-category-card rounded-xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              {/* Image / emoji */}
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

              {/* Texte */}
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
