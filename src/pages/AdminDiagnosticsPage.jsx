import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/customSupabaseClient';
import { CheckCircle2, XCircle, Loader2, Server, ShieldCheck, Mail, Link as LinkIcon } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const AdminDiagnosticsPage = () => {
  const [testEmail, setTestEmail] = useState('');
  const [results, setResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    setResults(null);
    
    const newResults = {
      supabaseConnection: { status: 'pending', message: 'Testing connection...' },
      authConfig: { status: 'pending', message: 'Checking auth status...' },
      envVars: { status: 'pending', message: 'Verifying URLs...' },
      resetEmail: { status: 'pending', message: 'Waiting...' }
    };
    
    // 1. Test Supabase Connection
    try {
      const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
      if (error) throw error;
      newResults.supabaseConnection = { status: 'success', message: 'Connected to Supabase Database successfully.' };
    } catch (err) {
      newResults.supabaseConnection = { status: 'error', message: `Database error: ${err.message}` };
    }
    setResults({ ...newResults });

    // 2. Check Redirect URL Config
    const currentOrigin = window.location.origin;
    newResults.envVars = { 
        status: 'success', 
        message: `Frontend Origin: ${currentOrigin}. Ensure this is whitelisted in Supabase Auth -> URL Configuration.` 
    };
    setResults({ ...newResults });

    // 3. Test Password Reset Email
    if (testEmail) {
        newResults.resetEmail = { status: 'running', message: 'Sending test reset email...' };
        setResults({ ...newResults });
        
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(testEmail, {
                redirectTo: `${currentOrigin}/reset-password`,
            });
            if (error) throw error;
            newResults.resetEmail = { status: 'success', message: `Reset email sent successfully to ${testEmail}. Check inbox.` };
        } catch (err) {
            newResults.resetEmail = { status: 'error', message: `Failed to send email: ${err.message}` };
        }
    } else {
        newResults.resetEmail = { status: 'skipped', message: 'No test email provided.' };
    }
    
    setResults({ ...newResults });
    setIsRunning(false);
  };

  const StatusIcon = ({ status }) => {
      switch(status) {
          case 'success': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
          case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
          case 'running': 
          case 'pending': return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
          default: return <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center text-xs text-gray-500">-</div>;
      }
  };

  return (
    <>
      <Helmet>
        <title>Diagnostics Auth - Admin</title>
      </Helmet>
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Outils de Diagnostic Système</h1>
        
        <Card className="mb-8">
            <CardHeader>
                <CardTitle className="flex items-center"><ShieldCheck className="mr-2" /> Diagnostic Authentification & Emails</CardTitle>
                <CardDescription>
                    Testez la configuration de Supabase Auth, l'envoi d'emails et la validité des URLs de redirection.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex gap-4 mb-6">
                    <Input 
                        placeholder="Email pour tester la réinitialisation (optionnel)" 
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        type="email"
                        className="max-w-md"
                    />
                    <Button onClick={runDiagnostics} disabled={isRunning}>
                        {isRunning ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Exécution...</> : 'Lancer le Diagnostic'}
                    </Button>
                </div>

                {results && (
                    <div className="space-y-4 border rounded-lg p-4 bg-slate-50">
                        <div className="flex items-start gap-3 p-3 bg-white rounded shadow-sm">
                            <Server className="w-5 h-5 text-gray-500 mt-0.5" />
                            <div className="flex-1">
                                <h3 className="font-semibold flex items-center gap-2">Connexion Base de données <StatusIcon status={results.supabaseConnection.status} /></h3>
                                <p className={`text-sm ${results.supabaseConnection.status === 'error' ? 'text-red-600' : 'text-gray-600'}`}>{results.supabaseConnection.message}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 bg-white rounded shadow-sm">
                            <LinkIcon className="w-5 h-5 text-gray-500 mt-0.5" />
                            <div className="flex-1">
                                <h3 className="font-semibold flex items-center gap-2">Configuration des URLs <StatusIcon status={results.envVars.status} /></h3>
                                <p className="text-sm text-gray-600">{results.envVars.message}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 bg-white rounded shadow-sm">
                            <Mail className="w-5 h-5 text-gray-500 mt-0.5" />
                            <div className="flex-1">
                                <h3 className="font-semibold flex items-center gap-2">Test Envoi Email Reset <StatusIcon status={results.resetEmail.status} /></h3>
                                <p className={`text-sm ${results.resetEmail.status === 'error' ? 'text-red-600' : 'text-gray-600'}`}>{results.resetEmail.message}</p>
                                {results.resetEmail.status === 'error' && (
                                    <div className="mt-2 text-xs bg-red-50 p-2 rounded border border-red-100">
                                        <strong>Conseils de dépannage:</strong>
                                        <ul className="list-disc pl-4 mt-1">
                                            <li>Vérifiez que le serveur SMTP personnalisé est bien configuré dans Supabase Auth.</li>
                                            <li>Si vous utilisez le SMTP par défaut de Supabase, vérifiez les limites de taux (rate limits).</li>
                                            <li>Assurez-vous que le Site URL et les Redirect URLs dans Supabase correspondent à {window.location.origin}.</li>
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
      </div>
    </>
  );
};

export default AdminDiagnosticsPage;