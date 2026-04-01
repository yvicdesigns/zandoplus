import React from 'react';
    import { Link } from 'react-router-dom';
    import { motion } from 'framer-motion';
    import { Card, CardContent } from '@/components/ui/card';
    import { Badge } from '@/components/ui/badge';
    import { Car, Building, Shirt, Briefcase as BriefcaseBusiness, HeartHandshake, PlugZap, Wheat, Leaf } from 'lucide-react';

    const CategoriesSection = ({ categoryCounts, loading }) => {
      const categories = [
        { name: 'Électronique', icon: PlugZap, color: 'from-custom-green-500 to-teal-600', slug: 'electronics' },
        { name: 'Véhicules', icon: Car, color: 'from-blue-500 to-indigo-600', slug: 'vehicles' },
        { name: 'Immobilier', icon: Building, color: 'from-orange-500 to-red-600', slug: 'real-estate' },
        { name: 'Mode', icon: Shirt, color: 'from-pink-500 to-rose-600', slug: 'fashion' },
        { name: 'Emplois', icon: BriefcaseBusiness, color: 'from-purple-500 to-violet-600', slug: 'jobs' },
        { name: 'Services', icon: HeartHandshake, color: 'from-yellow-500 to-amber-600', slug: 'services' },
        { name: 'Agroalimentaire', icon: Wheat, color: 'from-green-700 to-lime-600', slug: 'agro-alimentaire' },
        { name: 'Médecine traditionnelle', icon: Leaf, color: 'from-emerald-500 to-green-600', slug: 'traditional-medicine' }
      ].map(cat => ({
        ...cat,
        count: categoryCounts[cat.slug] || 0
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

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-8">
              {categories.map((category, index) => (
                <motion.div
                  key={category.name}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Link to={`/listings?category=${category.slug}`}>
                    <Card className="category-card p-4 lg:p-6 text-center cursor-pointer border-0 shadow-lg h-full flex flex-col justify-center">
                      <CardContent className="p-0">
                        <div className={`w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center shadow-lg`}>
                          <category.icon className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="text-base font-bold mb-1">{category.name}</h3>
                        <p className="text-xs text-gray-600 mb-2">
                          {loading ? (
                            <span className="inline-block h-4 w-20 bg-gray-200 rounded animate-pulse"></span>
                          ) : (
                            `${(category.count || 0).toLocaleString()} annonces`
                          )}
                        </p>
                        <Badge variant="secondary" className="bg-custom-green-100 text-custom-green-700 text-xs px-2 py-0.5">
                          Explorer
                        </Badge>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      );
    };

    export default CategoriesSection;