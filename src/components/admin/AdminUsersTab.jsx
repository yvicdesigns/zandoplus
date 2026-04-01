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
  Users as UsersIcon 
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
  const [dialogState, setDialogState] = useState({ isOpen: false, action: null, userId: null, userName: '' });
  const [isActionLoading, setIsActionLoading] = useState(false);
  const { toast } = useToast();
  const { user: currentUser } = useAuth(); 

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

  const handleRoleChange = async (userId, newRole) => {
    try {
      const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
      if (error) throw error;
      
      await logAuditAction(currentUser?.id, 'UPDATE_ROLE', 'user', userId, { new_role: newRole });
      
      toast({ title: "Succès", description: `Rôle mis à jour: ${newRole}`, className: "bg-green-100 text-green-800" });
      fetchUsers();
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

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter(u => 
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

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
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Rechercher par nom, email ou téléphone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full md:w-1/3"
          />
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
                          {userItem.role === 'editor' && <Badge className="bg-blue-100 text-blue-800 border-none">Éditeur</Badge>}
                          {userItem.role === 'viewer' && <Badge variant="outline" className="text-gray-600">Lecteur</Badge>}
                          {userItem.verified && <Badge className="bg-green-100 text-green-800 border-none ml-1">Vérifié</Badge>}
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
                                <DropdownMenuRadioItem value="editor">Éditeur</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="viewer">Lecteur</DropdownMenuRadioItem>
                              </DropdownMenuRadioGroup>
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
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