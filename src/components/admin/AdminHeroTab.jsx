import React, { memo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Sparkles, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

/* ── Nouveau Hero Builder (v2, éditeur drag & drop, table hero_slides_v2) ──
   Remplace l'ancien éditeur de slides (HeroSlideEditor / table hero_slides) dans l'admin.
   L'ancien système reste dans le code (réversible) mais n'est plus affiché ici — toute la
   gestion du Hero d'accueil passe désormais par ce nouvel éditeur.
   Requête isolée sur `site_settings`, séparée de SiteSettingsContext : si la colonne
   `hero_v2_enabled` n'existe pas encore (migration pas encore jouée), cette carte échoue
   silencieusement sans jamais casser le fetch partagé des réglages du site. */
const HeroV2ToggleCard = () => {
  const { toast } = useToast();
  const [enabled, setEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [columnMissing, setColumnMissing] = useState(false);

  useEffect(() => {
    supabase.from('site_settings').select('hero_v2_enabled').eq('id', 1).single()
      .then(({ data, error }) => {
        if (error) { setColumnMissing(true); return; }
        setEnabled(!!data?.hero_v2_enabled);
      });
  }, []);

  const toggle = async () => {
    setSaving(true);
    const { data, error } = await supabase.from('site_settings').update({ hero_v2_enabled: !enabled }).eq('id', 1).select('hero_v2_enabled');
    if (error) {
      toast({ variant: 'destructive', title: 'Erreur', description: error.message });
    } else if (!data || data.length === 0) {
      toast({ variant: 'destructive', title: 'Non enregistré', description: "La base de données a refusé la modification (droits insuffisants sur ton compte). Aucun changement n'a été appliqué." });
    } else {
      setEnabled(!!data[0].hero_v2_enabled);
    }
    setSaving(false);
  };

  if (columnMissing) {
    return (
      <Card className="border-amber-200 bg-amber-50/40">
        <CardContent className="pt-5 text-[12px] text-amber-800">
          ⚠️ La colonne <code>hero_v2_enabled</code> n'existe pas encore sur <code>site_settings</code>.
          Lance <code>supabase_migration_hero_v2_toggle.sql</code> dans le SQL Editor de Supabase pour activer cette bascule.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-violet-200 bg-violet-50/40">
      <CardContent className="pt-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-violet-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[13px] font-semibold text-gray-800">Hero Builder</p>
            <p className="text-[12px] text-gray-500 mt-0.5">
              {enabled
                ? 'Actif — tous les visiteurs voient les slides créées dans l’éditeur.'
                : "Désactivé — les visiteurs voient toujours le Hero actuellement en ligne. Toi seul peux vérifier le rendu via le lien d'aperçu."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <a href="/admin/hero-builder-beta" className="text-[12px] font-semibold text-violet-700 hover:underline flex items-center gap-1">
            Ouvrir l'éditeur
          </a>
          <a href="/?heroPreview=v2" target="_blank" rel="noreferrer" className="text-[12px] font-semibold text-violet-700 hover:underline flex items-center gap-1">
            Aperçu en situation réelle <ExternalLink className="w-3 h-3" />
          </a>
          <Button size="sm" variant={enabled ? 'default' : 'outline'} onClick={toggle} disabled={saving}>
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (enabled ? 'Activé pour tous' : 'Activer pour tous')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const AdminHeroTab = memo(() => <HeroV2ToggleCard />);

export default AdminHeroTab;
