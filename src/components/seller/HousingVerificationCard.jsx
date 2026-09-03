import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Clock, XCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import FileUpload from '@/components/verification/FileUpload';

// Vérification GRATUITE réservée aux propriétaires "Maison à louer" — distincte du
// système de vérification vendeur payant (verification_requests, 10 000 FCFA). Ici,
// zéro frais, et ce n'est jamais bloquant pour publier : juste un badge de confiance
// optionnel affiché sur les annonces une fois approuvé par un admin.
const HousingVerificationCard = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [idFile, setIdFile] = useState(null);
  const [selfieFile, setSelfieFile] = useState(null);
  const [addressFile, setAddressFile] = useState(null);
  const [uploadingWhich, setUploadingWhich] = useState(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('housing_verification_requests')
      .select('id, status, rejection_reason')
      .eq('user_id', user.id)
      .maybeSingle();
    setRequest(data);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const uploadDoc = async (file, type) => {
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/housing-${type}-${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage.from('verification_documents').upload(filePath, file);
    if (error) throw error;
    return filePath;
  };

  const handleSubmit = async () => {
    if (!idFile || !selfieFile) {
      toast({ title: 'Champs requis manquants', description: "Pièce d'identité et selfie sont obligatoires.", variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      setUploadingWhich('id');
      const id_document_url = await uploadDoc(idFile, 'id');
      setUploadingWhich('selfie');
      const selfie_url = await uploadDoc(selfieFile, 'selfie');
      let proof_of_address_url = null;
      if (addressFile) {
        setUploadingWhich('address');
        proof_of_address_url = await uploadDoc(addressFile, 'address');
      }
      setUploadingWhich(null);

      const payload = { user_id: user.id, status: 'pending', id_document_url, selfie_url, proof_of_address_url, rejection_reason: null };
      const { error } = request
        ? await supabase.from('housing_verification_requests').update(payload).eq('id', request.id)
        : await supabase.from('housing_verification_requests').insert(payload);
      if (error) throw error;

      toast({ title: 'Envoyé !', description: 'Un admin va examiner vos documents sous peu.', className: 'bg-custom-green-500 text-white' });
      setIdFile(null); setSelfieFile(null); setAddressFile(null);
      setExpanded(false);
      load();
    } catch (err) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
      setUploadingWhich(null);
    }
  };

  if (loading) return null;

  // Déjà approuvé — juste un rappel discret, rien à faire
  if (request?.status === 'approved') {
    return (
      <div className="flex items-center gap-3 p-4 bg-custom-green-50 border border-custom-green-200 rounded-xl mb-5">
        <ShieldCheck className="w-6 h-6 text-custom-green-600 shrink-0" />
        <div>
          <p className="text-[13px] font-bold text-custom-green-800">Propriétaire vérifié ✅</p>
          <p className="text-[12px] text-custom-green-700">Le badge "Vérifié" apparaît sur vos annonces "Maison à louer".</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-teal-200 bg-teal-50 rounded-xl mb-5 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between gap-3 p-4 text-left"
      >
        <div className="flex items-center gap-3">
          {request?.status === 'pending' ? <Clock className="w-6 h-6 text-amber-500 shrink-0" />
            : request?.status === 'rejected' ? <XCircle className="w-6 h-6 text-red-500 shrink-0" />
            : <ShieldCheck className="w-6 h-6 text-teal-600 shrink-0" />}
          <div>
            <p className="text-[13px] font-bold text-gray-900">
              {request?.status === 'pending' ? 'Vérification en cours d\'examen'
                : request?.status === 'rejected' ? 'Vérification refusée — réessayez'
                : 'Devenir "Propriétaire Vérifié" (gratuit)'}
            </p>
            <p className="text-[12px] text-gray-600">
              {request?.status === 'pending' ? 'Un admin va examiner vos documents sous peu.'
                : request?.status === 'rejected' ? (request.rejection_reason || 'Merci de renvoyer des documents plus clairs.')
                : 'Obtenez un badge de confiance sur vos annonces. Aucun frais, jamais obligatoire pour publier.'}
            </p>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" /> : <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />}
      </button>

      {expanded && (
        <div className="p-4 pt-0 space-y-3">
          <FileUpload
            label="Pièce d'identité (carte ou passeport)"
            required
            acceptedFileTypes="image/*,application/pdf"
            onFileSelect={setIdFile}
            onFileRemove={() => setIdFile(null)}
            loading={submitting && uploadingWhich === 'id'}
            disabled={submitting}
          />
          <FileUpload
            label="Selfie avec votre pièce d'identité"
            required
            acceptedFileTypes="image/*"
            onFileSelect={setSelfieFile}
            onFileRemove={() => setSelfieFile(null)}
            loading={submitting && uploadingWhich === 'selfie'}
            disabled={submitting}
          />
          <FileUpload
            label="Facture (électricité/eau) ou titre foncier — optionnel"
            acceptedFileTypes="image/*,application/pdf"
            onFileSelect={setAddressFile}
            onFileRemove={() => setAddressFile(null)}
            loading={submitting && uploadingWhich === 'address'}
            disabled={submitting}
          />
          <Button onClick={handleSubmit} disabled={submitting} className="w-full bg-teal-600 hover:bg-teal-700">
            {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Envoyer pour vérification
          </Button>
        </div>
      )}
    </div>
  );
};

export default HousingVerificationCard;
