/**
 * Simple phone validation and formatting for Indian numbers
 * Backend handles full validation with phonenumbers library
 */

/**
 * Basic validation for Indian phone numbers
 * Accepts formats: 9876543210, +919876543210, 91-9876543210, etc.
 */
export function parsePhone(raw) {
  if (!raw || typeof raw !== 'string') return null
  
  // Remove all non-digit characters
  const digits = raw.replaceAll(/\D/g, '')
  
  // Indian mobile: 10 digits starting with 6-9
  // Or 12 digits with country code 91
  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return digits
  } else if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2) // Remove country code
  }
  
  return null
}

/**
 * Format phone to E.164 format (+91XXXXXXXXXX)
 */
export function formatE164(raw) {
  const parsed = parsePhone(raw)
  if (!parsed) return null
  return `+91${parsed}`
}
