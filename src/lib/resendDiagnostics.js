import { supabase } from './customSupabaseClient';

/**
 * Validates the Resend API key by invoking the validation edge function.
 */
export const validateResendApiKey = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('validate-resend-config', {
      body: { action: 'check_key' }
    });
    if (error) throw error;
    return data;
  } catch (err) {
    return { valid: false, error: err.message };
  }
};

/**
 * Checks the sender email verification status via edge function.
 */
export const checkSenderEmailVerification = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('validate-resend-config', {
      body: { action: 'check_domains' }
    });
    if (error) throw error;
    return data;
  } catch (err) {
    return { verified: false, error: err.message };
  }
};

/**
 * Tests email delivery by invoking the test-resend-email edge function.
 */
export const testEmailDelivery = async (to, subject, body) => {
  try {
    const { data, error } = await supabase.functions.invoke('test-resend-email', {
      body: { to, subject, body }
    });
    if (error) throw error;
    return { success: data.success, data: data.data, message: data.message };
  } catch (err) {
    return { success: false, error: err.message, message: 'Erreur réseau ou d\'invocation de la fonction.' };
  }
};

/**
 * Parses Resend errors into human-readable messages.
 */
export const parseResendErrors = (errorData) => {
  if (!errorData) return "Erreur inconnue.";
  
  const msg = errorData.message || errorData.error?.message || JSON.stringify(errorData);
  const status = errorData.statusCode || errorData.status;

  if (status === 401 || msg.includes('unauthorized') || msg.includes('API key')) {
    return "Clé API Resend invalide ou manquante.";
  }
  if (status === 403 || msg.includes('forbidden') || msg.includes('domain')) {
    return "Domaine expéditeur non vérifié. Vérifiez la configuration dans Resend.";
  }
  if (status === 429 || msg.includes('rate limit')) {
    return "Limite de taux Resend dépassée. Veuillez patienter.";
  }
  if (status === 400 && msg.includes('validation')) {
    return "Erreur de validation de l'e-mail (format incorrect, données manquantes).";
  }
  
  return `Erreur Resend (${status}): ${msg}`;
};