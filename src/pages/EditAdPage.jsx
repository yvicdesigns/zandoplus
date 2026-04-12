import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useListings } from '@/contexts/ListingsContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { steps, categories } from '@/components/post-ad/postAdConstants';
import PostAdStepper from '@/components/post-ad/PostAdStepper';
import Step1BasicInfo from '@/components/post-ad/Step1BasicInfo';
import Step2Details from '@/components/post-ad/Step2Details';
import Step3Photos from '@/components/post-ad/Step3Photos';
import Step4Review from '@/components/post-ad/Step4Review';
import FormControls from '@/components/post-ad/FormControls';
import { Loader2 } from 'lucide-react';
import { uploadImagesWithWatermark } from '@/lib/imageUtils';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { sanitizeInput } from '@/lib/validationUtils';

const EditAdPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { updateListing, listings } = useListings();
  const { toast } = useToast();
  const { siteSettings } = useSiteSettings();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [formErrors, setFormErrors] = useState({});

  const [formData, setFormData] = useState({
    title: '', description: '', price: '', currency: 'FCFA', category: '', subcategory: '',
    condition: '', location: '', negotiable: false, images: [],
    delivery_method: 'pickup', delivery_fee: '', quantity: '', is_urgent: false
  });
  
  const [imageFiles, setImageFiles] = useState([]); // For new uploads
  const [existingImages, setExistingImages] = useState([]); // For existing images
  const [imagesToRemove, setImagesToRemove] = useState([]); // URLs of images to remove from storage

  useEffect(() => {
    const applyListing = (listing) => {
      if (!listing || listing.user_id !== user?.id) {
        toast({ title: "Accès non autorisé", description: "Vous ne pouvez pas modifier cette annonce.", variant: "destructive" });
        navigate('/profile');
        return;
      }
      setFormData({
        title: listing.title || '',
        description: listing.description || '',
        price: listing.price?.toString() || '',
        currency: listing.currency || 'FCFA',
        category: listing.category || '',
        subcategory: listing.subcategory || '',
        condition: listing.condition || '',
        location: listing.location || '',
        negotiable: listing.negotiable || false,
        delivery_method: listing.delivery_method || 'pickup',
        delivery_fee: listing.delivery_fee?.toString() || '',
        quantity: listing.quantity?.toString() ?? '',
        images: listing.images?.map(url => ({ id: url, url })) || [],
        is_urgent: listing.is_urgent || false,
      });
      setExistingImages(listing.images || []);
      setPageLoading(false);
    };

    if (!user) return;

    // Try context first (fast), fallback to direct Supabase fetch
    const fromContext = listings.find(l => l.id === id);
    if (fromContext) {
      applyListing(fromContext);
    } else {
      supabase.from('listings').select('*').eq('id', id).single().then(({ data, error }) => {
        if (error || !data) {
          toast({ title: "Annonce introuvable", variant: "destructive" });
          navigate('/profile');
        } else {
          applyListing(data);
        }
      });
    }
  }, [id, user, listings, navigate, toast]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value, ...(name === 'category' && { subcategory: '' }) }));
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: null }));
  };
  
  const handleRadioChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (formData.images.length + files.length > 10) {
      toast({ title: "Trop d'images", description: "Vous pouvez télécharger un maximum de 10 images.", variant: "destructive" });
      return;
    }

    const newImagePreviews = [];
    const newImageFiles = [...imageFiles];

    files.forEach(file => {
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
    if (!imageToRemove) return;

    if (existingImages.includes(imageToRemove.url)) {
      setImagesToRemove(prev => [...prev, imageToRemove.url]);
    } else {
      URL.revokeObjectURL(imageToRemove.url);
      setImageFiles(prev => prev.filter(imgFile => imgFile.id !== imageId));
    }
    
    setFormData(prev => ({ ...prev, images: prev.images.filter(img => img.id !== imageId) }));
  };

  const validateStep = (step) => {
    const errors = {};
    const isJob = formData.category && categories[formData.category]?.type === 'job';
    
    switch (step) {
      case 1:
        if (!formData.category) errors.category = "La catégorie est requise.";
        if (isJob && !formData.subcategory) errors.subcategory = "Le type de contrat est requis.";
        if (!formData.title.trim() || formData.title.trim().length < 5) errors.title = "Le titre doit comporter au moins 5 caractères.";
        if (!formData.description.trim() || formData.description.trim().length < 20) errors.description = "La description doit comporter au moins 20 caractères.";
        break;
      case 2:
        if (!isJob && (!formData.price || parseFloat(formData.price) <= 0)) errors.price = "Le prix doit être un nombre positif.";
        if (!isJob && !formData.condition) errors.condition = "L'état est requis.";
        if (!formData.location.trim()) errors.location = "La localisation est requise.";
        if (!isJob && formData.quantity && (parseInt(formData.quantity, 10) < 0 || !Number.isInteger(Number(formData.quantity)))) errors.quantity = "La quantité doit être un nombre entier positif.";
        break;
      case 3:
        if (formData.images.length === 0) errors.images = "Au moins une image est requise.";
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
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      toast({ title: "Veuillez compléter tous les champs", description: "Remplissez toutes les informations requises avant de soumettre.", variant: "destructive" });
      setCurrentStep(1);
      return;
    }

    setLoading(true);
    try {
      if (imagesToRemove.length > 0) {
        const filePaths = imagesToRemove.map(url => {
            try {
                const urlObject = new URL(url);
                const pathParts = urlObject.pathname.split('/');
                const bucketIndex = pathParts.indexOf('listing_images');
                if (bucketIndex !== -1) {
                    return pathParts.slice(bucketIndex + 1).join('/');
                }
                return null;
            } catch (e) {
                return null;
            }
        }).filter(Boolean);
        
        if (filePaths.length > 0) {
          await supabase.storage.from('listing_images').remove(filePaths);
        }
      }

      const uploadedImageUrls = await uploadImagesWithWatermark(imageFiles, user.id, siteSettings?.watermark_logo_url);
      
      const finalImageUrls = [
        ...formData.images.filter(img => existingImages.includes(img.url) && !imagesToRemove.includes(img.url)).map(img => img.url),
        ...uploadedImageUrls
      ];
      
      const isJob = formData.category && categories[formData.category]?.type === 'job';

      // XSS Protection via sanitization
      const listingData = {
        ...formData,
        title: sanitizeInput(formData.title),
        description: sanitizeInput(formData.description),
        location: sanitizeInput(formData.location),
        price: (formData.price && !isNaN(parseFloat(formData.price))) ? parseFloat(formData.price) : null,
        delivery_fee: (formData.delivery_fee && !isNaN(parseFloat(formData.delivery_fee))) ? parseFloat(formData.delivery_fee) : null,
        quantity: (formData.quantity && !isNaN(parseInt(formData.quantity, 10))) ? parseInt(formData.quantity, 10) : null,
        images: finalImageUrls,
        status: formData.quantity === '0' ? 'inactive' : 'active',
        condition: isJob ? null : formData.condition,
        negotiable: isJob ? false : formData.negotiable,
        delivery_method: isJob ? 'pickup' : formData.delivery_method,
      };

      await updateListing(id, listingData);
      toast({ title: "Annonce modifiée avec succès !", description: "Votre annonce a été mise à jour.", className: "bg-custom-green-500 text-white" });
      navigate('/profile');
    } catch (error) {
      console.error("Erreur lors de la modification:", error);
      toast({ title: "Erreur lors de la modification", description: error.message || "Une erreur s'est produite.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <Step1BasicInfo formData={formData} formErrors={formErrors} handleInputChange={handleInputChange} handleSelectChange={handleSelectChange} />;
      case 2: return <Step2Details formData={formData} formErrors={formErrors} handleInputChange={handleInputChange} handleSelectChange={handleSelectChange} handleRadioChange={handleRadioChange} />;
      case 3: return <Step3Photos formData={formData} formErrors={formErrors} handleImageUpload={handleImageUpload} removeImage={removeImage} />;
      case 4: return <Step4Review 
                        formData={formData} 
                        onBack={prevStep} 
                        onSubmit={handleSubmit} 
                        isSubmitting={loading} 
                        submitButtonText="Enregistrer les modifications"
                        isSubmittingText="Enregistrement..."
                      />;
      default: return null;
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50">
        <Loader2 className="w-12 h-12 animate-spin text-custom-green-500" />
        <p className="ml-4 text-lg text-gray-700">Chargement de l'annonce...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Modifier Votre <span className="gradient-text">Annonce</span></h1>
          <p className="text-gray-600 text-lg">Mettez à jour les informations de votre annonce</p>
        </div>
        <PostAdStepper steps={steps} currentStep={currentStep} />
        <form onSubmit={handleSubmit}>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              {renderStep()}
              {currentStep < 4 && (
                <FormControls 
                  currentStep={currentStep} 
                  prevStep={prevStep} 
                  nextStep={nextStep} 
                  loading={loading}
                />
              )}
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
};

export default EditAdPage;