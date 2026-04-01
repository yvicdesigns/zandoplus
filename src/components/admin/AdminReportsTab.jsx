import React, { memo, useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Flag, ShieldCheck, Trash2, XCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import ConfirmActionDialog from '@/components/admin/ConfirmActionDialog';
import { Skeleton } from '@/components/ui/skeleton';

const AdminReportsTab = memo(() => {
    const { toast } = useToast();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingAction, setLoadingAction] = useState(null);
    const [dialogState, setDialogState] = useState({ isOpen: false, listingId: null });
    
    const fetchReports = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_all_reports_admin');
            if (error) throw error;
            
            // Transform data for easier consumption
            const transformedData = (data || []).map(item => ({
                ...item,
                listing_title: item.listing?.title,
                listing_id: item.listing?.id,
                reporter_full_name: item.reporter?.full_name
            }));
            
            setReports(transformedData);
        } catch (error) {
            console.error('Error fetching reports:', error);
            toast({
                title: "Erreur",
                description: "Impossible de charger les signalements.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    const openDeleteDialog = (listingId) => setDialogState({ isOpen: true, listingId });
    const closeDeleteDialog = () => setDialogState({ isOpen: false, listingId: null });

    const handleReportAction = async (reportId, status) => {
        setLoadingAction(`status-${reportId}`);
        try {
            const { error } = await supabase.functions.invoke('admin-actions', {
                body: JSON.stringify({ type: 'report', payload: { action: 'update-status', reportId, status } }),
            });
            if (error) throw error;
            toast({ title: 'Succès', description: 'Statut du signalement mis à jour.', className: 'bg-green-100 text-green-800' });
            fetchReports();
        } catch (error) {
            toast({ title: 'Erreur', description: error.message || "Impossible de mettre à jour le statut.", variant: 'destructive' });
        } finally {
            setLoadingAction(null);
        }
    };
    
    const handleDeleteListing = async () => {
        if (!dialogState.listingId) return;
        setLoadingAction(`delete-${dialogState.listingId}`);
        try {
          const { error } = await supabase.functions.invoke('admin-actions', {
            body: JSON.stringify({ type: 'listing', payload: { action: 'delete', listingId: dialogState.listingId } }),
          });
          if (error) throw error;
          toast({ title: 'Succès', description: 'Annonce supprimée avec succès.', className: 'bg-green-100 text-green-800' });
          fetchReports();
        } catch (error) {
          toast({ title: 'Erreur', description: error.message || "Impossible de supprimer l'annonce.", variant: 'destructive' });
        } finally {
          setLoadingAction(null);
          closeDeleteDialog();
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
    };

    const statusBadgeVariant = {
        pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        resolved: 'bg-green-100 text-green-800 border-green-200',
        dismissed: 'bg-gray-100 text-gray-800 border-gray-200',
    };

    if (loading) {
      return (
        <div className="p-4 sm:p-6 space-y-4">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      );
    }
    
    return (
        <>
            <ConfirmActionDialog
                open={dialogState.isOpen}
                onOpenChange={closeDeleteDialog}
                onConfirm={handleDeleteListing}
                title="Supprimer l'annonce signalée ?"
                description="Cette action est irréversible et supprimera l'annonce de manière permanente."
            />
            <div className="p-4 sm:p-6">
                <div className="space-y-4">
                    <AnimatePresence>
                        {reports && reports.map((report, index) => (
                            <motion.div
                              key={report.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              transition={{ duration: 0.3, delay: index * 0.05 }}
                            >
                                <Card className="border shadow-sm hover:shadow-md transition-shadow">
                                    <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 items-start gap-4">
                                        <div className="md:col-span-3">
                                            <div className="flex items-start sm:items-center space-x-3 mb-2 flex-wrap gap-y-2">
                                                <Flag className="w-5 h-5 text-red-500 flex-shrink-0" />
                                                <h3 className="font-semibold text-gray-800 break-all">
                                                    {report.listing_id ? (
                                                        <Link to={`/listings/${report.listing_id}`} className="hover:text-custom-green-600 transition-colors">
                                                            {report.listing_title || 'Annonce Sans Titre'}
                                                        </Link>
                                                    ) : (
                                                        <span className="text-gray-500 italic">Annonce Supprimée</span>
                                                    )}
                                                </h3>
                                                <Badge className={statusBadgeVariant[report.status] || 'bg-gray-100'}>{report.status || 'Inconnu'}</Badge>
                                            </div>
                                            <p className="text-sm text-gray-500 mb-2">Motif: <span className="font-medium text-gray-700">{report.reason}</span></p>
                                            {report.comments && <p className="text-sm bg-gray-50 p-3 rounded-md border text-gray-700">"{report.comments}"</p>}
                                            <div className="text-xs text-gray-500 mt-2">
                                                Signalé par <span className="font-medium">{report.reporter_full_name || 'Anonyme'}</span> le {formatDate(report.created_at)}
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2 items-center justify-self-start md:justify-self-end self-center">
                                            <Button size="sm" variant="outline" onClick={() => handleReportAction(report.id, 'resolved')} disabled={loadingAction === `status-${report.id}` || report.status === 'resolved'} className="text-green-600 hover:bg-green-50 hover:text-green-700">
                                                <ShieldCheck className="w-4 h-4 mr-2" /> Résoudre
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => handleReportAction(report.id, 'dismissed')} disabled={loadingAction === `status-${report.id}` || report.status === 'dismissed'}>
                                                <XCircle className="w-4 h-4 mr-2" /> Rejeter
                                            </Button>
                                            {report.listing_id && (
                                                <Button size="sm" variant="destructive-outline" onClick={() => openDeleteDialog(report.listing_id)} disabled={loadingAction === `delete-${report.listing_id}`}>
                                                    <Trash2 className="w-4 h-4 mr-2" /> Supprimer l'annonce
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
                {reports && reports.length === 0 && !loading && (
                    <div className="text-center py-16">
                        <Flag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucun signalement</h3>
                        <p className="text-gray-500">La plateforme est saine pour le moment !</p>
                    </div>
                )}
            </div>
        </>
    );
});

export default AdminReportsTab;