import React, { memo, useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Search,
  MoreVertical,
  Trash2,
  Shield,
  Loader2,
  Users as UsersIcon,
  Store,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import ConfirmActionDialog from '@/components/admin/ConfirmActionDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { logAuditAction } from '@/lib/adminUtils';
import { translateAdminError } from '@/lib/adminErrorHandler';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

const AdminUsersTab = memo(() => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dialogState, setDialogState] = useState({ isOpen: false, action: null, userId: null, userName: '' });
  const [isActionLoading, setIsActionLoading] = useState(false);
  const { toast } = useToast();
  const { user: currentUser, refreshProfile } = useAuth(); 

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    
    try {
      // Fetch data in two separate queries to avoid cross-schema join issues and permission errors
      const [profilesResponse, authResponse] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.functions.invoke('get-auth-users', { method: 'GET' })
      ]);

      if (profilesResponse.error) throw profilesResponse.error;
      if (authResponse.error) throw authResponse.error;

      const profilesData = profilesResponse.data || [];
      const authUsersData = authResponse.data?.users || [];

      // Merge datasets by matching user IDs
      const mergedUsers = profilesData.map(profile => {
        const authUser = authUsersData.find(u => u.id === profile.id);
        
        return {
          ...profile,
          email: authUser?.email || 'N/A',
          email_confirmed_at: authUser?.email_confirmed_at,
          created_at: profile.created_at || authUser?.created_at,
          phone_confirmed_at: authUser?.phone_confirmed_at,
          is_admin: profile.role === 'admin'
        };
      });

      setUsers(mergedUsers);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast({ 
        title: "Erreur de chargement", 
        description: translateAdminError(error), 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const openDialog = (action, userId, userName) => {
    setDialogState({ isOpen: true, action, userId, userName });
  };

  const closeDialog = () => {
    setDialogState({ isOpen: false, action: null, userId: null, userName: '' });
  };

  const handleToggleSeller = async (userId, currentValue) => {
    try {
      const { error } = await supabase.rpc('admin_toggle_seller', { p_user_id: userId, p_is_seller: !currentValue });
      if (error) throw error;
      await logAuditAction(currentUser?.id, 'TOGGLE_SELLER', 'user', userId, { is_seller: !currentValue });
      toast({ title: !currentValue ? 'Vendeur activé ✅' : 'Vendeur désactivé', className: 'bg-green-100 text-green-800' });
      fetchUsers();
    } catch (err) {
      toast({ title: 'Erreur', description: translateAdminError(err), variant: 'destructive' });
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const { error } = await supabase.rpc('admin_update_user_role', { p_user_id: userId, p_role: newRole });
      if (error) throw error;

      await logAuditAction(currentUser?.id, 'UPDATE_ROLE', 'user', userId, { new_role: newRole });

      toast({ title: "Succès", description: `Rôle mis à jour: ${newRole}`, className: "bg-green-100 text-green-800" });
      fetchUsers();
      if (userId === currentUser?.id) refreshProfile?.();
    } catch (err) {
      toast({ title: "Erreur", description: translateAdminError(err), variant: "destructive" });
    }
  };

  const handleConfirmAction = async () => {
    const { action, userId } = dialogState;
    if (!action || !userId) return;

    setIsActionLoading(true);
    try {
      if (action === 'delete') {
         const { error } = await supabase.rpc('delete_user_account_admin', { target_user_id: userId });
         if (error) throw error;
         
         await logAuditAction(currentUser?.id, 'DELETE_USER', 'user', userId);
         toast({ title: 'Succès', description: 'Utilisateur supprimé.', className: "bg-green-100 text-green-800" });
      } else {
         const { data, error } = await supabase.functions.invoke('admin-user-actions', {
           body: { action, userId },
         });
         if (error) throw error;
         toast({ title: 'Succès', description: data?.message || 'Action réussie', className: "bg-green-100 text-green-800" });
      }
      
      fetchUsers();
    } catch (error) {
      toast({ title: 'Erreur', description: translateAdminError(error), variant: 'destructive' });
    } finally {
      setIsActionLoading(false);
      closeDialog();
    }
  };

  const STAFF_ROLES = ['admin', 'monetisation', 'gestion', 'editor', 'viewer'];

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter(u => {
      const matchSearch =
        u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.phone?.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchSearch) return false;
      if (typeFilter === 'sellers')  return u.is_seller;
      if (typeFilter === 'verified') return u.verified;
      if (typeFilter === 'staff')    return STAFF_ROLES.includes(u.role);
      if (typeFilter === 'buyers')   return !u.is_seller && !STAFF_ROLES.includes(u.role);
      return true;
    });
  }, [users, searchQuery, typeFilter]);

  const counts = useMemo(() => ({
    all:      users.length,
    sellers:  users.filter(u => u.is_seller).length,
    verified: users.filter(u => u.verified).length,
    staff:    users.filter(u => STAFF_ROLES.includes(u.role)).length,
    buyers:   users.filter(u => !u.is_seller && !STAFF_ROLES.includes(u.role)).length,
  }), [users]);

  if (loading) return <div className="p-6"><Skeleton className="h-40 w-full" /></div>;

  return (
    <>
      <ConfirmActionDialog
        open={dialogState.isOpen}
        onOpenChange={closeDialog}
        onConfirm={handleConfirmAction}
        title="Confirmer l'action"
        description="Êtes-vous sûr de vouloir continuer ?"
        variant={dialogState.action === 'delete' ? 'destructive' : 'default'}
        isLoading={isActionLoading}
      />
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Nom, email, téléphone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
        </div>
        <div className="flex gap-2 flex-wrap mb-5">
          {[
            { value: 'all',      label: `Tous (${counts.all})` },
            { value: 'sellers',  label: `Vendeurs (${counts.sellers})` },
            { value: 'buyers',   label: `Acheteurs (${counts.buyers})` },
            { value: 'verified', label: `Vérifiés (${counts.verified})` },
            { value: 'staff',    label: `Staff (${counts.staff})` },
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setTypeFilter(f.value)}
              className={`px-3 py-1.5 rounded-full text-[12px] font-semibold border transition-all ${
                typeFilter === f.value
                  ? 'bg-custom-green-600 text-white border-custom-green-600 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-custom-green-400 hover:text-custom-green-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <AnimatePresence>
            {filteredUsers.map((userItem) => (
              <motion.div
                key={userItem.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                layout
              >
                <Card className="border shadow-sm">
                  <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                    <div className="md:col-span-2 flex items-center space-x-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={userItem.avatar_url} />
                        <AvatarFallback>{userItem.full_name?.charAt(0) || '?'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-gray-900">{userItem.full_name || 'Sans Nom'}</h3>
                          {userItem.is_admin && <Badge className="bg-purple-100 text-purple-800 border-none">Admin</Badge>}
                          {userItem.role === 'monetisation' && <Badge className="bg-amber-100 text-amber-800 border-none">Monétisation</Badge>}
                          {userItem.role === 'gestion' && <Badge className="bg-indigo-100 text-indigo-800 border-none">Gestion</Badge>}
                          {userItem.role === 'editor' && <Badge className="bg-blue-100 text-blue-800 border-none">Éditeur</Badge>}
                          {userItem.role === 'viewer' && <Badge variant="outline" className="text-gray-600">Lecteur</Badge>}
                          {userItem.verified && <Badge className="bg-green-100 text-green-800 border-none ml-1">Vérifié</Badge>}
                          {userItem.is_seller && <Badge className="bg-amber-100 text-amber-800 border-none ml-1">Vendeur</Badge>}
                        </div>
                        <p className="text-sm text-gray-500">{userItem.email}</p>
                        {userItem.phone && <p className="text-xs text-gray-400 mt-0.5">{userItem.phone}</p>}
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      <p>Dernière connexion: <span className="font-medium">{userItem.last_seen ? new Date(userItem.last_seen).toLocaleDateString() : 'Jamais'}</span></p>
                      <p>Créé le: <span className="text-xs">{new Date(userItem.created_at).toLocaleDateString()}</span></p>
                    </div>

                    <div className="flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost"><MoreVertical className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                           <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                              <Shield className="mr-2 h-4 w-4" />
                              Changer Rôle
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                              <DropdownMenuRadioGroup value={userItem.role || 'viewer'} onValueChange={(val) => handleRoleChange(userItem.id, val)}>
                                <DropdownMenuRadioItem value="admin">Admin</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="monetisation">Monétisation</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="gestion">Gestion</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="editor">Éditeur</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="viewer">Lecteur</DropdownMenuRadioItem>
                              </DropdownMenuRadioGroup>
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleToggleSeller(userItem.id, userItem.is_seller)}>
                            <Store className="mr-2 h-4 w-4 text-amber-600" />
                            {userItem.is_seller ? 'Désactiver Vendeur' : 'Activer Vendeur'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600" onClick={() => openDialog('delete', userItem.id, userItem.full_name)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
            
            {filteredUsers.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <UsersIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p>Aucun utilisateur trouvé.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
});

export default AdminUsersTab;