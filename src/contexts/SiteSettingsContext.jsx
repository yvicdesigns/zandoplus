import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const SiteSettingsContext = createContext();

export const useSiteSettings = () => useContext(SiteSettingsContext);

export const SiteSettingsProvider = ({ children }) => {
  const [siteSettings, setSiteSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSiteSettings = async () => {
    setLoading(true);
    try {
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 6000)
      );
      const { data, error } = await Promise.race([
        supabase
          .from('site_settings')
          .select('whatsapp_number, logo_url, favicon_url, footer_logo_url, good_example_image_url, bad_example_image_url, watermark_logo_url, launch_date, zando_delivery_fee, latest_ios_version, latest_android_version, min_ios_version, min_android_version')
          .eq('id', 1)
          .single(),
        timeout,
      ]);

      if (error) throw error;
      setSiteSettings(data);
    } catch (error) {
      console.error("Erreur lors du chargement des paramètres du site:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSiteSettings();
  }, []);

  const updateSiteSettings = async (newSettings) => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .update(newSettings)
        .eq('id', 1)
        .select('whatsapp_number, logo_url, favicon_url, footer_logo_url, good_example_image_url, bad_example_image_url, watermark_logo_url, launch_date, zando_delivery_fee, latest_ios_version, latest_android_version, min_ios_version, min_android_version')
        .single();

      if (error) {
        throw error;
      }
      setSiteSettings(data);
      toast({
        title: "Paramètres mis à jour",
        description: "Les paramètres du site ont été enregistrés avec succès.",
        className: "bg-custom-green-500 text-white",
      });
      return true;
    } catch (error) {
      console.error("Erreur lors de la mise à jour des paramètres du site:", error.message);
      toast({
        title: "Erreur de mise à jour",
        description: "Impossible d'enregistrer les paramètres du site.",
        variant: "destructive",
      });
      return false;
    }
  };

  return (
    <SiteSettingsContext.Provider value={{ siteSettings, loading, fetchSiteSettings, updateSiteSettings }}>
      {children}
    </SiteSettingsContext.Provider>
  );
};