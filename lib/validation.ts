import { Category } from './types';
import { CATEGORIES } from './utils';

export const MAX_SINGLE_EXPENSE_AMOUNT = 1_000_000.0;
export const MIN_DESCRIPTION_LENGTH = 3;
export const MAX_DESCRIPTION_LENGTH = 60;

/**
 * Sanitizes input text to prevent XSS / script injection.
 * Strips script tags, HTML tags, and dangerous constructs.
 */
export function sanitizeText(input: string): string {
  if (!input) return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<\/?[^>]+(>|$)/g, '')
    .replace(/javascript:/gi, '')
    .trim();
}

/**
 * Validates expense description:
 * - Must be non-empty after trim
 * - Min 3 characters, max 60 characters
 */
export function validateDescription(raw: string): {
  isValid: boolean;
  error?: string;
  sanitized: string;
  charCount: number;
} {
  const trimmed = raw.trim();
  const sanitized = sanitizeText(trimmed);
  const charCount = trimmed.length;

  if (charCount === 0) {
    return { isValid: false, error: 'Description is required', sanitized, charCount: 0 };
  }
  if (charCount < MIN_DESCRIPTION_LENGTH) {
    return {
      isValid: false,
      error: `Description must be at least ${MIN_DESCRIPTION_LENGTH} characters`,
      sanitized,
      charCount,
    };
  }
  if (charCount > MAX_DESCRIPTION_LENGTH) {
    return {
      isValid: false,
      error: `Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters`,
      sanitized,
      charCount,
    };
  }

  return { isValid: true, sanitized, charCount };
}

/**
 * Validates expense amount:
 * - Positive non-zero number (min 0.01)
 * - Maximum single-entry cap of ₱1,000,000.00
 * - Maximum 2 decimal places precision (cents/centavos)
 */
export function validateAmount(raw: string | number): {
  isValid: boolean;
  error?: string;
  parsed: number;
} {
  if (raw === '' || raw === undefined || raw === null) {
    return { isValid: false, error: 'Amount is required', parsed: 0 };
  }

  const str = String(raw).trim();

  // Reject negative signs or scientific notation in string format
  if (/[-eE+]/.test(str)) {
    return { isValid: false, error: 'Invalid numeric format (no signs or exponents)', parsed: 0 };
  }

  const parsed = parseFloat(str);

  if (isNaN(parsed)) {
    return { isValid: false, error: 'Please enter a valid amount', parsed: 0 };
  }
  if (parsed <= 0) {
    return { isValid: false, error: 'Amount must be greater than ₱0.00', parsed };
  }
  if (parsed < 0.01) {
    return { isValid: false, error: 'Minimum amount is ₱0.01', parsed };
  }
  if (parsed > MAX_SINGLE_EXPENSE_AMOUNT) {
    return {
      isValid: false,
      error: `Amount exceeds maximum limit of ₱${MAX_SINGLE_EXPENSE_AMOUNT.toLocaleString()}`,
      parsed,
    };
  }

  // Check decimal places precision (maximum 2 decimal places)
  const decimalPart = str.split('.')[1];
  if (decimalPart && decimalPart.length > 2) {
    return { isValid: false, error: 'Maximum 2 decimal places (centavos) allowed', parsed };
  }

  return { isValid: true, parsed };
}

/**
 * Validates category against allowed types
 */
export function validateCategory(raw: string): { isValid: boolean; error?: string } {
  if (!raw || !CATEGORIES.includes(raw as Category)) {
    return { isValid: false, error: 'Please select a valid category' };
  }
  return { isValid: true };
}

/**
 * Validates date format and rejects future dates beyond maxDate
 */
export function validateDate(
  raw: string,
  maxDate?: string
): { isValid: boolean; error?: string } {
  if (!raw) {
    return { isValid: false, error: 'Date is required' };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return { isValid: false, error: 'Invalid date format (YYYY-MM-DD)' };
  }

  const dateObj = new Date(raw);
  if (isNaN(dateObj.getTime())) {
    return { isValid: false, error: 'Invalid calendar date' };
  }

  if (maxDate && raw > maxDate) {
    return { isValid: false, error: `Future dates beyond today (${maxDate}) are locked` };
  }

  return { isValid: true };
}

/**
 * Keydown handler to explicitly block negative signs, scientific notation, and invalid characters
 */
export function blockInvalidAmountKeys(e: React.KeyboardEvent<HTMLInputElement>): void {
  // Disallow: 'e', 'E', '-', '+', and multiple decimals
  if (['e', 'E', '-', '+'].includes(e.key)) {
    e.preventDefault();
  }
  if (e.key === '.' && e.currentTarget.value.includes('.')) {
    e.preventDefault();
  }
}

/**
 * Comprehensive form validation bundle
 */
export interface FormValidationResult {
  isValid: boolean;
  errors: {
    description?: string;
    amount?: string;
    category?: string;
    date?: string;
  };
  sanitizedDescription: string;
  parsedAmount: number;
}

export function validateExpenseForm(
  data: {
    description: string;
    amount: string | number;
    category: string;
    date: string;
  },
  maxDate?: string
): FormValidationResult {
  const descResult = validateDescription(data.description);
  const amtResult = validateAmount(data.amount);
  const catResult = validateCategory(data.category);
  const dateResult = validateDate(data.date, maxDate);

  const errors: FormValidationResult['errors'] = {};
  if (!descResult.isValid) errors.description = descResult.error;
  if (!amtResult.isValid) errors.amount = amtResult.error;
  if (!catResult.isValid) errors.category = catResult.error;
  if (!dateResult.isValid) errors.date = dateResult.error;

  const isValid =
    descResult.isValid && amtResult.isValid && catResult.isValid && dateResult.isValid;

  return {
    isValid,
    errors,
    sanitizedDescription: descResult.sanitized,
    parsedAmount: amtResult.parsed,
  };
}
