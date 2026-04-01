import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { deliveryMethods } from './postAdConstants';

const Step4Review = ({ formData, onBack, onSubmit, isSubmitting, submitButtonText = "Publier l'annonce", isSubmittingText = "Publication..." }) => {
  
  const getDeliveryMethodLabel = (value) => {
    const method = deliveryMethods.find(m => m.value === value);
    return method ? method.label : 'Non spécifié';
  };

  const isJobOrService = ['job', 'service'].includes(formData.categoryType);

  return (
    <Card className="w-full max-w-3xl mx-auto border-0 shadow-none bg-transparent">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-gray-800">
          Vérification et Publication
        </CardTitle>
        <p className="text-gray-600">Veuillez vérifier les informations de votre annonce avant de la publier.</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4 p-4 border rounded-lg bg-slate-50">
          <h3 className="font-bold text-lg text-gray-800">Récapitulatif de l'annonce</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div><strong>Titre:</strong> <p className="text-gray-700">{formData.title}</p></div>
            <div><strong>Catégorie:</strong> <p className="text-gray-700">{formData.categoryName} {formData.subcategory && `> ${formData.subcategory}`}</p></div>
            <div><strong>{isJobOrService ? 'Rémunération' : 'Prix'}:</strong> <p className="text-custom-green-600 font-bold">{formData.price ? `${parseFloat(formData.price).toLocaleString()} ${formData.currency}` : 'Non spécifié'}</p></div>
            {!isJobOrService && <div><strong>État:</strong> <p className="text-gray-700">{formData.condition || 'N/A'}</p></div>}
            <div className="md:col-span-2"><strong>Localisation:</strong> <p className="text-gray-700">{formData.location}</p></div>
            <div className="md:col-span-2"><strong>Description:</strong> <p className="text-gray-700 whitespace-pre-wrap">{formData.description}</p></div>
            {!isJobOrService && <div><strong>Négociable:</strong> <Badge variant={formData.negotiable ? 'default' : 'secondary'}>{formData.negotiable ? 'Oui' : 'Non'}</Badge></div>}
            <div><strong>Urgent:</strong> <Badge variant={formData.is_urgent ? 'destructive' : 'secondary'}>{formData.is_urgent ? 'Oui' : 'Non'}</Badge></div>
            {!isJobOrService && (
                <>
                    <div><strong>Mode de livraison:</strong> <p className="text-gray-700">{getDeliveryMethodLabel(formData.delivery_method)}</p></div>
                    {formData.delivery_method === 'seller_delivery' && formData.delivery_fee > 0 && (
                      <div><strong>Frais de livraison:</strong> <p className="text-gray-700">{`${parseFloat(formData.delivery_fee).toLocaleString()} ${formData.currency}`}</p></div>
                    )}
                </>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-bold text-lg text-gray-800">Photos</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {formData.images.map((image, index) => (
              <div key={image.id || index} className="relative aspect-square">
                <img src={image.url} alt={`Aperçu ${index + 1}`} className="w-full h-full object-cover rounded-lg" />
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center pt-6 border-t">
          <Button variant="outline" onClick={onBack} disabled={isSubmitting}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Précédent
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitting} className="gradient-bg hover:opacity-90">
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isSubmittingText}
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                {submitButtonText}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default Step4Review;