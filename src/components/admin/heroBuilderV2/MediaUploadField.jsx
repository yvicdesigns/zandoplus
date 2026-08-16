import React, { useRef, useState } from 'react';
import { UploadCloud, Loader2, X } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const inputCls = 'w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-[12px] outline-none focus:border-violet-400';

const LIMITS = {
  image: { maxMB: 8, accept: 'image/*' },
  video: { maxMB: 40, accept: 'video/*' },
};

// kind: 'image' | 'video' — value/onChange carry the raw URL, caller decides how to store it (CSS background string, imageUrl field, etc.)
const MediaUploadField = ({ kind, value, onChange, pathPrefix }) => {
  const { toast } = useToast();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const { maxMB, accept } = LIMITS[kind];

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith(`${kind}/`)) {
      toast({ variant: 'destructive', title: 'Fichier invalide', description: `Choisis un fichier ${kind === 'image' ? 'image' : 'vidéo'}.` });
      return;
    }
    if (file.size > maxMB * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'Fichier trop lourd', description: `Taille maximum : ${maxMB} Mo.` });
      return;
    }

    setUploading(true);
    try {
      let toUpload = file;
      let ext = file.name.split('.').pop();
      if (kind === 'image') {
        toUpload = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true, fileType: 'image/webp' });
        ext = 'webp';
      }
      const path = `${pathPrefix}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('site_assets').upload(path, toUpload, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('site_assets').getPublicUrl(path);
      onChange(data.publicUrl);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erreur upload', description: err.message });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      {value && kind === 'image' && (
        <div className="relative w-full h-20 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
          <img src={value} alt="" className="w-full h-full object-cover" />
          <button onClick={() => onChange('')} className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white rounded-full p-0.5" title="Retirer">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
      {value && kind === 'video' && (
        <div className="relative w-full h-20 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
          <video src={value} className="w-full h-full object-cover" muted />
          <button onClick={() => onChange('')} className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white rounded-full p-0.5" title="Retirer">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      <div className="flex gap-1.5">
        <input
          className={inputCls}
          placeholder={kind === 'image' ? 'https://...' : 'https://.../video.mp4'}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex-shrink-0 flex items-center gap-1 px-2.5 rounded-lg border border-gray-200 text-[11px] font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          title="Uploader depuis mon appareil"
        >
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
          {uploading ? '...' : 'Upload'}
        </button>
        <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
      </div>
      <p className="text-[10px] text-gray-400">
        {kind === 'image' ? `Image compressée automatiquement (max ${maxMB} Mo avant compression).` : `Fichier vidéo, max ${maxMB} Mo — ou colle un lien direct.`}
      </p>
    </div>
  );
};

export default MediaUploadField;
