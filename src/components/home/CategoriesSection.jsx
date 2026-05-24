import React from 'react';
    import { Link } from 'react-router-dom';
    import { motion } from 'framer-motion';
    import { useCategories } from '@/hooks/useCategories';
    import { getCategoryEmoji, getCategoryColor, getCategoryImage } from '@/components/post-ad/categoryIcons';

    const CategoriesSection = ({ categoryCounts, loading }) => {
      const { categories: dbCategories } = useCategories();
      const categories = dbCategories.map(cat => ({
        slug: cat.slug,
        name: cat.name,
        emoji: getCategoryEmoji(cat.slug),
        color: getCategoryColor(cat.slug),
        image: getCategoryImage(cat.slug),
        count: categoryCounts?.[cat.slug] || 0,
      }));

      return (
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Explorer les <span className="gradient-text">Catégories</span>
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Trouvez exactement ce que vous cherchez dans nos diverses catégories de marché
              </p>
            </motion.div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 lg:gap-4">
              {categories.map((category, index) => (
                <motion.div
                  key={category.slug}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  viewport={{ once: true }}
                >
                  <Link to={`/listings?category=${category.slug}`} className="block group">
                    <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
                      <div className="relative aspect-square overflow-hidden">
                        {category.image ? (
                          <img
                            src={category.image}
                            alt={category.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className={`w-full h-full bg-gradient-to-br ${category.color} flex items-center justify-center`}>
                            <span className="text-4xl" role="img">{category.emoji}</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      </div>
                      <div className="p-2 bg-white text-center">
                        <h3 className="text-xs font-bold text-gray-800 leading-tight truncate">{category.name}</h3>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {loading ? (
                            <span className="inline-block h-3 w-12 bg-gray-200 rounded animate-pulse" />
                          ) : (
                            `${(category.count || 0).toLocaleString()} annonces`
                          )}
                        </p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      );
    };

    export default CategoriesSection;