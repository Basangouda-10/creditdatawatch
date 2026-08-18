export function isValidGstin(value = '') {
  const gstin = value.trim().toUpperCase()
  const pattern = /^\d{2}[A-Z]{5}\d{4}[A-Z][\dA-Z]Z[\dA-Z]$/
  return pattern.test(gstin)
}
