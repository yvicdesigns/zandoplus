import { supabase } from './customSupabaseClient';

/**
 * Translates Supabase/Resend auth errors into user-friendly messages for email operations.
 */
export const translateEmailError = (error) => {
  const msg = error?.message?.toLowerCase() || '';
  const code = error?.code || error?.status;

  if (msg.includes('rate limit') || msg.includes('too many requests') || code === 429) {
    return 'Le service d\'envoi d\'e-mails est temporairement saturé. Veuillez patienter avant de réessayer.';
  }
  if (msg.includes('invalid email') || msg.includes('unable to validate') || msg.includes('format')) {
    return 'L\'adresse e-mail fournie est invalide ou mal formatée. Veuillez vérifier votre saisie.';
  }
  if (msg.includes('not found') || msg.includes('user not found')) {
    return 'Si cette adresse e-mail existe, un lien de réinitialisation lui sera envoyé.';
  }
  if (msg.includes('timeout') || msg.includes('network') || msg.includes('fetch failed')) {
    return 'Problème de connexion au serveur de messagerie. Vérifiez votre connexion internet.';
  }
  if (msg.includes('configuration') || msg.includes('smtp') || msg.includes('unauthorized') || code === 401 || code === 403) {
    return 'Erreur de configuration du serveur de messagerie (SMTP/API). Veuillez contacter le support technique.';
  }
  if (msg.includes('domain') || msg.includes('verified')) {
    return 'Le domaine d\'expédition n\'est pas vérifié. Problème technique en cours de résolution.';
  }

  return `Une erreur s'est produite lors de l'envoi de l'e-mail (${code || 'Inconnue'}). Veuillez réessayer plus tard.`;
};

/**
 * Determines if the error is temporary and can be retried.
 */
export const isRetryableError = (error) => {
  const msg = error?.message?.toLowerCase() || '';
  const status = error?.status || error?.code;

  if (
    status === 429 || // Too Many Requests
    status >= 500 || // Server Errors
    msg.includes('timeout') ||
    msg.includes('network') ||
    msg.includes('rate limit')
  ) {
    return true;
  }
  return false; // Auth errors, invalid emails, missing API keys are not immediately retryable
};

/**
 * Suggests a fallback action based on the error.
 */
export const getSuggestedAction = (error) => {
  if (isRetryableError(error)) {
    return 'Veuillez patienter quelques minutes, puis cliquez sur "Réessayer".';
  }
  
  const msg = error?.message?.toLowerCase() || '';
  if (msg.includes('invalid email')) {
    return 'Veuillez corriger l\'adresse e-mail et soumettre à nouveau.';
  }

  return 'Si le problème persiste, veuillez contacter notre support technique à support@zandopluscg.com ou via WhatsApp.';
};

/**
 * Hashes an email address using SHA-256 for privacy in logs, while keeping domain visible.
 */
export const hashEmail = async (email) => {
  if (!email || typeof email !== 'string') return 'unknown';
  try {
    const parts = email.split('@');
    if (parts.length !== 2) return 'invalid_format';
    
    const msgBuffer = new TextEncoder().encode(parts[0].toLowerCase().trim());
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedLocal = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 8);
    
    return `${hashedLocal}...@${parts[1]}`;
  } catch (e) {
    return 'hash_failed';
  }
};

/**
 * Logs an email sending failure to the system_logs table with comprehensive context.
 */
export const logEmailFailure = async (email, error, context = {}) => {
  try {
    const hashedEmail = await hashEmail(email);
    const { data: { user } } = await supabase.auth.getUser();

    const logData = {
      level: 'error',
      message: `Email Failure [${context.action || 'unknown'}]: ${error?.message || 'Unknown error'}`,
      stack_trace: error?.stack || null,
      context: {
        type: 'email_delivery_failure',
        emailHash: hashedEmail,
        errorCode: error?.status || error?.code || 'UNKNOWN',
        errorMessage: error?.message,
        isRetryable: isRetryableError(error),
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        ...context
      },
      user_id: user?.id || null,
      url: window.location.href,
      user_agent: navigator.userAgent
    };

    await supabase.from('system_logs').insert(logData);
    console.error('Email operation failed, logged to system_logs:', logData);
  } catch (err) {
    console.error('CRITICAL: Failed to log email error to system_logs:', err);
  }
};