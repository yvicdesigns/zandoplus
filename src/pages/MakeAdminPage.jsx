import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { Shield, Sparkles, LogOut } from 'lucide-react';

const MakeAdminPage = () => {
  const { user, session, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isNowAdmin, setIsNowAdmin] = useState(false);

  useEffect(() => {
    if (user?.user_metadata?.is_admin) {
      setIsNowAdmin(true);
    }
  }, [user]);

  const handleMakeAdmin = async () => {
    if (!user || !session) {
      toast({ title: 'Erreur', description: 'Vous devez être connecté.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke('make-caller-admin');

      if (error) throw new Error(error.message);

      toast({
        title: 'Promotion Réussie !',
        description: 'Vous avez maintenant les droits d\'administrateur.',
        className: 'bg-green-100 text-green-800',
      });
      setIsNowAdmin(true);
    } catch (error) {
      console.error('Error making user admin:', error);
      toast({ title: 'Erreur', description: error.message || "Une erreur est survenue lors de l'opération.", variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 p-4">
      <div className="text-center p-8 bg-white shadow-2xl rounded-2xl max-w-md w-full transform transition-all hover:scale-105">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-custom-green-400 to-teal-500 rounded-full flex items-center justify-center text-white shadow-lg">
          <Shield size={40} />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Promotion Administrateur</h1>
        
        {!isNowAdmin ? (
          <>
            <p className="text-gray-600 mb-8">Cliquez ci-dessous pour débloquer les super-pouvoirs d'administrateur. Cette page est un outil de configuration unique.</p>
            <Button 
              onClick={handleMakeAdmin} 
              disabled={isLoading} 
              className="w-full gradient-bg hover:opacity-90 text-lg py-6 rounded-lg shadow-lg"
            >
              {isLoading ? 'Activation en cours...' : (
                <div className="flex items-center">
                  <Sparkles className="w-5 h-5 mr-2" /> Devenir Admin
                </div>
              )}
            </Button>
          </>
        ) : (
          <>
            <p className="text-gray-600 mb-6">Félicitations, vous êtes maintenant administrateur ! Pour que vos nouveaux droits soient actifs, veuillez vous déconnecter et vous reconnecter.</p>
            <Button 
              onClick={() => navigate('/admin')} 
              className="w-full bg-blue-500 hover:bg-blue-600 text-white text-lg py-6 rounded-lg shadow-lg mb-4"
            >
              Aller au Tableau de Bord
            </Button>
            <Button 
              onClick={signOut} 
              variant="outline"
              className="w-full text-lg py-6 rounded-lg"
            >
              <LogOut className="w-5 h-5 mr-2" /> Se déconnecter
            </Button>
             <p className="text-xs text-gray-400 mt-6">Une fois reconnecté, le lien vers le tableau de bord sera dans votre menu profil.</p>
          </>
        )}
      </div>
    </div>
  );
};

export default MakeAdminPage;