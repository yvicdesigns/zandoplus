import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Mail, Zap, Tag, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const PromotionsPage = () => {
    const pageVariants = {
        initial: { opacity: 0, y: 30 },
        in: { opacity: 1, y: 0 },
        out: { opacity: 0, y: -30 },
    };

    const pageTransition = {
        type: 'tween',
        ease: 'anticipate',
        duration: 0.8,
    };

    const features = [
        {
            icon: Tag,
            title: "Offres Exclusives",
            description: "Accédez à des réductions et des offres spéciales réservées uniquement à nos abonnés."
        },
        {
            icon: Zap,
            title: "Accès en Avant-Première",
            description: "Soyez les premiers informés des nouvelles fonctionnalités, des événements et des annonces importantes."
        },
        {
            icon: Star,
            title: "Vendeurs à la Une",
            description: "Découvrez les profils de nos meilleurs vendeurs et leurs articles les plus populaires."
        },
        {
            icon: Mail,
            title: "Conseils et Astuces",
            description: "Recevez des conseils pour acheter et vendre plus efficacement sur notre plateforme."
        }
    ];

    return (
        <>
            <Helmet>
                <title>Promotions et Actualités - Zando+ Congo</title>
                <meta name="description" content="Restez informé des dernières promotions, actualités et offres exclusives de Zando+ Congo. Abonnez-vous à notre newsletter !" />
            </Helmet>
            <motion.div
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
            >
                <section className="relative py-20 lg:py-32 hero-pattern">
                    <div className="absolute inset-0 bg-gradient-to-br from-custom-green-600/10 via-teal-600/10 to-transparent"></div>
                    <div className="container mx-auto px-4 relative z-10 text-center">
                        <motion.h1
                            className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0, transition: { duration: 0.5 } }}
                        >
                            Promotions & <span className="gradient-text">Actualités</span>
                        </motion.h1>
                        <motion.p
                            className="text-base md:text-lg text-gray-600 max-w-3xl mx-auto"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.2 } }}
                        >
                            Ne manquez aucune de nos offres exclusives et des dernières nouvelles de la communauté Zando+.
                        </motion.p>
                    </div>
                </section>

                <section className="py-20 bg-white">
                    <div className="container mx-auto px-4">
                        <div className="text-center max-w-3xl mx-auto">
                            <h2 className="text-3xl font-bold mb-4">Rejoignez notre communauté</h2>
                            <p className="text-gray-600 mb-8">
                                Cette page est en cours de construction. Pour l'instant, le meilleur moyen de rester informé est de vous abonner à notre newsletter. Vous recevrez toutes les informations directement dans votre boîte de réception.
                            </p>
                            <div className="flex justify-center">
                                <Link to="/">
                                    <Button size="lg" className="gradient-bg hover:opacity-90">
                                        Retour à l'accueil
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        <div className="mt-20">
                            <h3 className="text-2xl font-bold text-center mb-12">Ce qui vous attend dans notre newsletter :</h3>
                            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                                {features.map((feature, index) => (
                                    <motion.div
                                        key={index}
                                        className="text-center p-6 bg-gray-50 rounded-xl"
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.5, delay: index * 0.1 }}
                                    >
                                        <div className="w-16 h-16 bg-custom-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <feature.icon className="w-8 h-8 text-custom-green-600" />
                                        </div>
                                        <h4 className="font-bold text-lg mb-2">{feature.title}</h4>
                                        <p className="text-gray-600 text-sm">{feature.description}</p>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            </motion.div>
        </>
    );
};

export default PromotionsPage;