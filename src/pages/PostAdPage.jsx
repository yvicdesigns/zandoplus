import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useListings } from '@/contexts/ListingsContext';
import { useToast } from '@/components/ui/use-toast';
import { steps, categories } from '@/components/post-ad/postAdConstants';
import PostAdStepper from '@/components/post-ad/PostAdStepper';
import Step1BasicInfo from '@/components/post-ad/Step1BasicInfo';
import Step2Details from '@/components/post-ad/Step2Details';
import Step3Photos from '@/components/post-ad/Step3Photos';
import Step4Review from '@/components/post-ad/Step4Review';
import FormControls from '@/components/post-ad/FormControls';
import { Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { uploadImagesWithWatermark } from '@/lib/imageUtils';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { sanitizeInput } from '@/lib/validationUtils';

const PLAN_LIMITS = {
  free: 5,
  boost: 20,
  pro: Infinity,
};

const PostAdPage = () => {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const { listings, addListing, loading: listingsLoading } = useListings();
  const { toast } = useToast();
  const { siteSettings } = useSiteSettings();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [isCheckingLimit, setIsCheckingLimit] = useState(true);
  const [showLimitDialog, setShowLimitDialog] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);

  const DRAFT_KEY = 'postAdDraft';

  const [formData, setFormData] = useState(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Strip image previews from draft (can't restore blob URLs)
        return { ...parsed, images: [] };
      }
    } catch {}
    return {
      title: '', description: '', price: '', currency: 'FCFA',
      category: '', subcategory: '', categoryName: '', categoryType: '',
      condition: '', location: '', negotiable: false, images: [],
      delivery_method: 'pickup', delivery_fee: '', is_urgent: false,
      phone: '', quantity: ''
    };
  });
  const [imageFiles, setImageFiles] = useState([]);

  // Show "draft restored" notice if non-empty draft was found
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      try {
        const saved = localStorage.getItem(DRAFT_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.title || parsed.description || parsed.category) {
            setDraftRestored(true);
          }
        }
      } catch {}
    }
  }, []);

  // Autosave draft on formData change (debounced 1s)
  const saveTimer = useRef(null);
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const { images, ...dataToSave } = formData;
      localStorage.setItem(DRAFT_KEY, JSON.stringify(dataToSave));
    }, 1000);
    return () => clearTimeout(saveTimer.current);
  }, [formData]);

  useEffect(() => {
    if (user && !listingsLoading) {
      const userPlan = user.plan || 'free';
      const limit = PLAN_LIMITS[userPlan];
      const activeUserListings = listings.filter(l => l.user_id === user.id && l.status === 'active').length;

      if (activeUserListings >= limit) {
        setShowLimitDialog(true);
      } else {
        setIsCheckingLimit(false);
      }

      setFormData(prev => ({
        ...prev,
        phone: user.phone || '',
        location: prev.location || user.location || ''
      }));
    } else if (!user && !listingsLoading) {
      navigate('/');
      toast({ title: 'Non authentifié', description: 'Veuillez vous connecter pour poster une annonce.', variant: 'destructive' });
    }
  }, [user, listings, listingsLoading, navigate, toast]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleSelectChange = (name, value) => {
    const newFormData = { ...formData, [name]: value };
    
    if (name === 'category') {
      const categoryInfo = categories[value] || {};
      newFormData.subcategory = '';
      newFormData.categoryName = categoryInfo.name || '';
      newFormData.categoryType = categoryInfo.type || 'product';

      if (categoryInfo.type === 'job' || categoryInfo.type === 'service') {
        newFormData.condition = '';
        newFormData.quantity = '';
        newFormData.negotiable = false;
        newFormData.delivery_method = 'none';
      } else {
        newFormData.delivery_method = 'pickup';
      }
    }

    setFormData(newFormData);

    if (formErrors[name]) {
        const newErrors = { ...formErrors };
        delete newErrors[name];
        if (name === 'category') delete newErrors['subcategory'];
        setFormErrors(newErrors);
    }
  };

  const handleRadioChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const MAX_FILE_SIZE_MB = 5;
    const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

    if (imageFiles.length + files.length > 10) {
      toast({ title: "Trop d'images", description: "Vous pouvez télécharger un maximum de 10 images.", variant: "destructive" });
      return;
    }

    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast({ title: "Fichier invalide", description: `"${file.name}" n'est pas une image.`, variant: "destructive" });
        return false;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast({ title: "Fichier trop volumineux", description: `"${file.name}" dépasse la taille maximale de ${MAX_FILE_SIZE_MB}Mo.`, variant: "destructive" });
        return false;
      }
      return true;
    });

    if(validFiles.length === 0) return;

    const newImagePreviews = [];
    const newImageFiles = [...imageFiles];

    validFiles.forEach(file => {
      const imageId = Date.now() + Math.random();
      newImagePreviews.push({ id: imageId, url: URL.createObjectURL(file) });
      newImageFiles.push({ id: imageId, file });
    });

    setFormData(prev => ({ ...prev, images: [...prev.images, ...newImagePreviews] }));
    setImageFiles(newImageFiles);
    if (formErrors.images) setFormErrors(prev => ({ ...prev, images: null }));
  };

  const removeImage = (imageId) => {
    const imageToRemove = formData.images.find(img => img.id === imageId);
    if (imageToRemove) URL.revokeObjectURL(imageToRemove.url);
    setFormData(prev => ({ ...prev, images: prev.images.filter(img => img.id !== imageId) }));
    setImageFiles(prev => prev.filter(imgFile => imgFile.id !== imageId));
  };

  const validateStep = (step) => {
    const errors = {};
    const isJobOrService = ['job', 'service'].includes(formData.categoryType);
    
    switch (step) {
      case 1:
        if (!formData.category) errors.category = "La catégorie est requise.";
        if (formData.categoryType === 'job' && !formData.subcategory) errors.subcategory = "Le type de contrat est requis.";
        if (!formData.title.trim() || formData.title.trim().length < 5) errors.title = "Le titre doit comporter au moins 5 caractères.";
        if (!formData.description.trim() || formData.description.trim().length < 20) errors.description = "La description doit comporter au moins 20 caractères.";
        break;
      case 2:
        if (!isJobOrService && (!formData.price || parseFloat(formData.price) <= 0)) errors.price = "Le prix doit être un nombre positif.";
        if (!isJobOrService && !formData.condition) errors.condition = "L'état est requis.";
        if (!formData.location.trim()) errors.location = "La localisation est requise.";
        if (!isJobOrService && formData.quantity && (parseInt(formData.quantity, 10) < 0 || !Number.isInteger(Number(formData.quantity)))) errors.quantity = "La quantité doit être un nombre entier positif.";
        break;
      case 3:
        if (imageFiles.length === 0) errors.images = "Au moins une image est requise.";
        break;
      default: break;
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) setCurrentStep(prev => Math.min(prev + 1, 4));
    else toast({ title: "Champs Incomplets ou Invalides", description: "Veuillez corriger les erreurs et remplir tous les champs requis.", variant: "destructive" });
  };

  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Authentification requise", description: "Veuillez vous connecter.", variant: "destructive" });
      return;
    }
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      toast({ title: "Veuillez compléter tous les champs", description: "Remplissez toutes les informations requises avant de soumettre.", variant: "destructive" });
      setCurrentStep(1);
      return;
    }

    setLoading(true);
    try {
      const safePhone = sanitizeInput(formData.phone);
      if (user && safePhone && safePhone !== user.phone) {
        await updateProfile({ phone: safePhone });
        toast({ title: "Numéro de téléphone enregistré!", description: "Votre numéro a été ajouté à votre profil.", className: "bg-custom-green-500 text-white" });
      }

      const uploadedImageUrls = await uploadImagesWithWatermark(imageFiles, user.id, siteSettings?.watermark_logo_url);
      
      const isJobOrService = ['job', 'service'].includes(formData.categoryType);

      // Deep sanitize user inputs before inserting
      const listingData = {
        title: sanitizeInput(formData.title),
        description: sanitizeInput(formData.description),
        price: (formData.price && !isNaN(parseFloat(formData.price))) ? parseFloat(formData.price) : null,
        currency: formData.currency,
        category: formData.category,
        subcategory: formData.subcategory,
        condition: isJobOrService ? null : formData.condition,
        location: sanitizeInput(formData.location),
        negotiable: isJobOrService ? false : formData.negotiable,
        is_urgent: formData.is_urgent,
        images: uploadedImageUrls,
        quantity: (formData.quantity && !isNaN(parseInt(formData.quantity, 10))) ? parseInt(formData.quantity, 10) : null,
        status: formData.quantity === '0' ? 'inactive' : 'active',
        delivery_method: isJobOrService ? 'none' : formData.delivery_method,
        delivery_fee: (formData.delivery_fee && !isNaN(parseFloat(formData.delivery_fee))) ? parseFloat(formData.delivery_fee) : null,
      };

      await addListing(listingData);
      localStorage.removeItem(DRAFT_KEY);
      toast({ title: "Annonce publiée avec succès !", description: "Votre annonce est maintenant en ligne.", className: "bg-custom-green-500 text-white" });
      navigate('/profile');
    } catch (error) {
      console.error("Erreur lors de la publication:", error);
      toast({ title: "Erreur lors de la publication", description: error.message || "Une erreur s'est produite.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };
  
  if (isCheckingLimit) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50">
        <Loader2 className="w-12 h-12 animate-spin text-custom-green-500" />
        <p className="ml-4 text-lg text-gray-700">Vérification de votre compte...</p>
      </div>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <Step1BasicInfo formData={formData} formErrors={formErrors} handleInputChange={handleInputChange} handleSelectChange={handleSelectChange} />;
      case 2: return <Step2Details formData={formData} formErrors={formErrors} handleInputChange={handleInputChange} handleSelectChange={handleSelectChange} handleRadioChange={handleRadioChange} />;
      case 3: return <Step3Photos formData={formData} formErrors={formErrors} handleImageUpload={handleImageUpload} removeImage={removeImage} />;
      case 4: return <Step4Review formData={formData} onBack={prevStep} onSubmit={handleSubmit} isSubmitting={loading} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 py-8">
      <AlertDialog open={showLimitDialog} onOpenChange={setShowLimitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limite d'annonces atteinte</AlertDialogTitle>
            <AlertDialogDescription>
              Vous avez atteint la limite de publications pour votre plan actuel. Pour publier plus d'annonces, veuillez passer à un plan supérieur.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => navigate('/profile')}>Retour au profil</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button onClick={() => navigate('/pricing')} className="gradient-bg hover:opacity-90">Voir les offres</Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Publiez Votre <span className="gradient-text">Annonce</span></h1>
          <p className="text-gray-600 text-lg">Atteignez des millions d'acheteurs potentiels à travers le Congo Brazzaville</p>
        </div>
        {draftRestored && (
          <div className="mb-4 flex items-center justify-between bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3 rounded-lg">
            <span>Brouillon restauré automatiquement.</span>
            <button
              type="button"
              className="underline font-medium hover:text-amber-900"
              onClick={() => {
                localStorage.removeItem(DRAFT_KEY);
                setFormData({ title: '', description: '', price: '', currency: 'FCFA', category: '', subcategory: '', categoryName: '', categoryType: '', condition: '', location: '', negotiable: false, images: [], delivery_method: 'pickup', delivery_fee: '', is_urgent: false, phone: user?.phone || '', quantity: '' });
                setDraftRestored(false);
              }}
            >
              Effacer le brouillon
            </button>
          </div>
        )}
        <PostAdStepper steps={steps} currentStep={currentStep} />
        <form onSubmit={handleSubmit}>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              {renderStep()}
              {currentStep < 4 ? (
                <FormControls currentStep={currentStep} prevStep={prevStep} nextStep={nextStep} loading={loading} />
              ) : null}
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
};

export default PostAdPage;