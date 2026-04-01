import React, { memo, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle, Loader2, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import EditHeroSlideDialog from '@/components/admin/EditHeroSlideDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const AdminHeroTab = memo(() => {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlide, setSelectedSlide] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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
      setSlides(data);
    } catch (error) {
      console.error("Error fetching slides:", error);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les slides." });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSlides();
  }, [fetchSlides]);

  const handleEdit = (slide) => {
    setSelectedSlide(slide);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setSelectedSlide(null);
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    fetchSlides();
  };

  const openDeleteConfirm = (slide) => {
    setSlideToDelete(slide);
    setIsAlertOpen(true);
  };
  
  const handleDelete = async () => {
    if (!slideToDelete) return;
    try {
      // Safely attempt to delete image from storage if it exists and is hosted on our Supabase bucket
      if (slideToDelete.image_url && slideToDelete.image_url.includes('/site_assets/')) {
        try {
            const url = new URL(slideToDelete.image_url);
            const pathParts = url.pathname.split('/site_assets/');
            if (pathParts.length > 1) {
                const path = pathParts[1];
                if (path) {
                    const { error: storageError } = await supabase.storage.from('site_assets').remove([path]);
                    if (storageError) {
                         console.warn("Storage deletion warning:", storageError.message);
                    }
                }
            }
        } catch (urlError) {
             console.warn("Invalid URL format for deletion:", urlError);
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


  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Gestion du Carrousel d'Accueil</CardTitle>
            <CardDescription>Ajoutez, modifiez ou supprimez les slides de la page d'accueil.</CardDescription>
          </div>
          <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Ajouter une Slide
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
                        <div className="h-10 w-20 rounded" style={{ backgroundColor: slide.background_color || '#000' }}></div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {(slide.text_content && slide.text_content[0]?.spans[0]?.text) || 'Sans titre'}
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
                          <DropdownMenuItem onClick={() => handleEdit(slide)}>Modifier</DropdownMenuItem>
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
                <p>Aucune slide trouvée.</p>
                <Button variant="link" onClick={handleAddNew}>Commencez par en ajouter une.</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <EditHeroSlideDialog 
        isOpen={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)} 
        slide={selectedSlide}
        onSave={handleSave}
      />
      
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer cette slide ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La slide et son image seront définitivement supprimées.
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