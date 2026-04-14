import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitizes an input string to block potential XSS vectors and strip dangerous HTML/script tags.
 * This should be used for free-text inputs from end-users before persisting to the database.
 * 
 * @param input - The string to sanitize
 * @returns The sanitized string with dangerous tags removed
 */
export function sanitizeInput(input: string | null | undefined): string {
  if (!input) return '';
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // Strip all HTML tags by default for simple text inputs
    ALLOWED_ATTR: [], // Strip all attributes
  }).trim();
}
