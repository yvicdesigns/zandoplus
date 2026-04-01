import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Mail, Settings } from 'lucide-react';
import AdminEmailDiagnosticsTab from '@/components/admin/AdminEmailDiagnosticsTab';
import { Button } from '@/components/ui/button';

const AdminEmailDiagnosticsPage = () => {
  return (
    <>
      <Helmet>
        <title>Diagnostics SMTP & E-mail - Admin</title>
      </Helmet>
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2 text-gray-900">
                    <Mail className="w-8 h-8 text-blue-600" />
                    Diagnostics du Service d'E-mail (Resend)
                </h1>
                <p className="text-gray-600 mt-2">Vérifiez l'intégration, les quotas et testez la délivrabilité SMTP de la plateforme.</p>
            </div>
            <Button variant="outline" onClick={() => window.open('/RESEND_EMAIL_TROUBLESHOOTING.md', '_blank')}>
                <Settings className="w-4 h-4 mr-2" /> Guide de Configuration
            </Button>
        </div>

        <AdminEmailDiagnosticsTab />
      </div>
    </>
  );
};

export default AdminEmailDiagnosticsPage;