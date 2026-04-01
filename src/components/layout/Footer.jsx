import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Send, Music } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const Footer = () => {
  const { toast } = useToast();
  const { user, openAuthModal } = useAuth();
  const { siteSettings, loading: siteSettingsLoading } = useSiteSettings();

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    const email = e.target.elements.email.value;

    if (!email) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer une adresse e-mail.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from('subscribers').insert({ email });

    if (error) {
      if (error.code === '23505') {
        toast({
          title: "Déjà abonné",
          description: "Cette adresse e-mail est déjà dans notre liste.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Erreur",
          description: "Une erreur s'est produite. Veuillez réessayer.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Inscription réussie !",
        description: "Merci de vous être abonné à notre newsletter.",
        className: "bg-green-500 text-white"
      });
      e.target.reset();
    }
  };
  
  const socialLinks = [
    { icon: Facebook, href: 'https://www.facebook.com/profile.php?id=61577391354742', label: 'Facebook' },
    { icon: Instagram, href: 'https://www.instagram.com/zandopluscongo/', label: 'Instagram' },
    { icon: Music, href: 'https://www.tiktok.com/@zandopluscongo', label: 'TikTok' },
  ];
  
  const footerLinks = [
    { 
      title: 'Navigation',
      links: [
        { label: 'Accueil', href: '/' },
        { label: 'Annonces', href: '/listings' },
        { label: 'À propos', href: '/about' },
        { label: 'Contact', href: '/contact' },
      ]
    },
    {
      title: 'Support & Informations',
      links: [
        { label: 'Centre d\'aide', href: '/help' },
        { label: 'Conditions d\'utilisation', href: '/terms' },
        { label: 'Politique de confidentialité', href: '/privacy' },
        { label: 'Rapport d\'Audit de Sécurité', href: '/audit-report' },
      ]
    },
    {
      title: 'Compte',
      links: user 
        ? [
            { label: 'Mon profil', href: '/profile' },
            { label: 'Mes messages', href: '/messages' },
            { label: 'Paramètres', href: '/settings' },
            { label: 'Publier une annonce', href: '/post-ad' },
          ]
        : [
            { label: 'Se connecter', action: openAuthModal },
            { label: 'S\'inscrire', action: openAuthModal },
            { label: 'Publier une annonce', href: '/post-ad' },
          ]
    }
  ];

  return (
    <footer className="bg-gray-800 text-white pt-20 pb-10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Logo and Newsletter */}
          <div className="md:col-span-2 lg:col-span-1">
            <Link to="/" className="mb-6 inline-block">
              {!siteSettingsLoading && siteSettings?.footer_logo_url ? (
                <img src={siteSettings.footer_logo_url} alt="Zando+ Congo" className="h-10" />
              ) : (
                <span className="text-2xl font-bold">Zando+</span>
              )}
            </Link>
            <p className="text-gray-400 mb-4 text-sm leading-relaxed">
              La plus grande marketplace au Congo. Achetez, vendez, et trouvez tout ce dont vous avez besoin, près de chez vous.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="mt-4">
              <label htmlFor="newsletter-email" className="font-semibold text-gray-200 mb-2 block">Newsletter</label>
              <div className="relative">
                <Input
                  type="email"
                  name="email"
                  id="newsletter-email"
                  placeholder="Votre adresse e-mail"
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 pr-12"
                  required
                />
                <Button type="submit" size="icon" className="absolute top-1/2 right-1 -translate-y-1/2 bg-transparent hover:bg-gray-600">
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </form>
          </div>
          
          {/* Footer Links */}
          {footerLinks.map((section, index) => (
            <div key={index}>
              <h3 className="text-lg font-semibold mb-4 text-gray-100">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    {link.href ? (
                      <Link 
                        to={link.href} 
                        className="text-gray-400 hover:text-white transition-colors duration-300"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <button
                        onClick={link.action}
                        className="text-gray-400 hover:text-white transition-colors duration-300 text-left"
                      >
                        {link.label}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div className="border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} Zando+ Congo. Tous droits réservés.
          </p>
          <div className="flex space-x-4">
            {socialLinks.map((social, index) => (
              <a
                key={index}
                href={social.href}
                aria-label={social.label}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors duration-300"
              >
                <social.icon className="w-6 h-6" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;