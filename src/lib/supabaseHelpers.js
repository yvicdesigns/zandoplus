/**
 * Executes a Supabase query with retry logic and timeout.
 * 
 * @param {Function} queryFn - A function that returns a Supabase promise (e.g. () => supabase.from('...').select())
 * @param {Object} options - Options for retry and timeout
 * @param {number} options.retries - Number of retries (default: 3)
 * @param {number} options.timeout - Timeout in ms (default: 15000)
 * @param {number} options.backoff - Base backoff delay in ms (default: 1000)
 */
export const robustQuery = async (queryFn, options = {}) => {
  const { retries = 3, timeout = 15000, backoff = 1000 } = options;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Create a promise that rejects after timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out')), timeout)
      );

      // Race the query against the timeout
      const result = await Promise.race([
        queryFn(),
        timeoutPromise
      ]);

      if (result.error) {
        throw result.error;
      }

      return { data: result.data, error: null };
    } catch (error) {
      const isLastAttempt = attempt === retries;
      
      // Don't retry on certain errors (e.g., 401 Unauthorized, 404 Not Found if handled by app logic)
      // For now, we assume most query errors might be transient network issues unless it's a specific PG error code
      // PGRST116 is "JSON object requested, multiple (or no) rows returned" - typical for .single()
      if (error.code === 'PGRST116') {
         return { data: null, error };
      }

      if (isLastAttempt) {
        console.error(`Query failed after ${retries} retries:`, error.message);
        return { data: null, error };
      }

      // Exponential backoff with jitter
      const delay = backoff * Math.pow(2, attempt) + Math.random() * 100;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};