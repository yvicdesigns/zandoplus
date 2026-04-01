import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useListings } from '@/contexts/ListingsContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileTabs from '@/components/profile/ProfileTabs';
import { Helmet } from 'react-helmet-async';
import { useToast } from '@/components/ui/use-toast';
import EditProfileDialog from '@/components/profile/EditProfileDialog';
import BannerEditorDialog from '@/components/profile/BannerEditorDialog';
import 'react-image-crop/dist/ReactCrop.css';
import { v4 as uuidv4 } from 'uuid';
import imageCompression from 'browser-image-compression';

const ProfilePage = () => {
  const { user, updateUser, isLoading: authLoading } = useAuth();
  const { listings, favorites, loading: listingsLoading } = useListings();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [messagesCount, setMessagesCount] = useState(0);
  const [isEditProfileOpen, setEditProfileOpen] = useState(false);
  const [isBannerEditorOpen, setBannerEditorOpen] = useState(false);
  const [bannerImageSrc, setBannerImageSrc] = useState(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchMessageCount = async () => {
      if (!user) return;
      try {
        const { count, error } = await supabase
          .from('conversations')
          .select('*', { count: 'exact', head: true })
          .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);
        
        if (!error) {
          setMessagesCount(count || 0);
        }
      } catch (err) {
        console.error("Error fetching message count:", err);
      }
    };
    fetchMessageCount();
  }, [user]);

  // Updated Profile Save handler with robust error handling and proper async flow
  const handleProfileSave = async (updatedData) => {
    if (!user) return;
    
    try {
      // 1. Perform Supabase update
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: updatedData.name, // Already sanitized in dialog
          phone: updatedData.phone,
          location: updatedData.location,
          bio: updatedData.bio,
        })
        .eq('id', user.id);

      if (error) {
        console.error("Supabase update error:", error);
        throw new Error(error.message || "Erreur base de données");
      }

      // 2. Force session/context update to reflect changes immediately
      if (typeof updateUser === 'function') {
        await updateUser();
      } else {
        // Fallback: manually fetch and update or force reload if context is missing
        console.warn("updateUser function not found in context. Refreshing page to sync state.");
        window.location.reload();
        return;
      }

      // 3. Close dialog and show success message
      setEditProfileOpen(false);
      toast({ 
        title: "Profil mis à jour", 
        description: "Vos informations ont été sauvegardées avec succès.",
        className: "bg-green-500 text-white" 
      });
      
    } catch (error) {
      console.error("ProfileSave caught error:", error);
      // Let the dialog catch this to display an inline error, but also show a generic toast
      toast({ 
        title: "Échec de la mise à jour", 
        description: "Vérifiez votre connexion et réessayez.", 
        variant: "destructive" 
      });
      throw error; // Rethrow so the Dialog can stop loading state
    }
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
      });

      const filePath = `${user.id}/profile/${uuidv4()}`;
      const { error: uploadError } = await supabase.storage
        .from('profile_assets')
        .upload(filePath, compressedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile_assets')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (dbError) throw dbError;

      if (typeof updateUser === 'function') await updateUser();
      toast({ title: "Avatar mis à jour", description: "Votre nouvelle photo de profil est en place.", className: "bg-green-500 text-white" });
    } catch (error) {
      toast({ title: "Erreur d'upload", description: error.message, variant: "destructive" });
    } finally {
      setIsUploadingAvatar(false);
      event.target.value = null; // Reset input
    }
  };

  const handleBannerUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.addEventListener('load', () => setBannerImageSrc(reader.result?.toString() || ''));
      reader.readAsDataURL(file);
      setBannerEditorOpen(true);
    }
    event.target.value = null; // Reset input
  };

  const handleBannerSave = async (croppedImageBlob) => {
    if (!croppedImageBlob) return;
    setIsUploadingBanner(true);
    try {
      const filePath = `${user.id}/profile/banner-${uuidv4()}`;
      const { error: uploadError } = await supabase.storage
        .from('profile_assets')
        .upload(filePath, croppedImageBlob, { contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('profile_assets').getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from('profiles')
        .update({ banner_url: publicUrl })
        .eq('id', user.id);

      if (dbError) throw dbError;

      if (typeof updateUser === 'function') await updateUser();
      toast({ title: "Bannière mise à jour", description: "Votre nouvelle bannière est magnifique !", className: "bg-green-500 text-white" });
    } catch (error) {
      toast({ title: "Erreur d'upload", description: error.message, variant: "destructive" });
    } finally {
      setIsUploadingBanner(false);
      setBannerEditorOpen(false);
    }
  };
  
  const handleDeleteBanner = async () => {
    if (!user.banner_url) return;
    setIsUploadingBanner(true);
    try {
      const urlParts = user.banner_url.split('/');
      const filePath = urlParts.slice(urlParts.indexOf('profile_assets') + 1).join('/');
      
      const { error: storageError } = await supabase.storage.from('profile_assets').remove([filePath]);
      if (storageError) console.warn("Could not delete old banner from storage, might not exist:", storageError.message);

      const { error: dbError } = await supabase.from('profiles').update({ banner_url: null }).eq('id', user.id);
      if (dbError) throw dbError;

      if (typeof updateUser === 'function') await updateUser();
      toast({ title: "Bannière supprimée", description: "Votre bannière a été retirée." });
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de supprimer la bannière.", variant: "destructive" });
    } finally {
      setIsUploadingBanner(false);
    }
  };

  if (authLoading || listingsLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50">
        <Loader2 className="w-12 h-12 animate-spin text-custom-green-500" />
      </div>
    );
  }

  const userListings = listings.filter(listing => listing.user_id === user.id);
  const activeListings = userListings.filter(listing => listing.status === 'active');
  const soldListings = userListings.filter(listing => listing.status === 'sold');
  const favoriteListings = listings.filter(listing => favorites.has(listing.id));

  const stats = {
    activeListingsCount: activeListings.length,
    soldListingsCount: soldListings.length,
    messagesCount: messagesCount,
    favoritesCount: favoriteListings.length,
  };

  return (
    <>
      <Helmet>
        <title>Mon Profil - {user.full_name || user.email} - Zando+ Congo</title>
        <meta name="description" content={`Gérez votre profil, vos annonces et vos favoris sur Zando+ Congo. Bienvenue, ${user.full_name || user.email}.`} />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50">
        <div className="container mx-auto px-4 py-8">
          <ProfileHeader
            profileData={user}
            stats={stats}
            onEdit={() => setEditProfileOpen(true)}
            onEditAvatar={() => document.getElementById('avatar-upload').click()}
            onEditBanner={() => document.getElementById('banner-upload').click()}
            onDeleteBanner={handleDeleteBanner}
            isUploadingAvatar={isUploadingAvatar}
            isUploadingBanner={isUploadingBanner}
          />
          <input type="file" id="avatar-upload" accept="image/*" hidden onChange={handleAvatarUpload} />
          <input type="file" id="banner-upload" accept="image/*" hidden onChange={handleBannerUpload} />

          <ProfileTabs
            activeListings={activeListings}
            soldListings={soldListings}
            favoriteListings={favoriteListings}
            loading={listingsLoading}
          />
        </div>
      </div>
      
      <EditProfileDialog
        isOpen={isEditProfileOpen}
        onOpenChange={setEditProfileOpen}
        profileData={user}
        onSave={handleProfileSave}
      />
      <BannerEditorDialog
        isOpen={isBannerEditorOpen}
        onOpenChange={setBannerEditorOpen}
        imageSrc={bannerImageSrc}
        onSave={handleBannerSave}
        onLoadingChange={setIsUploadingBanner}
      />
    </>
  );
};

export default ProfilePage;