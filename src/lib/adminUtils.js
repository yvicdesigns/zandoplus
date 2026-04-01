import { supabase } from '@/lib/customSupabaseClient';

// Helper to log actions to the audit table
export const logAuditAction = async (userId, action, resourceType, resourceId = null, details = {}) => {
  try {
    const { error } = await supabase.from('audit_logs').insert({
      user_id: userId,
      action,
      resource_type: resourceType,
      resource_id: resourceId ? String(resourceId) : null,
      details,
      ip_address: 'client-side' // Real IP would typically come from edge function headers
    });
    if (error) console.error('Audit log failed:', error);
  } catch (e) {
    console.error('Audit log exception:', e);
  }
};

// Helper to submit a change request instead of direct update
export const submitChangeRequest = async (userId, resourceType, resourceId, action, payload) => {
  const { data, error } = await supabase.from('change_requests').insert({
    user_id: userId,
    resource_type: resourceType,
    resource_id: String(resourceId),
    action,
    payload
  }).select().single();

  return { data, error };
};

// Helper to check permissions
export const checkPermission = (userRole, requiredRole) => {
  const roles = ['viewer', 'editor', 'admin'];
  const userRoleIndex = roles.indexOf(userRole || 'viewer');
  const requiredRoleIndex = roles.indexOf(requiredRole);
  return userRoleIndex >= requiredRoleIndex;
};