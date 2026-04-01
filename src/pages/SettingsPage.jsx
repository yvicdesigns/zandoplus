import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { 
  Trash2, 
  LogOut, 
  Shield, 
  AlertTriangle,
  User,
  Lock
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const SettingsPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
      toast({
        title: "Déconnexion réussie",
        description: "À bientôt !",
      });
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de la déconnexion.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const { error } = await supabase.rpc('delete_user_account');
      
      if (error) throw error;

      toast({
        title: "Compte supprimé",
        description: "Votre compte a été supprimé avec succès.",
      });

      await logout();
      navigate('/');
    } catch (error) {
      console.error('Delete account error:', error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de la suppression du compte.",
        variant: "destructive"
      });
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12">
        <p className="text-center text-gray-600">Veuillez vous connecter pour accéder aux paramètres.</p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Paramètres - Zando+ Congo</title>
        <meta name="description" content="Gérez les paramètres de votre compte Zando+ Congo." />
      </Helmet>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Paramètres du Compte</h1>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-3 rounded-full">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle>Informations du Compte</CardTitle>
                  <CardDescription>Gérez vos informations personnelles</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Nom complet</p>
                  <p className="font-medium">{user.full_name || 'Non renseigné'}</p>
                </div>
                <Button onClick={() => navigate('/profile')} variant="outline" className="mt-4">
                  Modifier le Profil
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-3 rounded-full">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <CardTitle>Sécurité</CardTitle>
                  <CardDescription>Gérez la sécurité de votre compte</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Mot de passe</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Modifiez votre mot de passe pour sécuriser votre compte.
                  </p>
                  <Button onClick={() => navigate('/reset-password')} variant="outline">
                    <Lock className="w-4 h-4 mr-2" />
                    Changer le Mot de Passe
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-3 rounded-full">
                  <LogOut className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <CardTitle>Session</CardTitle>
                  <CardDescription>Gérez votre session active</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Déconnectez-vous de votre compte sur cet appareil.
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline">
                    <LogOut className="w-4 h-4 mr-2" />
                    Se Déconnecter
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmer la Déconnexion</AlertDialogTitle>
                    <AlertDialogDescription>
                      Êtes-vous sûr de vouloir vous déconnecter ?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={handleLogout}>
                      Se Déconnecter
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>

          <Card id="danger-zone" className="border-red-200">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-red-100 p-3 rounded-full">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-red-600">Zone Dangereuse</CardTitle>
                  <CardDescription>Actions irréversibles sur votre compte</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-900 mb-1">Suppression de Données</h3>
                    <p className="text-sm text-red-800 mb-3">
                      Demandez la suppression complète de votre compte et de toutes vos données personnelles. Cette action est irréversible.
                    </p>
                    <Button 
                      onClick={() => navigate('/data-deletion')}
                      variant="destructive"
                      size="sm"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Demander la Suppression
                    </Button>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-amber-900 mb-1">Suppression Immédiate (Déconseillé)</h3>
                    <p className="text-sm text-amber-800 mb-3">
                      Supprimez immédiatement votre compte sans période de grâce. Toutes vos données seront définitivement perdues.
                    </p>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Supprimer Immédiatement
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                            Supprimer Définitivement le Compte
                          </AlertDialogTitle>
                          <AlertDialogDescription className="space-y-2">
                            <p className="font-semibold text-red-600">
                              Cette action est IRRÉVERSIBLE et IMMÉDIATE !
                            </p>
                            <p>
                              Toutes vos données seront définitivement supprimées :
                            </p>
                            <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                              <li>Profil et informations personnelles</li>
                              <li>Toutes vos annonces</li>
                              <li>Messages et conversations</li>
                              <li>Favoris et recherches sauvegardées</li>
                              <li>Avis et évaluations</li>
                            </ul>
                            <p className="font-semibold mt-4">
                              Êtes-vous absolument certain de vouloir continuer ?
                            </p>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteAccount}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Oui, Supprimer Définitivement
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default SettingsPage;