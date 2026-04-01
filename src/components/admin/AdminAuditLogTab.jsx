import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, ShieldAlert, Key, Edit, Trash, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/components/ui/use-toast';
import { fetchAuditLogsWithUserInfo } from '@/lib/adminQueryHelpers';

const AdminAuditLogTab = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      const { data, error } = await fetchAuditLogsWithUserInfo();

      if (error) {
        toast({ title: "Erreur de chargement", description: error, variant: "destructive" });
      } else if (data) {
        const transformedLogs = data.map(log => {
          const profileInfo = Array.isArray(log.profiles) ? log.profiles[0] : log.profiles;
          const authInfo = Array.isArray(log.auth_users) ? log.auth_users[0] : log.auth_users;
          
          return {
            ...log,
            user_full_name: profileInfo?.full_name || 'Système',
            user_email: authInfo?.email || 'N/A'
          };
        });
        setLogs(transformedLogs);
      }
      setLoading(false);
    };

    fetchLogs();
  }, [toast]);

  const getActionIcon = (action) => {
    if (!action) return <FileText className="w-4 h-4 text-gray-500" />;
    const act = action.toUpperCase();
    if (act.includes('DELETE')) return <Trash className="w-4 h-4 text-red-500" />;
    if (act.includes('UPDATE')) return <Edit className="w-4 h-4 text-blue-500" />;
    if (act.includes('LOGIN')) return <Key className="w-4 h-4 text-green-500" />;
    if (act.includes('SECURITY')) return <ShieldAlert className="w-4 h-4 text-red-700" />;
    return <FileText className="w-4 h-4 text-gray-500" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Journal d'Audit de Sécurité</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Utilisateur (Email)</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Ressource</TableHead>
                  <TableHead>Détails</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs text-gray-500 whitespace-nowrap">
                      {format(new Date(log.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="font-medium text-gray-900">{log.user_full_name}</div>
                      <div className="text-xs text-gray-500">{log.user_email}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action)}
                        <Badge variant="outline">{log.action}</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <span className="font-medium">{log.resource_type}</span>
                      {log.resource_id && <span className="block text-xs text-gray-500">#{log.resource_id.substring(0, 8)}</span>}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-gray-600 max-w-[200px] truncate" title={JSON.stringify(log.details)}>
                      {JSON.stringify(log.details)}
                    </TableCell>
                  </TableRow>
                ))}
                {logs.length === 0 && (
                   <TableRow>
                     <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        Aucun log d'audit enregistré.
                     </TableCell>
                   </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminAuditLogTab;