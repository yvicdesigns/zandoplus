import { supabase } from '@/lib/customSupabaseClient';
import { translateAdminError } from './adminErrorHandler';

export const fetchUsersWithEmails = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, phone, verified, created_at, last_seen, role, auth_users!inner(email, email_confirmed_at)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: translateAdminError(error) };
  }
};

export const fetchAuditLogsWithUserInfo = async () => {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('id, action, resource_type, resource_id, details, ip_address, created_at, user_id, profiles!audit_logs_user_id_fkey(full_name)')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: translateAdminError(error) };
  }
};

export const fetchChangeRequestsWithProfiles = async () => {
  try {
    const { data, error } = await supabase
      .from('change_requests')
      .select('id, action, resource_type, resource_id, payload, status, admin_notes, created_at, user_id, reviewed_at, profiles!change_requests_user_id_fkey(full_name), reviewed_by_profile:profiles!change_requests_reviewed_by_fkey(full_name)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: translateAdminError(error) };
  }
};

export const fetchListingsAdmin = async () => {
  try {
    const { data, error } = await supabase.rpc('get_all_listings_admin');
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: translateAdminError(error) };
  }
};

export const fetchBoostRequestsAdmin = async () => {
  try {
    const { data, error } = await supabase.rpc('get_all_boost_requests');
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: translateAdminError(error) };
  }
};

export const fetchVerificationRequestsAdmin = async () => {
  try {
    const { data, error } = await supabase.rpc('get_all_verification_requests');
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: translateAdminError(error) };
  }
};