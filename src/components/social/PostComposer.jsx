import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePosts } from '@/contexts/PostsContext';
import { supabase } from '@/lib/customSupabaseClient';
import { uploadImagesWithWatermark } from '@/lib/imageUtils';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ImagePlus, X, Loader2, Tag } from 'lucide-react';

// Zando Social — Phase 1 : création d'une publication photo/affiche, avec
// association facultative à 0, 1 ou plusieurs annonces existantes (post_products).
// Réutilise le même pipeline d'upload que les annonces (compression + filigrane,
// bucket `listing_images`) plutôt que d'en créer un dédié — même contraintes de
// taille/format, aucun bénéfice réel à séparer pour de simples images de post.
//
// ⚠️ Composant non branché à une route pour l'instant (pas de <PostComposerPage>
// dans App.jsx) — écrit pour être testé en isolation, comme prévu à l'étape 5 de
// SOCIAL_COMMERCE_PHASE0_PLAN.md, avant de construire le feed autour.

const MAX_IMAGES = 5;

const PostComposer = ({ onPosted }) => {
  const { user } = useAuth();
  const { createPost } = usePosts();
  const { siteSettings } = useSiteSettings();
  const { toast } = useToast();

  const [caption, setCaption] = useState('');
  const [images, setImages] = useState([]); // [{ file, previewUrl }]
  const [myListings, setMyListings] = useState([]);
  const [selectedListingIds, setSelectedListingIds] = useState([]);
  const [showListingPicker, setShowListingPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('listings')
      .select('id, title, price, currency, images')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .then(({ data }) => setMyListings(data || []));
  }, [user]);

  const handlePickImages = (e) => {
    const files = Array.from(e.target.files || []).slice(0, MAX_IMAGES - images.length);
    const next = files.map((file) => ({ file, previewUrl: URL.createObjectURL(file) }));
    setImages((prev) => [...prev, ...next].slice(0, MAX_IMAGES));
    e.target.value = '';
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleListing = (id) => {
    setSelectedListingIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (images.length === 0) {
      toast({ title: 'Ajoutez au moins une image', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const mediaUrls = await uploadImagesWithWatermark(images, user.id, siteSettings?.watermark_logo_url);
      const post = await createPost({ caption, mediaUrls, listingIds: selectedListingIds });
      toast({
        title: 'Publication envoyée !',
        description: "Elle sera visible après une vérification rapide, comme pour une annonce.",
        className: 'toast-success',
      });
      setCaption('');
      setImages([]);
      setSelectedListingIds([]);
      onPosted?.(post);
    } catch (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
      <Textarea
        placeholder="Écrivez une légende…"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        rows={3}
      />

      <div className="flex flex-wrap gap-2">
        {images.map((img, i) => (
          <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
            <img src={img.previewUrl} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removeImage(i)}
              className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center text-white"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        {images.length < MAX_IMAGES && (
          <label className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:border-custom-green-400 hover:text-custom-green-500 transition-colors">
            <ImagePlus className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Ajouter</span>
            <input type="file" accept="image/*" multiple className="hidden" onChange={handlePickImages} />
          </label>
        )}
      </div>

      <div>
        <button
          type="button"
          onClick={() => setShowListingPicker((p) => !p)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-custom-green-700 hover:text-custom-green-800"
        >
          <Tag className="w-4 h-4" />
          {selectedListingIds.length > 0
            ? `${selectedListingIds.length} annonce${selectedListingIds.length > 1 ? 's' : ''} taguée${selectedListingIds.length > 1 ? 's' : ''}`
            : 'Taguer une ou plusieurs annonces (facultatif)'}
        </button>

        {showListingPicker && (
          <div className="mt-2 max-h-56 overflow-y-auto border border-gray-100 rounded-lg divide-y">
            {myListings.length === 0 && (
              <p className="text-xs text-gray-400 p-3">Vous n'avez aucune annonce active à taguer.</p>
            )}
            {myListings.map((listing) => (
              <label key={listing.id} className="flex items-center gap-2 p-2 text-sm cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={selectedListingIds.includes(listing.id)}
                  onChange={() => toggleListing(listing.id)}
                />
                <img src={listing.images?.[0]} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                <span className="flex-1 truncate">{listing.title}</span>
                <span className="text-gray-500 flex-shrink-0">{listing.price?.toLocaleString()} {listing.currency}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <Button onClick={handleSubmit} disabled={submitting} className="w-full gradient-bg">
        {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        Publier
      </Button>
    </div>
  );
};

export default PostComposer;
