import React from 'react';
import { motion } from 'framer-motion';
import { Eye, DollarSign, MessageCircle, Heart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const ProfileStats = ({ activeListingsCount, soldListingsCount, messagesCount, favoritesCount }) => {
  const stats = [
    { label: 'Annonces Actives', value: activeListingsCount, icon: Eye, color: 'from-blue-400 to-blue-600' },
    { label: 'Annonces Vendues', value: soldListingsCount, icon: DollarSign, color: 'from-green-400 to-green-600' },
    { label: 'Messages', value: messagesCount, icon: MessageCircle, color: 'from-purple-400 to-purple-600' },
    { label: 'Favoris', value: favoritesCount, icon: Heart, color: 'from-pink-400 to-pink-600' }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
        >
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className={`w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center shadow-lg ${stat.color}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-1">{stat.value}</h3>
              <p className="text-gray-600 text-sm">{stat.label}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default ProfileStats;