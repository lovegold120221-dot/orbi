/**
 * Shared utility for fetching from the Gemini REST API with retry logic.
 *
 * Transient 5xx errors (503, 502, 504) from Gemini are retried with
 * exponential backoff up to `maxRetries` times. 4xx errors (bad request,
 * auth, quota) are passed through immediately since retrying won't help.
 */

const RETRYABLE_STATUSES = new Set([502, 503, 504]);
const INITIAL_DELAY_MS = 1000;
const MAX_RETRIES = 2;

export async function fetchGeminiWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = MAX_RETRIES,
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      // Non-retryable — pass through immediately (4xx, 200, etc.)
      if (!RETRYABLE_STATUSES.has(response.status)) {
        return response;
      }

      // Retryable 5xx — throw so we catch it below and retry
      const errBody = await response.text().catch(() => "");
      throw new Error(
        `Eburon returned ${response.status}: ${errBody.slice(0, 200)}`,
      );
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      // Don't retry if we've exhausted attempts
      if (attempt >= maxRetries) break;

      // Exponential backoff with jitter
      const delay =
        INITIAL_DELAY_MS * Math.pow(2, attempt) +
        Math.random() * INITIAL_DELAY_MS * 0.5;
      console.warn(
        `Eburon fetch attempt ${attempt + 1}/${maxRetries + 1} failed, retrying in ${Math.round(delay)}ms: ${lastError.message}`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError ?? new Error("Eburon fetch failed after retries");
}
