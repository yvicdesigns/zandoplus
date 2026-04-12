import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, XCircle, Clock, ExternalLink, CreditCard, RefreshCw } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const statusConfig = {
  pending_approval: { label: 'En attente', color: 'bg-amber-100 text-amber-800' },
  approved: { label: 'Approuvé', color: 'bg-green-100 text-green-800' },
  rejected: { label: 'Rejeté', color: 'bg-red-100 text-red-800' },
};

const AdminPaymentsTab = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const { toast } = useToast();

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('verification_requests')
      .select('*, user:profiles(full_name, avatar_url)')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      setPayments(data || []);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleAction = async (id, userId, newStatus) => {
    setActionLoading(id);
    try {
      const { error } = await supabase
        .from('verification_requests')
        .update({ status: newStatus, reviewed_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      if (newStatus === 'approved') {
        await supabase
          .from('profiles')
          .update({ verified: true })
          .eq('id', userId);
      }

      setPayments(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
      toast({
        title: newStatus === 'approved' ? 'Paiement approuvé' : 'Paiement rejeté',
        description: newStatus === 'approved' ? 'Le compte a été vérifié.' : 'La demande a été rejetée.',
        className: newStatus === 'approved' ? 'bg-green-100 text-green-800' : undefined,
        variant: newStatus === 'rejected' ? 'destructive' : undefined,
      });
    } catch (err) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const pending = payments.filter(p => p.status === 'pending_approval');
  const processed = payments.filter(p => p.status !== 'pending_approval');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Paiements & Vérifications</h2>
          <p className="text-sm text-gray-500">
            {pending.length} demande{pending.length !== 1 ? 's' : ''} en attente
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchPayments} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Pending */}
      {pending.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-amber-700 flex items-center gap-2">
            <Clock className="w-4 h-4" /> En attente ({pending.length})
          </h3>
          {pending.map(payment => (
            <PaymentCard
              key={payment.id}
              payment={payment}
              onApprove={() => handleAction(payment.id, payment.user_id, 'approved')}
              onReject={() => handleAction(payment.id, payment.user_id, 'rejected')}
              isLoading={actionLoading === payment.id}
            />
          ))}
        </div>
      )}

      {pending.length === 0 && !loading && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-gray-500">
            <CheckCircle className="w-10 h-10 mx-auto mb-3 text-green-400" />
            <p className="font-semibold">Aucun paiement en attente</p>
            <p className="text-sm mt-1">Toutes les demandes ont été traitées.</p>
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-lg" />)}
        </div>
      )}

      {/* Processed history */}
      {processed.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-sm font-semibold text-gray-500 hover:text-gray-700 list-none flex items-center gap-2 py-2">
            <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
            Historique ({processed.length} traitée{processed.length > 1 ? 's' : ''})
          </summary>
          <div className="mt-3 space-y-3">
            {processed.map(payment => (
              <PaymentCard key={payment.id} payment={payment} readonly />
            ))}
          </div>
        </details>
      )}
    </div>
  );
};

const PaymentCard = ({ payment, onApprove, onReject, isLoading, readonly }) => {
  const status = statusConfig[payment.status] || statusConfig['pending_approval'];
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <Avatar className="w-10 h-10 flex-shrink-0">
              <AvatarImage src={payment.user?.avatar_url} />
              <AvatarFallback>{payment.user?.full_name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-sm">{payment.user?.full_name || 'Utilisateur'}</p>
                <Badge className={`${status.color} text-xs`}>{status.label}</Badge>
              </div>
              {payment.payment_transaction_id && (
                <p className="text-xs text-gray-600 mt-1">
                  ID transaction : <span className="font-mono">{payment.payment_transaction_id}</span>
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1">Soumis le {formatDate(payment.created_at)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {payment.payment_proof_url && (
              <a href={payment.payment_proof_url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Preuve
                </Button>
              </a>
            )}
            {!readonly && (
              <>
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={onApprove}
                  disabled={isLoading}
                >
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-1" />}
                  Approuver
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={onReject}
                  disabled={isLoading}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Rejeter
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminPaymentsTab;
