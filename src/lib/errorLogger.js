import { supabase } from '@/lib/customSupabaseClient';

const LOG_LEVELS = {
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
};

// Queue for errors to deduplicate
const errorQueue = new Set();
const ERROR_DEDUPE_TIME = 5000;

export const redactSensitiveData = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const redacted = Array.isArray(obj) ? [] : {};
  const sensitiveKeys = ['password', 'token', 'email', 'secret', 'key', 'auth', 'session'];
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        redacted[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        redacted[key] = redactSensitiveData(obj[key]);
      } else {
        redacted[key] = obj[key];
      }
    }
  }
  return redacted;
};

export const logError = async (error, context = {}) => {
  // Prevent logging the same error rapidly
  const errorKey = `${error.message}-${JSON.stringify(context)}`;
  if (errorQueue.has(errorKey)) return;
  
  errorQueue.add(errorKey);
  setTimeout(() => errorQueue.delete(errorKey), ERROR_DEDUPE_TIME);

  console.error('Logged Error:', error);

  try {
    const { data: { user } } = await supabase.auth.getUser();

    // Deeply clean sensitive data from context before logging
    const safeContext = redactSensitiveData(context);

    await supabase.from('system_logs').insert({
      level: LOG_LEVELS.ERROR,
      message: error.message || 'Unknown error',
      stack_trace: error.stack,
      context: JSON.stringify(safeContext),
      user_id: user?.id,
      url: window.location.href,
      user_agent: navigator.userAgent
    });
  } catch (loggingError) {
    // Failsafe: just console error if logging fails
    console.error('Failed to log error to database:', loggingError);
  }
};

export const logWarning = async (message, context = {}) => {
  console.warn('Logged Warning:', message);
  
  try {
     const { data: { user } } = await supabase.auth.getUser();
     const safeContext = redactSensitiveData(context);

    await supabase.from('system_logs').insert({
      level: LOG_LEVELS.WARNING,
      message: message,
      context: JSON.stringify(safeContext),
      user_id: user?.id,
      url: window.location.href,
      user_agent: navigator.userAgent
    });
  } catch (loggingError) {
    console.error('Failed to log warning:', loggingError);
  }
};