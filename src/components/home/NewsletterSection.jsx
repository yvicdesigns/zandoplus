import React, { useRef } from 'react';
import { Mail } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const NewsletterSection = () => {
  const { toast } = useToast();
  const inputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const email = inputRef.current?.value?.trim();
    if (!email) return;

    const { error } = await supabase.from('subscribers').insert({ email });

    if (error) {
      toast({
        title: error.code === '23505' ? 'Déjà abonné' : 'Erreur',
        description: error.code === '23505'
          ? 'Cette adresse est déjà dans notre liste.'
          : 'Une erreur s\'est produite. Veuillez réessayer.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Inscription réussie !',
        description: 'Merci ! Vous recevrez nos offres en avant-première.',
        className: 'bg-custom-green-500 text-white',
      });
      e.target.reset();
    }
  };

  return (
    <section className="py-6 bg-page-bg">
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="bg-category-card rounded-2xl px-10 py-8 flex flex-col md:flex-row items-center gap-8">

          {/* Icône */}
          <div className="flex-shrink-0 text-5xl">📧</div>

          {/* Texte */}
          <div className="flex-1">
            <h3 className="text-[20px] font-extrabold text-gray-900 mb-1">
              Inscrivez-vous à notre newsletter
            </h3>
            <p className="text-[13px] text-gray-500 leading-relaxed">
              Recevez nos offres exclusives, nouveautés et bons plans en avant-première.
            </p>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="flex w-full md:w-auto md:flex-shrink-0 md:min-w-[340px]">
            <input
              ref={inputRef}
              type="email"
              name="email"
              required
              placeholder="Votre adresse e-mail"
              className="flex-1 border-2 border-gray-200 border-r-0 rounded-l-lg px-4 text-[13px] outline-none h-[46px] bg-white placeholder:text-gray-400 focus:border-custom-green-500 transition-colors"
            />
            <button
              type="submit"
              className="bg-custom-green-500 text-white font-bold text-[13px] px-6 rounded-r-lg h-[46px] hover:bg-custom-green-600 transition-colors whitespace-nowrap"
            >
              S'inscrire
            </button>
          </form>

        </div>
      </div>
    </section>
  );
};

export default NewsletterSection;
