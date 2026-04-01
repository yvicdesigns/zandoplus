import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const PaymentStatusPage = ({ status }) => {
  const { updateUserSubscription } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const priceId = params.get('price_id');

    if (status === 'success' && priceId) {
      let planName = 'pro'; // default to pro
      if (priceId === 'price_1PgU8wRsn7i36QoE9wD6E1Qd') { // Boost Plan
        planName = 'boost';
      }
      updateUserSubscription(planName, priceId).then(() => {
        if (planName === 'boost') {
          navigate('/boost-plan', { replace: true });
        }
        // If it's 'pro', it will stay on this generic success page for now
        // until a dedicated pro page is created.
      });
    }
  }, [status, location.search, updateUserSubscription, navigate]);

  const isSuccess = status === 'success';

  const pageVariants = {
    initial: { opacity: 0, scale: 0.9 },
    in: { opacity: 1, scale: 1 },
    out: { opacity: 0, scale: 0.9 },
  };

  const pageTransition = {
    type: 'spring',
    stiffness: 400,
    damping: 30,
  };

  const content = {
    success: {
      icon: <CheckCircle className="w-20 h-20 text-custom-green-500" />,
      title: 'Paiement Réussi !',
      description: 'Votre abonnement a été activé. Vous pouvez maintenant profiter de tous vos avantages premium.',
      buttonText: 'Commencer à vendre',
      buttonLink: '/post-ad',
    },
    cancel: {
      icon: <XCircle className="w-20 h-20 text-red-500" />,
      title: 'Paiement Annulé',
      description: 'Votre transaction a été annulée. Vous n\'avez pas été débité. Vous pouvez réessayer à tout moment.',
      buttonText: 'Voir les offres',
      buttonLink: '/pricing',
    },
  };

  const currentContent = isSuccess ? content.success : content.cancel;

  return (
    <>
      <Helmet>
        <title>{currentContent.title} - Zando+ Congo</title>
        <meta name="description" content={currentContent.description} />
      </Helmet>
      <motion.div
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className="container mx-auto px-4 py-20 lg:py-32 flex items-center justify-center"
      >
        <div className="text-center max-w-lg">
          <motion.div
            className="mb-6 inline-block"
            initial={{ scale: 0 }}
            animate={{ scale: 1, transition: { delay: 0.2, type: 'spring' } }}
          >
            {currentContent.icon}
          </motion.div>
          <motion.h1 
            className="text-3xl md:text-4xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.3 } }}
          >
            {currentContent.title}
          </motion.h1>
          <motion.p 
            className="text-base md:text-lg text-gray-600 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.4 } }}
          >
            {currentContent.description}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.5 } }}
          >
            <Button asChild size="lg" className="gradient-bg text-white hover:opacity-90 rounded-full px-8 py-4 text-lg font-semibold">
              <Link to={currentContent.buttonLink}>
                {currentContent.buttonText}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </>
  );
};

export default PaymentStatusPage;