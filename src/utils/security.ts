/**
 * Utility functions for security and XSS prevention
 */

/**
 * Sanitizes a string by removing potentially dangerous HTML tags and attributes
 * @param input The string to sanitize
 * @returns Sanitized string
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  
  // Remove HTML tags
  const withoutTags = input.replace(/<[^>]*>/g, '');
  
  // Escape special characters
  return withoutTags
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Validates if a string contains potentially dangerous content
 * @param input The string to validate
 * @returns boolean indicating if the input is safe
 */
export const isSafeInput = (input: string): boolean => {
  if (!input) return true;
  
  // Check for common XSS patterns
  const dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /data:/gi,
    /vbscript:/gi,
    /expression\s*\(/gi,
    /eval\s*\(/gi
  ];
  
  return !dangerousPatterns.some(pattern => pattern.test(input));
};

/**
 * Sanitizes an object by recursively sanitizing all string values
 * @param obj The object to sanitize
 * @returns Sanitized object
 */
export const sanitizeObject = (obj: any): any => {
  if (typeof obj !== 'object' || obj === null) {
    return typeof obj === 'string' ? sanitizeInput(obj) : obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    sanitized[key] = sanitizeObject(value);
  }
  return sanitized;
}; 