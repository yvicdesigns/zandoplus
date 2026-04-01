import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';

const AdminEmailTestTab = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleTestEmail = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('test-resend-email', {
        body: { email }
      });

      if (error) {
        throw new Error(error.message || "Erreur lors de l'appel à la fonction.");
      }

      setResult(data);
    } catch (err) {
      setResult({
        success: false,
        error: err.message || "Une erreur est survenue lors de la communication avec le serveur.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" />
            Test de Configuration E-mail
          </CardTitle>
          <CardDescription>
            Vérifiez que le service d'envoi d'e-mails (Resend) est correctement configuré en envoyant un message de test.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleTestEmail} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="test-email">Adresse e-mail de destination</Label>
              <Input
                id="test-email"
                type="email"
                placeholder="Entrez votre adresse e-mail..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full"
              />
            </div>
            
            <Button 
              type="submit" 
              disabled={loading || !email}
              className="w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                'Envoyer l\'e-mail de test'
              )}
            </Button>
          </form>

          {result && (
            <div className="mt-6">
              {result.success ? (
                <Alert className="bg-green-50 border-green-200 text-green-800">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <AlertTitle>Succès</AlertTitle>
                  <AlertDescription>
                    <p className="mb-2">{result.message}</p>
                    <p className="text-sm opacity-90">Vérifiez votre boîte de réception (et vos spams) pour l'adresse <strong>{email}</strong>.</p>
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <AlertCircle className="w-4 h-4" />
                  <AlertTitle>Échec de l'envoi</AlertTitle>
                  <AlertDescription className="space-y-2">
                    <p>{result.error}</p>
                    {result.details && (
                      <div className="mt-2 p-2 bg-red-950/10 rounded-md overflow-x-auto">
                        <pre className="text-xs">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminEmailTestTab;