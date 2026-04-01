/**
 * Wraps a promise with a timeout.
 * @param {Promise} promise - The promise to wrap.
 * @param {number} ms - Timeout in milliseconds.
 * @returns {Promise}
 */
export const withTimeout = (promise, ms) => {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error('Request Timeout'));
    }, ms);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutId);
  });
};

/**
 * Retries a promise-returning function with exponential backoff.
 * @param {Function} fn - Function that returns a promise.
 * @param {number} retries - Maximum number of retries.
 * @param {number} delay - Initial delay in ms.
 * @returns {Promise}
 */
export const withRetry = async (fn, retries = 3, delay = 1000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    
    // Don't retry on client errors (4xx) except 429 Too Many Requests
    if (error.status && error.status >= 400 && error.status < 500 && error.status !== 429) {
        throw error;
    }

    console.warn(`[Retry] Operation failed. Retrying in ${delay}ms... (${retries} attempts left)`);
    await new Promise((resolve) => setTimeout(resolve, delay));
    return withRetry(fn, retries - 1, delay * 2);
  }
};