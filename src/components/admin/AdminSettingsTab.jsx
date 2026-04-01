import React, { memo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Image as ImageIcon, Mail, Trash2, ShieldAlert } from 'lucide-react';
import EditSiteSettingsDialog from '@/components/admin/EditSiteSettingsDialog';
import EditAboutImagesDialog from '@/components/about/EditAboutImagesDialog';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from "@/components/ui/use-toast";
import { translateAdminError } from '@/lib/adminErrorHandler';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const AdminSettingsTab = memo(() => {
  const [isSiteSettingsDialogOpen, setSiteSettingsDialogOpen] = useState(false);
  const [isAboutImagesDialogOpen, setAboutImagesDialogOpen] = useState(false);
  const [isClearCacheAlertOpen, setClearCacheAlertOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const userRole = user?.role || 'viewer';
  const canEdit = userRole === 'admin' || userRole === 'editor';
  const isAdmin = userRole === 'admin';

  const handleClearCache = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      toast({
        title: "Nettoyage du cache...",
        description: "L'application va se recharger d'ici quelques instants.",
        className: "bg-green-100 text-green-800"
      });
  
      setTimeout(() => {
        window.location.reload(true);
      }, 1500);
    } catch (err) {
      toast({
        title: "Erreur",
        description: translateAdminError(err),
        variant: "destructive"
      });
    }
  };

  const handleRestrictedAction = () => {
    toast({
      title: "Accès Refusé",
      description: "Vous n'avez pas les permissions nécessaires (Rôle Éditeur ou Admin requis).",
      variant: "destructive"
    });
  };

  return (
    <>
      <EditSiteSettingsDialog 
        isOpen={isSiteSettingsDialogOpen} 
        onClose={() => setSiteSettingsDialogOpen(false)} 
      />
      <EditAboutImagesDialog 
        isOpen={isAboutImagesDialogOpen} 
        onClose={() => setAboutImagesDialogOpen(false)}
      />
      <AlertDialog open={isClearCacheAlertOpen} onOpenChange={setClearCacheAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action videra complètement le cache de votre navigateur.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearCache} className="bg-red-600">
              Oui, vider le cache
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 text-blue-600 p-3 rounded-full">
                <Settings className="w-6 h-6" />
              </div>
              <div>
                <CardTitle>Paramètres Généraux</CardTitle>
                <CardDescription>Gérez les informations de base du site.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Modifiez le logo, le favicon et les contacts. 
              {!isAdmin && canEdit && <span className="text-orange-500 block mt-1 text-xs font-semibold">(Approbation requise pour les Éditeurs)</span>}
            </p>
            <Button onClick={() => canEdit ? setSiteSettingsDialogOpen(true) : handleRestrictedAction()} variant={canEdit ? "default" : "secondary"} className="w-full">
              {canEdit ? 'Modifier les Paramètres' : 'Lecture Seule'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
             <div className="flex items-center gap-4">
              <div className="bg-green-100 text-green-600 p-3 rounded-full">
                <ImageIcon className="w-6 h-6" />
              </div>
              <div>
                <CardTitle>Images de la page À Propos</CardTitle>
                <CardDescription>Gérer les illustrations du site.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Modifiez l'image de mission et du créateur de la page À propos.
            </p>
            <Button onClick={() => canEdit ? setAboutImagesDialogOpen(true) : handleRestrictedAction()} variant={canEdit ? "default" : "secondary"} className="w-full">
               {canEdit ? 'Modifier les Images' : 'Lecture Seule'}
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
             <div className="flex items-center gap-4">
              <div className="bg-red-100 text-red-600 p-3 rounded-full">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <CardTitle>Vider le Cache</CardTitle>
                <CardDescription>Zone de nettoyage système.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
             <p className="text-sm text-gray-600 mb-4">
              Efface toutes les données locales stockées sur votre appareil.
            </p>
            <Button variant="destructive" onClick={() => setClearCacheAlertOpen(true)} className="w-full">
               Vider le Cache Local
            </Button>
          </CardContent>
        </Card>

        {!isAdmin && (
             <Card className="border-orange-200 bg-orange-50 lg:col-span-3">
              <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-orange-700">
                      <ShieldAlert className="w-5 h-5"/>
                      <h3 className="font-semibold">Mode Restreint Activé</h3>
                  </div>
                  <p className="text-sm text-orange-600 mt-2">
                      Vous êtes connecté en tant que <strong>{userRole}</strong>. Certaines actions nécessitent une approbation ou un accès administrateur direct. Les requêtes de modifications seront envoyées dans l'onglet "Demandes".
                  </p>
              </CardContent>
             </Card>
        )}
      </div>
    </>
  );
});

export default AdminSettingsTab;