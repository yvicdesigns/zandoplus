import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminStatsGrid from "@/components/admin/AdminStatsGrid";
import AdminUsersTab from "@/components/admin/AdminUsersTab";
import AdminListingsTab from "@/components/admin/AdminListingsTab";
import AdminDeliveriesTab from "@/components/admin/AdminDeliveriesTab";
import AdminReportsTab from "@/components/admin/AdminReportsTab";
import AdminBoostsTab from "@/components/admin/AdminBoostsTab";
import AdminAdsTab from "@/components/admin/AdminAdsTab";
import AdminVerificationsTab from "@/components/admin/AdminVerificationsTab";
import AdminSettingsTab from "@/components/admin/AdminSettingsTab";
import AdminHeroTab from "@/components/admin/AdminHeroTab";
import AdminSubscribersTab from "@/components/admin/AdminSubscribersTab";
import AdminBulkMessageTab from "@/components/admin/AdminBulkMessageTab";
import AdminDeletionRequestsTab from '@/components/admin/AdminDeletionRequestsTab';
import AdminChangelogTab from '@/components/admin/AdminChangelogTab';
import AdminQATab from '@/components/admin/AdminQATab';
import AdminAuditLogTab from '@/components/admin/AdminAuditLogTab';
import AdminChangeRequestsTab from '@/components/admin/AdminChangeRequestsTab';
import AdminEmailTestTab from '@/components/admin/AdminEmailTestTab';
import AdminPaymentsTab from '@/components/admin/AdminPaymentsTab';
import AdminCategoriesTab from '@/components/admin/AdminCategoriesTab';
import { Helmet } from 'react-helmet-async';
import { Users, ShoppingBag, Truck, Flag, Zap, Megaphone, ShieldCheck, Settings, Image, Mail, MessageSquare, Trash2, GitBranch, Activity, FileText, ClipboardCheck, CreditCard, LayoutGrid } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const AdminDashboard = () => {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { userRole, isAdmin } = useAuth();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_admin_statistics');
      if (error) throw error;

      const transformedStats = [
        {
          label: 'Utilisateurs Totaux',
          value: data.total_users,
          icon: Users,
          color: 'from-blue-500 to-blue-600',
        },
        {
          label: 'Annonces Actives',
          value: data.total_listings,
          icon: ShoppingBag,
          color: 'from-green-500 to-emerald-600',
          change: `+${data.new_listings_last_24h} / 24h`
        },
        {
          label: 'Boosts Actifs',
          value: data.active_boosts,
          icon: Zap,
          color: 'from-amber-400 to-orange-500',
        },
        {
          label: 'Signalements',
          value: data.pending_reports,
          icon: Flag,
          color: 'from-red-500 to-pink-600',
        }
      ];

      setStats(transformedStats);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les statistiques.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        <title>Tableau de Bord Administrateur | Zando+ Congo</title>
      </Helmet>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord {isAdmin ? 'Administrateur' : userRole === 'editor' ? 'Éditeur' : 'Lecteur'}</h1>
        <p className="text-gray-500 mt-2">Gérez les utilisateurs, les annonces et les paramètres du site.</p>
      </div>

      <AdminStatsGrid stats={stats} loading={loading} />

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 h-auto bg-transparent p-0">
            <TabsTrigger value="users" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border-primary/20 border border-transparent bg-muted/50 h-14 justify-start px-4">
              <Users className="w-4 h-4 mr-2" />
              Utilisateurs
            </TabsTrigger>
            <TabsTrigger value="listings" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border-primary/20 border border-transparent bg-muted/50 h-14 justify-start px-4">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Annonces
            </TabsTrigger>
            <TabsTrigger value="deliveries" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border-primary/20 border border-transparent bg-muted/50 h-14 justify-start px-4">
              <Truck className="w-4 h-4 mr-2" />
              Livraisons
            </TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border-primary/20 border border-transparent bg-muted/50 h-14 justify-start px-4">
              <Flag className="w-4 h-4 mr-2" />
              Signalements
            </TabsTrigger>
            
            {isAdmin && (
              <>
                <TabsTrigger value="payments" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border-primary/20 border border-transparent bg-muted/50 h-14 justify-start px-4 text-green-700">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Paiements
                </TabsTrigger>
                <TabsTrigger value="approvals" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border-primary/20 border border-transparent bg-muted/50 h-14 justify-start px-4 text-blue-700">
                  <ClipboardCheck className="w-4 h-4 mr-2" />
                  Approbations
                </TabsTrigger>
                <TabsTrigger value="audit" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border-primary/20 border border-transparent bg-muted/50 h-14 justify-start px-4 text-purple-700">
                  <FileText className="w-4 h-4 mr-2" />
                  Audit Logs
                </TabsTrigger>
                <TabsTrigger value="email-test" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border-primary/20 border border-transparent bg-muted/50 h-14 justify-start px-4 text-emerald-700">
                  <Mail className="w-4 h-4 mr-2" />
                  Test E-mail
                </TabsTrigger>
              </>
            )}

            <TabsTrigger value="categories" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border-primary/20 border border-transparent bg-muted/50 h-14 justify-start px-4">
              <LayoutGrid className="w-4 h-4 mr-2" />
              Catégories
            </TabsTrigger>

            <TabsTrigger value="settings" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border-primary/20 border border-transparent bg-muted/50 h-14 justify-start px-4">
              <Settings className="w-4 h-4 mr-2" />
              Paramètres
            </TabsTrigger>

             <TabsTrigger value="boosts" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border-primary/20 border border-transparent bg-muted/50 h-14 justify-start px-4">
              <Zap className="w-4 h-4 mr-2" />
              Boosts
            </TabsTrigger>
            <TabsTrigger value="ads" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border-primary/20 border border-transparent bg-muted/50 h-14 justify-start px-4">
              <Megaphone className="w-4 h-4 mr-2" />
              Publicités
            </TabsTrigger>
            <TabsTrigger value="verifications" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border-primary/20 border border-transparent bg-muted/50 h-14 justify-start px-4">
              <ShieldCheck className="w-4 h-4 mr-2" />
              Vérifications
            </TabsTrigger>
             <TabsTrigger value="hero" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border-primary/20 border border-transparent bg-muted/50 h-14 justify-start px-4">
              <Image className="w-4 h-4 mr-2" />
              Hero Slider
            </TabsTrigger>
            <TabsTrigger value="qa" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border-primary/20 border border-transparent bg-muted/50 h-14 justify-start px-4">
              <Activity className="w-4 h-4 mr-2" />
              QA & Tests
            </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <AdminUsersTab />
        </TabsContent>

        <TabsContent value="listings">
          <AdminListingsTab />
        </TabsContent>

        <TabsContent value="deliveries">
          <AdminDeliveriesTab />
        </TabsContent>

        <TabsContent value="reports">
          <AdminReportsTab />
        </TabsContent>

        {isAdmin && (
          <>
            <TabsContent value="payments">
              <AdminPaymentsTab />
            </TabsContent>
            <TabsContent value="approvals">
              <AdminChangeRequestsTab />
            </TabsContent>
            <TabsContent value="audit">
              <AdminAuditLogTab />
            </TabsContent>
            <TabsContent value="email-test">
              <AdminEmailTestTab />
            </TabsContent>
          </>
        )}

        <TabsContent value="boosts">
          <AdminBoostsTab />
        </TabsContent>

        <TabsContent value="ads">
          <AdminAdsTab />
        </TabsContent>

        <TabsContent value="verifications">
          <AdminVerificationsTab />
        </TabsContent>
        
        <TabsContent value="categories">
          <AdminCategoriesTab />
        </TabsContent>

        <TabsContent value="settings">
          <AdminSettingsTab />
        </TabsContent>
        
        <TabsContent value="qa">
           <AdminQATab />
        </TabsContent>

        <TabsContent value="hero">
          <AdminHeroTab />
        </TabsContent>

      </Tabs>
    </div>
  );
};

export default AdminDashboard;