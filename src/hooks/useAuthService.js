import { useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { translateSupabaseError } from '@/lib/authUtils';

export const useAuthService = (user, toast) => {
  const [isLoading, setIsLoading] = useState(false);

  const updateProfile = useCallback(async (updatedData) => {
    if (!user) return;
    setIsLoading(true);

    const profileUpdates = {
      updated_at: new Date().toISOString(),
    };
    
    if ('name' in updatedData) profileUpdates.full_name = updatedData.name;
    if ('phone' in updatedData) profileUpdates.phone = updatedData.phone;
    if ('location' in updatedData) profileUpdates.location = updatedData.location;
    if ('bio' in updatedData) profileUpdates.bio = updatedData.bio;
    if ('avatar_url' in updatedData) profileUpdates.avatar_url = updatedData.avatar_url;
    if ('banner_url' in updatedData) profileUpdates.banner_url = updatedData.banner_url;
    if ('plan' in updatedData) profileUpdates.plan = updatedData.plan;

    if (Object.keys(profileUpdates).length === 1 && !updatedData.plan) {
        setIsLoading(false);
        return;
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .update(profileUpdates)
      .eq('id', user.id)
      .select('*, plan')
      .single();

    if (error) {
      console.error('Erreur de mise à jour du profil:', error);
      toast({
        title: "Erreur de mise à jour",
        description: "Impossible de mettre à jour le profil. Veuillez réessayer.",
        variant: "destructive",
      });
      setIsLoading(false);
      throw error;
    }
    
    setIsLoading(false);
    return profile;
  }, [user, toast]);

  const updatePassword = useCallback(async (newPassword) => {
    if (!user) throw new Error("Utilisateur non authentifié.");
    
    const { data, error } = await supabase.auth.updateUser({
        password: newPassword
    });

    if (error) {
        console.error('Erreur de mise à jour du mot de passe:', error);
        throw new Error(translateSupabaseError(error));
    }

    toast({
        title: "Mot de passe mis à jour",
        description: "Votre mot de passe a été changé avec succès.",
        className: "bg-custom-green-500 text-white"
    });

    return data;
  }, [user, toast]);

  const getVerificationStatus = useCallback(async () => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('verification_requests')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Erreur lors de la récupération du statut de vérification:', error);
      return null;
    }
    return data;
  }, [user]);

  const uploadVerificationDocument = useCallback(async (file, type) => {
    if (!user) throw new Error("Utilisateur non authentifié");

    const fileExt = file.name.split('.').pop();
    const fileName = `${type}-${Date.now()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    const { error } = await supabase.storage
      .from('verification_documents')
      .upload(filePath, file);

    if (error) {
      throw error;
    }
    
    return filePath;
  }, [user]);

  const submitVerificationRequest = useCallback(async (requestData) => {
    if (!user) throw new Error("Utilisateur non authentifié");
    
    const { data: existingRequest, error: fetchError } = await supabase
      .from('verification_requests')
      .select('id')
      .eq('user_id', user.id)
      .single();
      
    if(fetchError && fetchError.code !== 'PGRST116') throw fetchError;

    const payload = {
      ...requestData,
      user_id: user.id,
      status: 'pending',
      updated_at: new Date().toISOString()
    };
    
    let result;
    if (existingRequest) {
      const { data, error } = await supabase
        .from('verification_requests')
        .update(payload)
        .eq('id', existingRequest.id)
        .select()
        .single();
      if(error) throw error;
      result = data;
    } else {
       const { data, error } = await supabase
        .from('verification_requests')
        .insert(payload)
        .select()
        .single();
       if(error) throw error;
       result = data;
    }

    return result;
  }, [user]);

  return {
    isServiceLoading: isLoading,
    updateProfile,
    updatePassword,
    getVerificationStatus,
    uploadVerificationDocument,
    submitVerificationRequest,
  };
};