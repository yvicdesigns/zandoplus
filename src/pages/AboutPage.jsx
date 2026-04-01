import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Users, Code, Brush, Camera, Video, Zap, Cpu, Edit, Loader2, CalendarDays } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import EditAboutImagesDialog from '@/components/about/EditAboutImagesDialog';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
const AboutPage = () => {
  const {
    isAdmin
  } = useAuth();
  const {
    siteSettings
  } = useSiteSettings();
  const {
    toast
  } = useToast();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const fetchContent = useCallback(async () => {
    setLoading(true);
    const {
      data,
      error
    } = await supabase.from('about_page_content').select('*').eq('id', 1).single();
    if (error) {
      console.error("Error fetching about page content:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger le contenu de la page.",
        variant: "destructive"
      });
    } else {
      setContent(data);
    }
    setLoading(false);
  }, [toast]);
  useEffect(() => {
    fetchContent();
  }, [fetchContent]);
  const pageVariants = {
    initial: {
      opacity: 0,
      y: 30
    },
    in: {
      opacity: 1,
      y: 0
    },
    out: {
      opacity: 0,
      y: -30
    }
  };
  const pageTransition = {
    type: 'tween',
    ease: 'anticipate',
    duration: 0.8
  };
  const sectionVariants = {
    hidden: {
      opacity: 0,
      y: 20
    },
    visible: i => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.2,
        duration: 0.6
      }
    })
  };
  const imageContainerVariants = {
    rest: {
      scale: 1
    },
    hover: {
      scale: 1.05
    }
  };
  const editButtonVariants = {
    rest: {
      opacity: 0,
      y: 10,
      scale: 0.9
    },
    hover: {
      opacity: 1,
      y: 0,
      scale: 1
    }
  };
  const handleSave = newContent => {
    setContent(newContent);
  };
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50">
        <Loader2 className="w-12 h-12 animate-spin text-custom-green-500" />
      </div>;
  }
  const ImageContainer = ({
    children,
    className,
    onEditClick
  }) => <motion.div className={`relative h-96 group ${className || ''}`} initial="hidden" whileInView="visible" viewport={{
    once: true
  }} variants={sectionVariants} whileHover="hover" animate="rest">
      <motion.div className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl" variants={imageContainerVariants} transition={{
      duration: 0.3
    }}>
        {children}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent group-hover:from-black/70 transition-colors"></div>
      </motion.div>
      {isAdmin && <motion.div className="absolute top-4 right-4 z-10" variants={editButtonVariants} transition={{
      duration: 0.2
    }}>
          <Button onClick={onEditClick} size="icon" className="rounded-full shadow-lg bg-white/80 hover:bg-white text-gray-800 backdrop-blur-sm">
            <Edit className="w-5 h-5" />
          </Button>
        </motion.div>}
    </motion.div>;
  return <>
      <Helmet>
        <title>À Propos de Nous - Zando+ Congo</title>
        <meta name="description" content="Découvrez notre mission de connecter les acheteurs et vendeurs au Congo Brazzaville et l'histoire de notre fondateur, M. Thissambou Van Yvic." />
      </Helmet>
      <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} className="overflow-hidden relative">
        <section className="relative py-20 lg:py-32 hero-pattern">
          <div className="absolute inset-0 bg-gradient-to-br from-custom-green-600/10 via-teal-600/10 to-transparent"></div>
          <div className="container mx-auto px-4 relative z-10 text-center">
            <motion.h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4" variants={sectionVariants} custom={0} initial="hidden" animate="visible">
              Notre Histoire, <span className="gradient-text">Votre Marché</span>
            </motion.h1>
            <motion.p className="text-base md:text-lg text-gray-600 max-w-3xl mx-auto" variants={sectionVariants} custom={1} initial="hidden" animate="visible">
              Connecter les coeurs et les communautés du Congo Brazzaville, une transaction à la fois.
            </motion.p>
          </div>
        </section>

        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div custom={0} initial="hidden" whileInView="visible" viewport={{
              once: true
            }} variants={sectionVariants}>
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 bg-custom-green-100 text-custom-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                    <Users className="w-4 h-4" />
                    <span>Notre Mission</span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
                    À propos de notre plateforme
                  </h2>
                  <p className="text-gray-600 leading-relaxed">
                    Bienvenue sur notre site, la solution parfaite pour acheter et vendre des articles neufs ou d’occasion en toute simplicité, ici même au Congo Brazzaville. Nous avons créé cette plateforme pour permettre aux Congolais de se connecter et d’échanger leurs biens sans avoir besoin d’un intermédiaire.
                  </p>
                  <p className="text-gray-600 leading-relaxed">
                    Notre objectif est de rendre l’achat et la vente aussi faciles et sûrs que possible. Que ce soit pour vendre des objets que vous n’utilisez plus ou pour trouver des articles uniques à des prix abordables, vous êtes au bon endroit.
                  </p>
                  <p className="text-gray-600 leading-relaxed">
                    Nous offrons également la possibilité de devenir vendeur ! Il vous suffit de créer un profil et d’ajouter vos articles à vendre. Votre numéro de contact sera enregistré dans votre profil, permettant ainsi aux acheteurs de vous joindre directement pour toute question ou pour finaliser une vente. De plus, les vendeurs peuvent devenir vérifiés en fournissant certains documents, tels que leur passeport ou leur carte d’identité. Cela permettra de renforcer la confiance et la transparence dans les échanges.
                  </p>
                  <p className="text-gray-600 font-semibold">
                    Rejoignez-nous et commencez à vendre ou à acheter aujourd’hui !
                  </p>
                  {siteSettings?.launch_date && <div className="flex items-center gap-2 text-gray-600">
                      <CalendarDays className="w-5 h-5 text-custom-green-500" />
                      <span className="font-medium">Lancé officiellement le: {format(new Date(siteSettings.launch_date), 'dd MMMM yyyy', {
                      locale: fr
                    })}</span>
                    </div>}
                </div>
              </motion.div>
              <ImageContainer onEditClick={() => setIsEditDialogOpen(true)}>
                {content?.mission_image_url ? <img className="w-full h-full object-cover" alt="Marché animé au Congo Brazzaville" src={content.mission_image_url} /> : <div className="w-full h-full bg-gray-200 animate-pulse"></div>}
              </ImageContainer>
            </div>
          </div>
        </section>

        <section className="py-20 bg-gradient-to-br from-gray-50 to-green-50">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <ImageContainer className="order-last md:order-first" onEditClick={() => setIsEditDialogOpen(true)}>
                {content?.creator_image_url ? <img className="w-full h-full object-cover" alt="Portrait de M. Thissambou Van Yvic" src={content.creator_image_url} /> : <div className="w-full h-full bg-gray-200 animate-pulse"></div>}
              </ImageContainer>
              <motion.div custom={1} initial="hidden" whileInView="visible" viewport={{
              once: true
            }} variants={sectionVariants}>
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 bg-custom-green-100 text-custom-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                    <Code className="w-4 h-4" />
                    <span>Le Créateur</span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-800">À propos de M. Tchissambou Van Yvic</h2>
                  <p className="text-gray-600 leading-relaxed">M. Tchissambou Van Yvic, originaire du Congo-Brazzaville, CEO de Creative Art Afrik est un passionné de technologie et de créativité. Après avoir obtenu son bac F3 à Dolisie, il a poursuivi ses études à Brazzaville, où il s’est spécialisé en électricité et en informatique.</p>
                  <p className="text-gray-600 leading-relaxed">
                    C’est au Ghana qu’il a véritablement approfondi ses compétences en informatique, notamment dans le domaine du design graphique et de la création de sites web. Depuis, il a élargi son expertise dans plusieurs domaines créatifs.
                  </p>
                  <div className="flex flex-wrap gap-4 pt-4">
                    {[{
                    icon: Brush,
                    label: 'Design Graphique'
                  }, {
                    icon: Camera,
                    label: 'Photographie'
                  }, {
                    icon: Video,
                    label: 'Vidéo'
                  }, {
                    icon: Code,
                    label: 'Web'
                  }, {
                    icon: Zap,
                    label: 'Électricité'
                  }, {
                    icon: Cpu,
                    label: 'IA'
                  }].map(skill => <div key={skill.label} className="flex items-center gap-2 bg-white p-2 px-3 rounded-lg shadow-sm">
                        <skill.icon className="w-5 h-5 text-custom-green-500" />
                        <span className="text-sm font-medium text-gray-700">{skill.label}</span>
                      </div>)}
                  </div>
                  <p className="text-gray-600 leading-relaxed pt-4">
                    Aujourd’hui, M. Van Yvic utilise l’intelligence artificielle pour accélérer ses projets, et il est également un bricoleur passionné, avec une affinité particulière pour l’électricité et le travail manuel. Son approche innovante et sa polyvalence sont les clés de ses réussites professionnelles.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
        
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 text-center">
            <motion.h2 className="text-3xl md:text-4xl font-bold mb-6" initial={{
            opacity: 0,
            y: 30
          }} whileInView={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.6
          }} viewport={{
            once: true
          }}>
              Une Question ? <span className="gradient-text">Contactez-nous !</span>
            </motion.h2>
            <motion.p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto" initial={{
            opacity: 0,
            y: 30
          }} whileInView={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.6,
            delay: 0.2
          }} viewport={{
            once: true
          }}>
              Notre équipe est toujours prête à vous aider. N'hésitez pas à nous joindre pour toute assistance ou information.
            </motion.p>
            <motion.div initial={{
            opacity: 0,
            y: 30
          }} whileInView={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.6,
            delay: 0.4
          }} viewport={{
            once: true
          }}>
              <Link to="/contact" className="inline-block gradient-bg text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity">
                Nous Contacter
              </Link>
            </motion.div>
          </div>
        </section>
        
        {content && <EditAboutImagesDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} initialData={content} onSave={handleSave} />}
      </motion.div>
    </>;
};
export default AboutPage;