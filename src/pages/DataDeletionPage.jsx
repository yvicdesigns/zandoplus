import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  User, 
  FileText, 
  MessageSquare, 
  Heart, 
  Star,
  ShoppingBag,
  Loader2
} from 'lucide-react';
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

const DataDeletionPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: user?.email || '',
    reason: '',
    confirmEmail: ''
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [existingRequest, setExistingRequest] = useState(null);
  const [loadingRequest, setLoadingRequest] = useState(true);

  useEffect(() => {
    if (user) {
      checkExistingRequest();
    } else {
      setLoadingRequest(false);
    }
  }, [user]);

  const checkExistingRequest = async () => {
    try {
      const { data, error } = await supabase
        .from('data_deletion_requests')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['pending', 'processing'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setExistingRequest(data);
    } catch (error) {
      console.error('Error checking existing request:', error);
    } finally {
      setLoadingRequest(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.email) {
      toast({
        title: "Email requis",
        description: "Veuillez entrer votre adresse email.",
        variant: "destructive"
      });
      return false;
    }

    if (user && formData.email !== user.email) {
      toast({
        title: "Email incorrect",
        description: "L'email ne correspond pas à votre compte.",
        variant: "destructive"
      });
      return false;
    }

    if (user && formData.confirmEmail !== user.email) {
      toast({
        title: "Confirmation requise",
        description: "Veuillez confirmer votre adresse email.",
        variant: "destructive"
      });
      return false;
    }

    if (!agreedToTerms) {
      toast({
        title: "Acceptation requise",
        description: "Vous devez accepter les conditions de suppression.",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setShowConfirmDialog(true);
  };

  const confirmDeletion = async () => {
    setIsSubmitting(true);
    setShowConfirmDialog(false);

    try {
      const { error } = await supabase
        .from('data_deletion_requests')
        .insert({
          user_id: user?.id || null,
          email: formData.email,
          reason: formData.reason || null,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Demande envoyée avec succès",
        description: "Votre demande de suppression de données a été enregistrée. Vous recevrez une confirmation par email.",
      });

      setTimeout(() => {
        if (user) {
          navigate('/profile');
        } else {
          navigate('/');
        }
      }, 2000);

    } catch (error) {
      console.error('Error submitting deletion request:', error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de l'envoi de votre demande. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const dataCategories = [
    {
      icon: User,
      title: "Informations de profil",
      description: "Nom complet, photo de profil, numéro de téléphone, localisation, biographie",
      color: "text-blue-600 bg-blue-100"
    },
    {
      icon: FileText,
      title: "Annonces publiées",
      description: "Toutes vos annonces actives et archivées, y compris les photos et descriptions",
      color: "text-green-600 bg-green-100"
    },
    {
      icon: MessageSquare,
      title: "Messages et conversations",
      description: "Historique complet de vos conversations avec d'autres utilisateurs",
      color: "text-purple-600 bg-purple-100"
    },
    {
      icon: Heart,
      title: "Favoris et recherches",
      description: "Annonces sauvegardées et recherches enregistrées",
      color: "text-red-600 bg-red-100"
    },
    {
      icon: Star,
      title: "Avis et évaluations",
      description: "Avis que vous avez donnés et reçus",
      color: "text-yellow-600 bg-yellow-100"
    },
    {
      icon: ShoppingBag,
      title: "Historique de transactions",
      description: "Demandes de boost, publicités, et autres transactions",
      color: "text-indigo-600 bg-indigo-100"
    }
  ];

  const deletionSteps = [
    {
      number: 1,
      title: "Soumission de la demande",
      description: "Remplissez le formulaire ci-dessous et soumettez votre demande de suppression."
    },
    {
      number: 2,
      title: "Vérification",
      description: "Notre équipe vérifiera votre identité et validera votre demande sous 48-72 heures."
    },
    {
      number: 3,
      title: "Période de grâce",
      description: "Vous disposerez de 7 jours pour annuler votre demande si vous changez d'avis."
    },
    {
      number: 4,
      title: "Suppression définitive",
      description: "Après la période de grâce, toutes vos données seront définitivement supprimées."
    }
  ];

  if (loadingRequest) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-custom-green-500" />
      </div>
    );
  }

  if (existingRequest) {
    return (
      <>
        <Helmet>
          <title>Demande de Suppression en Cours - Zando+ Congo</title>
          <meta name="description" content="Votre demande de suppression de données est en cours de traitement." />
        </Helmet>
        <div className="container mx-auto px-4 py-12 max-w-3xl">
          <Card className="border-2 border-yellow-200">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-yellow-100 p-3 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Demande en Cours</CardTitle>
                  <CardDescription>Votre demande de suppression est en cours de traitement</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Vous avez déjà une demande de suppression de données en cours. Statut actuel : <strong>{existingRequest.status === 'pending' ? 'En attente' : 'En traitement'}</strong>
                </AlertDescription>
              </Alert>
              
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p className="text-sm text-gray-600">
                  <strong>Date de la demande :</strong> {new Date(existingRequest.created_at).toLocaleDateString('fr-FR', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
                {existingRequest.reason && (
                  <p className="text-sm text-gray-600">
                    <strong>Raison :</strong> {existingRequest.reason}
                  </p>
                )}
              </div>

              <p className="text-sm text-gray-600">
                Notre équipe traite votre demande. Vous recevrez une notification par email une fois le processus terminé.
              </p>

              <Button onClick={() => navigate('/profile')} className="w-full">
                Retour au Profil
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Suppression de Données - Zando+ Congo</title>
        <meta name="description" content="Demandez la suppression de votre compte et de vos données personnelles sur Zando+ Congo." />
      </Helmet>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Confirmer la Suppression
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Cette action est <strong>irréversible</strong>. Toutes vos données seront définitivement supprimées après la période de grâce de 7 jours.</p>
              <p className="text-red-600 font-semibold">Êtes-vous absolument sûr de vouloir continuer ?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeletion}
              className="bg-red-600 hover:bg-red-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                'Oui, supprimer mes données'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <Trash2 className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Suppression de Données</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Demandez la suppression complète de votre compte et de toutes vos données personnelles
          </p>
        </div>

        <Alert className="mb-8 border-red-200 bg-red-50">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Attention :</strong> Cette action est irréversible. Une fois vos données supprimées, elles ne pourront pas être récupérées.
          </AlertDescription>
        </Alert>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-600" />
                Processus de Suppression
              </CardTitle>
              <CardDescription>Voici comment se déroule la suppression de vos données</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {deletionSteps.map((step) => (
                  <div key={step.number} className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-custom-green-100 text-custom-green-600 flex items-center justify-center font-bold">
                        {step.number}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{step.title}</h3>
                      <p className="text-sm text-gray-600">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                Données Concernées
              </CardTitle>
              <CardDescription>Toutes ces données seront définitivement supprimées</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dataCategories.map((category, index) => (
                  <div key={index} className="flex gap-3">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${category.color} flex items-center justify-center`}>
                      <category.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm mb-1">{category.title}</h3>
                      <p className="text-xs text-gray-600">{category.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">Formulaire de Demande</CardTitle>
            <CardDescription>
              Remplissez ce formulaire pour soumettre votre demande de suppression de données
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Adresse Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  disabled={!!user}
                />
                <p className="text-xs text-gray-500">
                  {user ? "Email de votre compte connecté" : "L'email associé à votre compte"}
                </p>
              </div>

              {user && (
                <div className="space-y-2">
                  <Label htmlFor="confirmEmail">Confirmer l'Email *</Label>
                  <Input
                    id="confirmEmail"
                    name="confirmEmail"
                    type="email"
                    placeholder="Confirmez votre email"
                    value={formData.confirmEmail}
                    onChange={handleInputChange}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Veuillez confirmer votre adresse email pour continuer
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="reason">Raison de la suppression (optionnel)</Label>
                <Textarea
                  id="reason"
                  name="reason"
                  placeholder="Dites-nous pourquoi vous souhaitez supprimer votre compte..."
                  value={formData.reason}
                  onChange={handleInputChange}
                  rows={4}
                />
                <p className="text-xs text-gray-500">
                  Vos commentaires nous aident à améliorer notre service
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="terms"
                    checked={agreedToTerms}
                    onCheckedChange={setAgreedToTerms}
                  />
                  <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                    Je comprends que cette action est <strong>irréversible</strong> et que toutes mes données seront définitivement supprimées après la période de grâce de 7 jours. Je confirme vouloir procéder à la suppression de mon compte et de toutes mes données personnelles.
                  </Label>
                </div>
              </div>

              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  Vous recevrez un email de confirmation une fois votre demande soumise. Vous aurez 7 jours pour annuler cette demande si vous changez d'avis.
                </AlertDescription>
              </Alert>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Soumettre la Demande
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="max-w-2xl mx-auto mt-8 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-2 text-sm text-blue-900">
                <p className="font-semibold">Besoin d'aide ?</p>
                <p>
                  Si vous avez des questions concernant la suppression de vos données ou si vous souhaitez simplement désactiver temporairement votre compte, contactez-nous à{' '}
                  <a href="mailto:support@zandoplus.com" className="underline font-semibold">
                    support@zandoplus.com
                  </a>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default DataDeletionPage;