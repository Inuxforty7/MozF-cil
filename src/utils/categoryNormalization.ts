import { CategoryType } from '../types/mozfacil';

/**
 * Normalizes a category or specialty name for searching, duplicate detection,
 * and deterministic ID generation.
 *
 * Handles:
 * - Leading and trailing spaces
 * - Repeated whitespace
 * - Uppercase and lowercase differences
 * - Accent / diacritic variations (e.g., "Mecânico" -> "mecanico")
 */
export function normalizeCategoryName(rawName: string): string {
  return rawName
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s\-]/g, '')
    .trim();
}

/**
 * Formats a clean human-readable display name from user input:
 * trims outer whitespace and collapses multiple internal spaces.
 */
export function formatCategoryDisplayName(rawName: string): string {
  const cleaned = rawName.trim().replace(/\s+/g, ' ');
  if (!cleaned) return '';
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/**
 * Generates a deterministic Firestore document ID for a category or specialty
 * based on its type and normalized name.
 * This prevents duplicate records even under concurrent registration requests.
 */
export function buildDeterministicCategoryId(
  rawName: string,
  categoryType: CategoryType
): string {
  const normalized = normalizeCategoryName(rawName);
  const slug = normalized
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_\-]/g, '')
    .slice(0, 100);
  const prefix = categoryType === 'profession' ? 'prof_' : 'spec_';
  return `${prefix}${slug || 'geral'}`;
}
