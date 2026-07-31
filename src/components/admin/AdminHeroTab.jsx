import React, { memo, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle, Loader2, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import HeroBuilderV22 from '@/components/admin/HeroBuilderV22';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

/* Contenu par défaut = ce qui s'affiche sur la page d'accueil */
const DEFAULT_SLIDE = {
  text_content: [
    { spans: [{ text: "Acheter et vendre tout au Congo", color: "#111827", size: "2.25rem", weight: "bold", style: "normal" }] },
    { spans: [{ text: "La première place de marché du Congo-Brazzaville connectant des millions d'acheteurs et de vendeurs.", color: "#6B7280", size: "0.875rem", weight: "normal", style: "normal" }] },
  ],
  text_align: "left",
  cta_text: "Parcourir les Annonces",
  cta_link: "/listings",
  secondary_cta_text: "Publier une Annonce Gratuite",
  secondary_cta_link: "/post-ad",
  image_url: "",
  order: 1,
  is_active: true,
  show_search_bar: false,
  background_color: "#FFFFFF",
  overlay_enabled: false,
  overlay_color: "#000000",
  overlay_opacity: 0.5,
  layout_type: "classic",
};

const AdminHeroTab = memo(() => {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlide, setSelectedSlide] = useState(null);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [slideToDelete, setSlideToDelete] = useState(null);
  const { toast } = useToast();

  const fetchSlides = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('hero_slides')
        .select('*')
        .order('order', { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        /* Table vide → créer le slide par défaut automatiquement */
        const { data: created, error: insertErr } = await supabase
          .from('hero_slides')
          .insert(DEFAULT_SLIDE)
          .select();

        if (insertErr) {
          console.error("Impossible de créer le slide par défaut:", insertErr);
          setSlides([]);
        } else {
          setSlides(created || []);
          toast({ title: "Slide créé", description: "Le hero par défaut a été initialisé. Tu peux maintenant le modifier.", className: "bg-custom-green-500 text-white" });
        }
      } else {
        setSlides(data);
      }
    } catch (error) {
      console.error("Error fetching slides:", error);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les slides. Vérifie les permissions Supabase." });
      setSlides([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSlides();
  }, [fetchSlides]);

  const handleBuild = (slide) => {
    setSelectedSlide(slide);
    setIsBuilderOpen(true);
  };

  const handleAddNew = async () => {
    const nextOrder = slides.length > 0 ? Math.max(...slides.map(s => s.order || 0)) + 1 : 1;
    const newSlide = { ...DEFAULT_SLIDE, order: nextOrder, is_active: false };
    const { data, error } = await supabase.from('hero_slides').insert(newSlide).select().single();
    if (error) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de créer le slide.' });
      return;
    }
    setSlides(prev => [...prev, data]);
    setSelectedSlide(data);
    setIsBuilderOpen(true);
  };

  const handleSave = () => {
    fetchSlides();
  };

  const handleRestoreClassic = async (slide) => {
    try {
      const { error } = await supabase
        .from('hero_slides')
        .update({ layout_type: 'classic' })
        .eq('id', slide.id);
      if (error) throw error;
      toast({ title: 'Hero classique restauré', description: 'La page d\'accueil affiche à nouveau le hero classique.', className: 'bg-custom-green-500 text-white' });
      fetchSlides();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erreur', description: err.message });
    }
  };

  const openDeleteConfirm = (slide) => {
    setSlideToDelete(slide);
    setIsAlertOpen(true);
  };

  const handleDelete = async () => {
    if (!slideToDelete) return;
    try {
      if (slideToDelete.image_url && slideToDelete.image_url.includes('/site_assets/')) {
        try {
          const url = new URL(slideToDelete.image_url);
          const pathParts = url.pathname.split('/site_assets/');
          if (pathParts.length > 1 && pathParts[1]) {
            await supabase.storage.from('site_assets').remove([pathParts[1]]);
          }
        } catch (urlError) {
          console.warn("Invalid URL format:", urlError);
        }
      }
      const { error } = await supabase.from('hero_slides').delete().eq('id', slideToDelete.id);
      if (error) throw error;
      toast({ title: 'Succès', description: 'La slide a été supprimée.' });
      fetchSlides();
    } catch (error) {
      console.error('Error deleting slide:', error);
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de supprimer la slide.' });
    } finally {
      setIsAlertOpen(false);
      setSlideToDelete(null);
    }
  };

  const LAYOUT_LABELS = { classic: 'Classique', fullimage: 'Image pleine', overlay: 'Fond + texte' };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Gestion du Hero d'Accueil</CardTitle>
            <CardDescription>Modifie le texte, les boutons, l'image et la mise en page du hero.</CardDescription>
          </div>
          <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Ajouter un slide
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-custom-green-500" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aperçu</TableHead>
                  <TableHead>Contenu</TableHead>
                  <TableHead>Mise en page</TableHead>
                  <TableHead>Ordre</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slides.map((slide) => (
                  <TableRow key={slide.id}>
                    <TableCell>
                      {slide.image_url ? (
                        <img src={slide.image_url} alt="Aperçu" className="h-10 w-20 object-cover rounded" />
                      ) : (
                        <div className="h-10 w-20 rounded border flex items-center justify-center text-[10px] text-gray-400" style={{ backgroundColor: slide.background_color || '#f9fafb' }}>
                          Sans image
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {slide.text_content?.[0]?.spans?.[0]?.text || 'Sans titre'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[11px]">
                        {LAYOUT_LABELS[slide.layout_type] || 'Classique'}
                      </Badge>
                    </TableCell>
                    <TableCell>{slide.order}</TableCell>
                    <TableCell>
                      <Badge variant={slide.is_active ? 'default' : 'secondary'}>
                        {slide.is_active ? 'Actif' : 'Inactif'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Ouvrir menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleBuild(slide)}>🎨 Modifier dans le builder</DropdownMenuItem>
                          {slide.layout_type === 'v22' && (
                            <DropdownMenuItem onClick={() => handleRestoreClassic(slide)} className="text-amber-600">
                              ↩ Restaurer hero classique
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => openDeleteConfirm(slide)} className="text-red-600">
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!loading && slides.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-2">Aucun slide trouvé.</p>
              <p className="text-xs text-gray-400 mb-4">Vérifie les permissions de la table hero_slides dans Supabase.</p>
              <Button variant="outline" onClick={fetchSlides}>Réessayer</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <HeroBuilderV22
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        slide={selectedSlide}
        onSave={handleSave}
      />

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce slide ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le slide et son image seront définitivement supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              <Trash2 className="mr-2 h-4 w-4" />
              Oui, supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});

export default AdminHeroTab;
