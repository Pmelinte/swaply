/**
 * AI Taxonomy Library
 * International product classification system with fuzzy search and auto-suggestion
 */

import { createClient } from '@/lib/supabase/client';

// ============================================================================
// TYPES
// ============================================================================

export interface Category {
  id: string;
  parent_id: string | null;
  level: number;
  path: string;
  code: string;
  name: string;
  description: string | null;
  icon_name: string | null;
  color: string | null;
  is_service: boolean;
  is_housing: boolean;
  children_count?: number;
  object_count?: number;
  unspsc_code?: string | null;
  hs_code?: string | null;
  isic_code?: string | null;
}

export interface CategoryBreadcrumb {
  id: string;
  name: string;
  path: string;
  level: number;
}

export interface CategorySearchResult {
  id: string;
  name: string;
  description: string | null;
  path: string;
  icon_name: string | null;
  similarity_score: number;
  match_type: 'exact' | 'prefix' | 'fuzzy' | 'alias' | 'keyword';
}

export interface CategorySuggestion {
  category_id: string;
  category_name: string;
  category_path: string;
  confidence_score: number;
  matched_keywords: string[];
}

export interface CategoryAnalytics {
  id: string;
  code: string;
  name_en: string;
  level: number;
  path: string;
  popularity_score: number;
  object_count: number;
  unique_users: number;
  avg_confidence: number | null;
  last_used: string | null;
  objects_last_7d: number;
  objects_last_30d: number;
}

// ============================================================================
// CATEGORY TREE OPERATIONS
// ============================================================================

/**
 * Get hierarchical category tree
 * @param parentId - Parent category ID (null for root)
 * @param language - Language code (default: 'ro')
 * @param maxDepth - Maximum depth to fetch (default: 3)
 */
export async function getCategoryTree(
  parentId: string | null = null,
  language: string = 'ro',
  maxDepth: number = 3
): Promise<Category[]> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc('get_category_tree', {
    p_parent_id: parentId,
    p_language: language,
    p_max_depth: maxDepth,
  });

  if (error) {
    console.error('Error fetching category tree:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get root categories (level 0)
 */
export async function getRootCategories(language: string = 'ro'): Promise<Category[]> {
  return getCategoryTree(null, language, 1);
}

/**
 * Get child categories of a specific parent
 */
export async function getChildCategories(
  parentId: string,
  language: string = 'ro'
): Promise<Category[]> {
  return getCategoryTree(parentId, language, 1);
}

/**
 * Get category breadcrumb (path from root)
 */
export async function getCategoryBreadcrumb(
  categoryId: string,
  language: string = 'ro'
): Promise<CategoryBreadcrumb[]> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc('get_category_breadcrumb', {
    p_category_id: categoryId,
    p_language: language,
  });

  if (error) {
    console.error('Error fetching category breadcrumb:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get single category by ID
 */
export async function getCategoryById(
  categoryId: string,
  language: string = 'ro'
): Promise<Category | null> {
  const supabase = createClient();

  // First get the category
  const { data: category, error: categoryError } = await supabase
    .from('categories')
    .select('*')
    .eq('id', categoryId)
    .single();

  if (categoryError || !category) {
    console.error('Error fetching category:', categoryError);
    return null;
  }

  // Get translation if not English
  if (language !== 'en') {
    const { data: translation } = await supabase
      .from('category_translations')
      .select('name, description')
      .eq('category_id', categoryId)
      .eq('language_code', language)
      .single();

    if (translation) {
      category.name = translation.name;
      category.description = translation.description;
    }
  } else {
    category.name = category.name_en;
    category.description = category.description_en;
  }

  return category;
}

// ============================================================================
// SEARCH & AUTO-SUGGESTION
// ============================================================================

/**
 * Fuzzy search categories with multiple matching strategies
 * @param query - Search query
 * @param language - Language code
 * @param limit - Maximum results
 */
export async function searchCategories(
  query: string,
  language: string = 'ro',
  limit: number = 20
): Promise<CategorySearchResult[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const supabase = createClient();

  const { data, error } = await supabase.rpc('search_categories', {
    p_query: query.trim(),
    p_language: language,
    p_limit: limit,
  });

  if (error) {
    console.error('Error searching categories:', error);
    throw error;
  }

  return data || [];
}

/**
 * Auto-suggest category from object title and description
 * @param title - Object title
 * @param description - Object description
 * @param language - Language code
 * @param limit - Maximum suggestions
 */
export async function suggestCategoryFromKeywords(
  title: string,
  description: string = '',
  language: string = 'ro',
  limit: number = 5
): Promise<CategorySuggestion[]> {
  if (!title || title.trim().length < 3) {
    return [];
  }

  const supabase = createClient();

  const { data, error } = await supabase.rpc('suggest_category_from_keywords', {
    p_title: title.trim(),
    p_description: description.trim(),
    p_language: language,
    p_limit: limit,
  });

  if (error) {
    console.error('Error suggesting categories:', error);
    throw error;
  }

  return data || [];
}

/**
 * Smart category picker: combines search and suggestions
 * Returns top results from both methods
 */
export async function smartCategoryPicker(
  query: string,
  context: { title?: string; description?: string } = {},
  language: string = 'ro'
): Promise<{
  searchResults: CategorySearchResult[];
  suggestions: CategorySuggestion[];
}> {
  const [searchResults, suggestions] = await Promise.all([
    searchCategories(query, language, 10),
    context.title
      ? suggestCategoryFromKeywords(
          context.title,
          context.description || '',
          language,
          5
        )
      : Promise.resolve([]),
  ]);

  return {
    searchResults,
    suggestions,
  };
}

// ============================================================================
// CATEGORY ANALYTICS
// ============================================================================

/**
 * Get popular categories (most used)
 */
export async function getPopularCategories(
  limit: number = 10,
  timeframe: '7d' | '30d' | 'all' = 'all'
): Promise<CategoryAnalytics[]> {
  const supabase = createClient();

  let query = supabase
    .from('category_analytics')
    .select('*')
    .order('object_count', { ascending: false })
    .limit(limit);

  // Filter by timeframe
  if (timeframe === '7d') {
    query = query.gt('objects_last_7d', 0).order('objects_last_7d', { ascending: false });
  } else if (timeframe === '30d') {
    query = query.gt('objects_last_30d', 0).order('objects_last_30d', { ascending: false });
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching popular categories:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get trending categories (growing in popularity)
 */
export async function getTrendingCategories(limit: number = 10): Promise<CategoryAnalytics[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('category_analytics')
    .select('*')
    .gt('objects_last_7d', 0)
    .order('objects_last_7d', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching trending categories:', error);
    throw error;
  }

  return data || [];
}

// ============================================================================
// CATEGORY ASSIGNMENT
// ============================================================================

/**
 * Assign category to object (manual)
 */
export async function assignCategoryToObject(
  objectId: string,
  categoryId: string,
  userId: string
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('objects')
    .update({
      category_id: categoryId,
      ai_classification_method: 'manual',
      ai_category_confidence: 1.0,
      category_override_by: userId,
    })
    .eq('id', objectId);

  if (error) {
    console.error('Error assigning category:', error);
    throw error;
  }
}

/**
 * Auto-assign category based on AI suggestion
 */
export async function autoAssignCategory(
  objectId: string,
  title: string,
  description: string = '',
  language: string = 'ro'
): Promise<{ categoryId: string; confidence: number } | null> {
  const suggestions = await suggestCategoryFromKeywords(title, description, language, 1);

  if (suggestions.length === 0 || suggestions[0].confidence_score < 0.5) {
    return null;
  }

  const supabase = createClient();
  const topSuggestion = suggestions[0];

  const { error } = await supabase
    .from('objects')
    .update({
      category_id: topSuggestion.category_id,
      ai_classification_method: 'keyword',
      ai_category_confidence: topSuggestion.confidence_score,
    })
    .eq('id', objectId);

  if (error) {
    console.error('Error auto-assigning category:', error);
    throw error;
  }

  return {
    categoryId: topSuggestion.category_id,
    confidence: topSuggestion.confidence_score,
  };
}

// ============================================================================
// CATEGORY UTILITIES
// ============================================================================

/**
 * Get category icon component name (for lucide-react)
 */
export function getCategoryIcon(category: Category): string {
  return category.icon_name || 'Package';
}

/**
 * Get category color
 */
export function getCategoryColor(category: Category): string {
  return category.color || '#6B7280';
}

/**
 * Format category path for display
 */
export function formatCategoryPath(path: string): string {
  return path
    .split('/')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' › ');
}

/**
 * Check if category is a service
 */
export function isServiceCategory(category: Category): boolean {
  return category.is_service;
}

/**
 * Check if category is housing
 */
export function isHousingCategory(category: Category): boolean {
  return category.is_housing;
}

/**
 * Check if category requires shipping
 */
export async function requiresShipping(categoryId: string): Promise<boolean> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('categories')
    .select('requires_shipping')
    .eq('id', categoryId)
    .single();

  if (error || !data) {
    return true; // Default to requiring shipping
  }

  return data.requires_shipping;
}

// ============================================================================
// CATEGORY CACHE (Client-side)
// ============================================================================

const categoryCache = new Map<string, { data: Category; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get category with cache
 */
export async function getCategoryCached(
  categoryId: string,
  language: string = 'ro'
): Promise<Category | null> {
  const cacheKey = `${categoryId}-${language}`;
  const cached = categoryCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const category = await getCategoryById(categoryId, language);

  if (category) {
    categoryCache.set(cacheKey, { data: category, timestamp: Date.now() });
  }

  return category;
}

/**
 * Clear category cache
 */
export function clearCategoryCache(): void {
  categoryCache.clear();
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Tree operations
  getCategoryTree,
  getRootCategories,
  getChildCategories,
  getCategoryBreadcrumb,
  getCategoryById,
  
  // Search & suggestions
  searchCategories,
  suggestCategoryFromKeywords,
  smartCategoryPicker,
  
  // Analytics
  getPopularCategories,
  getTrendingCategories,
  
  // Assignment
  assignCategoryToObject,
  autoAssignCategory,
  
  // Utilities
  getCategoryIcon,
  getCategoryColor,
  formatCategoryPath,
  isServiceCategory,
  isHousingCategory,
  requiresShipping,
  
  // Cache
  getCategoryCached,
  clearCategoryCache,
};
