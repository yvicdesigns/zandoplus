import { useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/customSupabaseClient';

const VISITOR_ID_KEY = 'zando_visitor_id';

export const useVisitor = () => {
  useEffect(() => {
    const trackVisitor = async () => {
      let visitorId = localStorage.getItem(VISITOR_ID_KEY);

      if (!visitorId) {
        visitorId = uuidv4();
        localStorage.setItem(VISITOR_ID_KEY, visitorId);
      }

      try {
        const { error } = await supabase.rpc('increment_site_visit', {
          p_visitor_id: visitorId,
        });

        if (error) {
          console.error('Error tracking visitor:', error.message);
        }
      } catch (error) {
        console.error('Error calling RPC function:', error.message);
      }
    };

    trackVisitor();
  }, []);
};