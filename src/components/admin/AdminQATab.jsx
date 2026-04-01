import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, PlayCircle, Loader2, Server, Globe, Layout, Image as ImageIcon, Database, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Progress } from '@/components/ui/progress';

const AdminQATab = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const [deploymentChecklist, setDeploymentChecklist] = useState([
    { id: 1, label: "Vérifier la réponse mobile (Responsive Design)", checked: false },
    { id: 2, label: "Vérifier le flux de paiement (Simulation)", checked: false },
    { id: 3, label: "Vérifier l'envoi d'e-mails (SMTP)", checked: false },
    { id: 4, label: "Vérifier les métadonnées SEO (Helmet)", checked: false },
    { id: 5, label: "Nettoyer les données de test en base", checked: false },
    { id: 6, label: "Vérifier les clés d'API (Google Maps, etc.)", checked: false },
  ]);

  const toggleChecklist = (id) => {
    setDeploymentChecklist(prev => 
      prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item)
    );
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    setResults(null);
    setProgress(0);
    
    const diagnostics = {
      database: { status: 'pending', message: 'En attente...' },
      storage: { status: 'pending', message: 'En attente...' },
      auth: { status: 'pending', message: 'En attente...' },
      content: { status: 'pending', message: 'En attente...' },
      performance: { status: 'pending', message: 'En attente...' }
    };

    try {
      // 1. Database Connectivity Check
      setProgress(10);
      const startDb = performance.now();
      const { data: dbData, error: dbError } = await supabase.from('site_settings').select('id').limit(1);
      const dbTime = Math.round(performance.now() - startDb);
      
      diagnostics.database = {
        status: dbError ? 'error' : 'success',
        message: dbError ? `Erreur: ${dbError.message}` : `Connecté (${dbTime}ms)`,
        latency: dbTime
      };
      
      // 2. Storage Check (List buckets)
      setProgress(30);
      const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
      diagnostics.storage = {
        status: storageError ? 'error' : 'success',
        message: storageError ? `Erreur: ${storageError.message}` : `Accès OK (${buckets?.length || 0} buckets)`,
      };

      // 3. Auth Service Check
      setProgress(50);
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      diagnostics.auth = {
        status: authError ? 'error' : 'success',
        message: authError ? `Erreur Auth` : `Service Auth Actif`,
      };

      // 4. Content Integrity (Check categories)
      setProgress(70);
      const { count, error: contentError } = await supabase.from('categories').select('*', { count: 'exact', head: true });
      diagnostics.content = {
        status: contentError ? 'warning' : 'success',
        message: contentError ? 'Erreur accès catégories' : `${count} catégories détectées`,
      };

      // 5. Frontend Performance (Basic)
      setProgress(90);
      const resources = performance.getEntriesByType("resource");
      const slowResources = resources.filter(r => r.duration > 1000); // Resources taking > 1s
      diagnostics.performance = {
        status: slowResources.length > 0 ? 'warning' : 'success',
        message: slowResources.length > 0 ? `${slowResources.length} ressources lentes détectées` : 'Chargement des ressources optimal',
        details: slowResources.map(r => r.name)
      };

      setProgress(100);
      setResults(diagnostics);
      toast({
        title: "Diagnostic terminé",
        description: "Le rapport d'état du système a été généré.",
        className: "bg-green-500 text-white"
      });

    } catch (e) {
      console.error(e);
      toast({
        title: "Erreur critique",
        description: "Le diagnostic a échoué.",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const StatusIcon = ({ status }) => {
    if (status === 'success') return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    if (status === 'warning') return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    if (status === 'error') return <AlertCircle className="w-5 h-5 text-red-500" />;
    return <Loader2 className="w-5 h-5 animate-spin text-gray-400" />;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Automatic Diagnostics Column */}
        <div className="flex-1 space-y-6">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="w-5 h-5 text-primary" />
                Tests de Régression Automatisés
              </CardTitle>
              <CardDescription>
                Vérifie l'intégrité des connexions API, de la base de données et des performances.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                 <Button 
                  onClick={runDiagnostics} 
                  disabled={isRunning} 
                  className="w-full gradient-bg"
                  size="lg"
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> 
                      Diagnostic en cours... {progress}%
                    </>
                  ) : (
                    <>
                      <PlayCircle className="w-4 h-4 mr-2" /> 
                      Lancer le Diagnostic Système
                    </>
                  )}
                </Button>
                {isRunning && <Progress value={progress} className="h-2 mt-2" />}
              </div>

              {results && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Database className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="font-medium text-sm">Base de Données</p>
                        <p className="text-xs text-gray-500">{results.database.message}</p>
                      </div>
                    </div>
                    <StatusIcon status={results.database.status} />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <ImageIcon className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="font-medium text-sm">Stockage & Images</p>
                        <p className="text-xs text-gray-500">{results.storage.message}</p>
                      </div>
                    </div>
                    <StatusIcon status={results.storage.status} />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="font-medium text-sm">Authentification</p>
                        <p className="text-xs text-gray-500">{results.auth.message}</p>
                      </div>
                    </div>
                    <StatusIcon status={results.auth.status} />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Layout className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="font-medium text-sm">Contenu & Catégories</p>
                        <p className="text-xs text-gray-500">{results.content.message}</p>
                      </div>
                    </div>
                    <StatusIcon status={results.content.status} />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Globe className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="font-medium text-sm">Performance Frontend</p>
                        <p className="text-xs text-gray-500">{results.performance.message}</p>
                      </div>
                    </div>
                    <StatusIcon status={results.performance.status} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Manual Checklist Column */}
        <div className="flex-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                Checklist de Pré-déploiement
              </CardTitle>
              <CardDescription>
                Points de contrôle manuels obligatoires avant toute mise en production.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deploymentChecklist.map((item) => (
                  <div 
                    key={item.id} 
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${item.checked ? 'bg-green-50 border-green-200' : 'bg-white hover:bg-slate-50'}`}
                    onClick={() => toggleChecklist(item.id)}
                  >
                    <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 ${item.checked ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                      {item.checked && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${item.checked ? 'text-green-800' : 'text-gray-700'}`}>
                        {item.label}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Validation requise</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600">Progression</span>
                  <span className="text-sm font-bold text-primary">
                    {Math.round((deploymentChecklist.filter(i => i.checked).length / deploymentChecklist.length) * 100)}%
                  </span>
                </div>
                <Progress value={(deploymentChecklist.filter(i => i.checked).length / deploymentChecklist.length) * 100} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminQATab;