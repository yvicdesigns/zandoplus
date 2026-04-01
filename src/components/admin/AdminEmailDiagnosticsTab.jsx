import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/customSupabaseClient';
import { Mail, CheckCircle2, XCircle, AlertTriangle, Loader2, RefreshCw, Server, Globe, KeyRound } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const AdminEmailDiagnosticsTab = () => {
  const { toast } = useToast();
  
  const [diagnosticReport, setDiagnosticReport] = useState(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  
  const [testEmail, setTestEmail] = useState('');
  const [testSubject, setTestSubject] = useState('Test de Diagnostic SMTP Zando+');
  const [testBody, setTestBody] = useState('<p>Ceci est un e-mail de test envoyé via Resend SMTP depuis le panel d\'administration.</p>');
  
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const [isTestingRecovery, setIsTestingRecovery] = useState(false);

  useEffect(() => {
    runFullDiagnostics();
  }, []);

  const runFullDiagnostics = async () => {
    setIsDiagnosing(true);
    try {
      const { data, error } = await supabase.functions.invoke('diagnose-email-config');
      if (error) throw error;
      setDiagnosticReport(data);
    } catch (e) {
      toast({ title: "Erreur de Diagnostic", description: e.message, variant: "destructive" });
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleTestConnection = async () => {
      await runFullDiagnostics();
      toast({ title: "Test de connexion", description: "Vérification de la clé API et du domaine effectuée." });
  };

  const handleSendTest = async () => {
    if (!testEmail) {
      toast({ title: "Erreur", description: "Veuillez entrer une adresse e-mail.", variant: "destructive" });
      return;
    }
    setIsSendingTest(true);
    setTestResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('test-resend-smtp', {
          body: { testEmail, subject: testSubject, body: testBody }
      });
      
      if (error) throw error;
      
      setTestResult(data);
      if (data.success) {
        toast({ title: "Succès", description: "E-mail de test envoyé.", className: "bg-green-500 text-white" });
      } else {
        toast({ title: "Échec de l'envoi", description: data.message, variant: "destructive" });
      }
      runFullDiagnostics(); // Refresh logs
    } catch (e) {
      setTestResult({ success: false, message: e.message });
      toast({ title: "Erreur d'invocation", description: e.message, variant: "destructive" });
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleTestRecoveryEmail = async () => {
    if (!testEmail) {
      toast({ title: "Erreur", description: "Veuillez entrer une adresse e-mail pour tester la récupération.", variant: "destructive" });
      return;
    }

    setIsTestingRecovery(true);
    setTestResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('send-password-recovery-email', {
        body: { email: testEmail, redirectTo: window.location.origin + '/reset-password' }
      });

      if (error) throw error;

      setTestResult(data);
      if (data.success) {
        toast({ title: "Succès", description: "E-mail de récupération de test envoyé.", className: "bg-green-500 text-white" });
      } else {
        toast({ title: "Échec", description: data.error, variant: "destructive" });
      }
    } catch (e) {
      setTestResult({ success: false, message: e.message });
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setIsTestingRecovery(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Configuration Status Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-t-4 border-blue-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Server className="w-5 h-5 text-blue-500" /> Connexion Resend
            </CardTitle>
          </CardHeader>
          <CardContent>
             {isDiagnosing ? <Loader2 className="w-5 h-5 animate-spin" /> : 
                diagnosticReport?.resendStatus?.ok ? 
                    <div className="flex items-center text-green-600 font-medium"><CheckCircle2 className="w-5 h-5 mr-2" /> Clé API Valide</div> :
                    <div className="flex items-center text-red-600 font-medium"><XCircle className="w-5 h-5 mr-2" /> Clé API Invalide/Manquante</div>
             }
             <p className="text-sm text-gray-500 mt-2">{diagnosticReport?.resendStatus?.details}</p>
          </CardContent>
          <CardFooter>
              <Button variant="outline" size="sm" onClick={handleTestConnection} disabled={isDiagnosing} className="w-full">
                  Tester la Connexion
              </Button>
          </CardFooter>
        </Card>

        <Card className="border-t-4 border-purple-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Globe className="w-5 h-5 text-purple-500" /> Domaine Expéditeur
            </CardTitle>
          </CardHeader>
          <CardContent>
             {isDiagnosing ? <Loader2 className="w-5 h-5 animate-spin" /> : 
                diagnosticReport?.resendStatus?.domainVerified ? 
                    <div className="flex items-center text-green-600 font-medium"><CheckCircle2 className="w-5 h-5 mr-2" /> noreply@zandopluscg.com vérifié</div> :
                    <div className="flex items-center text-red-600 font-medium"><XCircle className="w-5 h-5 mr-2" /> Domaine non vérifié</div>
             }
             <p className="text-sm text-gray-500 mt-2">Le domaine doit être vérifié dans Resend pour éviter les spams.</p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-yellow-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-500" /> Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-32 overflow-y-auto">
             {isDiagnosing ? <Loader2 className="w-5 h-5 animate-spin" /> : 
                diagnosticReport?.recommendations?.length > 0 ? (
                    <ul className="list-disc pl-4 text-sm text-gray-700 space-y-1">
                        {diagnosticReport.recommendations.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                ) : <span className="text-sm text-green-600">Aucune action requise. Configuration optimale.</span>
             }
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Email Form */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" /> Test d'Envoi Direct
            </CardTitle>
            <CardDescription>Validez la délivrabilité en envoyant un e-mail réel.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
                <label className="text-sm font-medium">Adresse de destination</label>
                <Input type="email" placeholder="test@exemple.com" value={testEmail} onChange={e => setTestEmail(e.target.value)} />
            </div>
            
            {testResult && (
              <div className={`p-4 rounded-lg text-sm border ${testResult.success ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                 <div className="font-bold mb-1">{testResult.success ? "Opération réussie" : "Échec de l'opération"}</div>
                 <div className="font-mono text-xs overflow-x-auto">
                     {testResult.message || testResult.error}
                     {testResult.errorCode && <div>Code: {testResult.errorCode}</div>}
                 </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-3">
            <Button onClick={handleSendTest} disabled={isSendingTest || isTestingRecovery} className="w-full flex-1" variant="outline">
               {isSendingTest ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
               Test Simple
            </Button>
            <Button onClick={handleTestRecoveryEmail} disabled={isSendingTest || isTestingRecovery} className="w-full flex-1 bg-blue-600 hover:bg-blue-700 text-white">
               {isTestingRecovery ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <KeyRound className="w-4 h-4 mr-2" />}
               Test Flux Réinitialisation
            </Button>
          </CardFooter>
        </Card>

        {/* Supabase Auth Checklist */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Nouveau Flux Edge Function</CardTitle>
            <CardDescription>Détails sur la réinitialisation de mot de passe</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-gray-700">
             <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-bold mb-2 text-blue-800 flex items-center"><CheckCircle2 className="w-4 h-4 mr-2" /> Fonction Edge Active</h4>
                <p className="mb-2">La page de réinitialisation utilise désormais une fonction Edge dédiée : <code>send-password-recovery-email</code>.</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Contourne les limitations SMTP natives de Supabase</li>
                    <li>Utilise directement l'API Resend HTTP pour plus de fiabilité</li>
                    <li>Génère des liens administratifs (Admin API) sécurisés</li>
                </ul>
             </div>
             
             <div className="bg-gray-50 p-4 rounded-lg border">
                <h4 className="font-bold mb-2">Variables d'environnement requises</h4>
                <ul className="list-disc pl-5 space-y-1 font-mono text-xs">
                    <li>RESEND_API_KEY</li>
                    <li>SUPABASE_URL</li>
                    <li>SUPABASE_SERVICE_ROLE_KEY</li>
                </ul>
             </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Failures Log */}
      <Card className="shadow-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
              <CardTitle>Échecs d'Envoi Récents (24h)</CardTitle>
              <CardDescription>Journalisé depuis system_logs pour analyser les problèmes en production.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={runFullDiagnostics} disabled={isDiagnosing}><RefreshCw className={`w-4 h-4 mr-2 ${isDiagnosing?'animate-spin':''}`}/> Actualiser</Button>
        </CardHeader>
        <CardContent>
          {isDiagnosing && !diagnosticReport ? (
            <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
          ) : diagnosticReport?.recentErrors?.length === 0 ? (
            <div className="text-center p-8 text-green-600 bg-green-50 rounded-lg border border-green-100 flex flex-col items-center">
                <CheckCircle2 className="w-8 h-8 mb-2" />
                <span>Aucune erreur d'e-mail détectée dans les dernières 24 heures.</span>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Email (Masqué)</TableHead>
                    <TableHead>Erreur / Code</TableHead>
                    <TableHead>Contexte</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {diagnosticReport?.recentErrors?.map(log => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</TableCell>
                      <TableCell className="text-xs font-mono">{log.context?.email || log.context?.testEmail || 'N/A'}</TableCell>
                      <TableCell className="text-xs text-red-600 max-w-[250px] truncate" title={log.message}>
                        <span className="font-bold">{log.context?.errorCode || 'ERR'}:</span> {log.message}
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {log.context?.action || log.context?.function || 'unknown'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminEmailDiagnosticsTab;