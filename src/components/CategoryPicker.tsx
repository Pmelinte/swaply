'use client';

/**
 * CategoryPicker Component
 * Smart category selector with fuzzy search, auto-suggestions, and hierarchical navigation
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, ChevronRight, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import * as Icons from 'lucide-react';
import {
  searchCategories,
  suggestCategoryFromKeywords,
  getRootCategories,
  getChildCategories,
  getCategoryBreadcrumb,
  type Category,
  type CategorySearchResult,
  type CategorySuggestion,
  type CategoryBreadcrumb,
} from '@/lib/taxonomy';
import { useI18n } from '@/lib/i18n';

export interface CategoryPickerProps {
  value?: string | null;
  onChange: (categoryId: string, category: Category) => void;
  language?: string;
  // Optional context for AI suggestions
  objectTitle?: string;
  objectDescription?: string;
  // UI customization
  placeholder?: string;
  showSuggestions?: boolean;
  showBreadcrumb?: boolean;
  className?: string;
}

export default function CategoryPicker({
  value,
  onChange,
  language = 'ro',
  objectTitle,
  objectDescription,
  placeholder,
  showSuggestions = true,
  showBreadcrumb = true,
  className = '',
}: CategoryPickerProps) {
  const { t } = useI18n();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CategorySearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<CategorySuggestion[]>([]);
  const [rootCategories, setRootCategories] = useState<Category[]>([]);
  const [childCategories, setChildCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<CategoryBreadcrumb[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [activeParent, setActiveParent] = useState<string | null>(null);

  // Load root categories on mount
  useEffect(() => {
    getRootCategories(language).then(setRootCategories).catch(console.error);
  }, [language]);

  // Load existing category if value provided
  useEffect(() => {
    if (value && value !== selectedCategory?.id) {
      getCategoryBreadcrumb(value, language)
        .then(setBreadcrumb)
        .catch(console.error);
    }
  }, [value, language, selectedCategory]);

  // Load AI suggestions when title/description changes
  useEffect(() => {
    if (!showSuggestions || !objectTitle) return;

    const loadSuggestions = async () => {
      setIsLoadingSuggestions(true);
      try {
        const results = await suggestCategoryFromKeywords(
          objectTitle,
          objectDescription || '',
          language,
          5
        );
        setSuggestions(results);
      } catch (error) {
        console.error('Error loading suggestions:', error);
      } finally {
        setIsLoadingSuggestions(false);
      }
    };

    const debounceTimer = setTimeout(loadSuggestions, 500);
    return () => clearTimeout(debounceTimer);
  }, [objectTitle, objectDescription, language, showSuggestions]);

  // Search categories (debounced)
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const performSearch = async () => {
      setIsSearching(true);
      try {
        const results = await searchCategories(searchQuery, language, 15);
        setSearchResults(results);
      } catch (error) {
        console.error('Error searching categories:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(performSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, language]);

  // Load child categories when parent is clicked
  const loadChildCategories = useCallback(
    async (parentId: string) => {
      try {
        const children = await getChildCategories(parentId, language);
        setChildCategories(children);
        setActiveParent(parentId);
      } catch (error) {
        console.error('Error loading child categories:', error);
      }
    },
    [language]
  );

  // Handle category selection
  const handleSelectCategory = useCallback(
    async (categoryId: string, categoryData?: Partial<Category>) => {
      // If we have full category data, use it
      if (categoryData && categoryData.name) {
        const category = categoryData as Category;
        setSelectedCategory(category);
        onChange(categoryId, category);
        setSearchQuery('');
        setSearchResults([]);

        // Load breadcrumb
        if (showBreadcrumb) {
          const breadcrumbData = await getCategoryBreadcrumb(categoryId, language);
          setBreadcrumb(breadcrumbData);
        }
      }
    },
    [onChange, language, showBreadcrumb]
  );

  // Get icon component
  const getIconComponent = (iconName: string | null) => {
    if (!iconName) return Icons.Package;
    const IconComponent = (Icons as any)[iconName];
    return IconComponent || Icons.Package;
  };

  // Render category card
  const renderCategoryCard = (
    cat: Category,
    onClick: () => void,
    badge?: { text: string; color: string }
  ) => {
    const IconComponent = getIconComponent(cat.icon_name);
    const isSelected = selectedCategory?.id === cat.id;

    return (
      <button
        key={cat.id}
        onClick={onClick}
        className={`
          relative flex items-center gap-3 p-3 rounded-lg border-2 transition-all
          ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}
        `}
      >
        {/* Icon */}
        <div
          className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
        >
          <IconComponent className="w-6 h-6" />
        </div>

        {/* Content */}
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">{cat.name}</span>
            {badge && (
              <span
                className="px-2 py-0.5 text-xs font-medium rounded"
                style={{ backgroundColor: badge.color, color: 'white' }}
              >
                {badge.text}
              </span>
            )}
          </div>
          {cat.description && (
            <p className="text-sm text-gray-600 line-clamp-1">{cat.description}</p>
          )}
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
            {cat.object_count !== undefined && (
              <span>{cat.object_count} {t('common.objects').toLowerCase()}</span>
            )}
            {cat.children_count !== undefined && cat.children_count > 0 && (
              <span>• {cat.children_count} {t('common.subcategories')}</span>
            )}
          </div>
        </div>

        {/* Expand indicator */}
        {cat.children_count !== undefined && cat.children_count > 0 && (
          <ChevronRight className="w-5 h-5 text-gray-400" />
        )}

        {/* Selection indicator */}
        {isSelected && (
          <CheckCircle2 className="absolute top-2 right-2 w-5 h-5 text-blue-500" />
        )}
      </button>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Breadcrumb */}
      {showBreadcrumb && breadcrumb.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          {breadcrumb.map((crumb, index) => (
            <div key={crumb.id} className="flex items-center gap-2">
              {index > 0 && <ChevronRight className="w-4 h-4" />}
              <span className={index === breadcrumb.length - 1 ? 'font-medium text-gray-900' : ''}>
                {crumb.name}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={placeholder || t('category.searchPlaceholder')}
          className="w-full pl-10 pr-10 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500 animate-spin" />
        )}
      </div>

      {/* AI Suggestions */}
      {showSuggestions && suggestions.length > 0 && !searchQuery && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Sparkles className="w-4 h-4 text-yellow-500" />
            <span>{t('category.aiSuggestions')}</span>
            {isLoadingSuggestions && <Loader2 className="w-4 h-4 animate-spin" />}
          </div>
          <div className="grid gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.category_id}
                onClick={() =>
                  handleSelectCategory(suggestion.category_id, {
                    id: suggestion.category_id,
                    name: suggestion.category_name,
                    path: suggestion.category_path,
                  } as Category)
                }
                className="flex items-center justify-between p-3 rounded-lg border border-yellow-200 bg-yellow-50 hover:bg-yellow-100 transition-colors"
              >
                <div className="text-left">
                  <div className="font-medium text-gray-900">{suggestion.category_name}</div>
                  <div className="text-sm text-gray-600">{suggestion.category_path}</div>
                  {suggestion.matched_keywords.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {suggestion.matched_keywords.slice(0, 3).map((keyword) => (
                        <span
                          key={keyword}
                          className="px-2 py-0.5 text-xs bg-yellow-200 text-yellow-900 rounded"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-yellow-700">
                    {Math.round(suggestion.confidence_score * 100)}%
                  </span>
                  <ChevronRight className="w-5 h-5 text-yellow-600" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      {searchQuery && searchResults.length > 0 && (
        <div className="space-y-3">
          <div className="text-sm font-medium text-gray-700">
            {t('category.searchResults')} ({searchResults.length})
          </div>
          <div className="grid gap-2">
            {searchResults.map((result) => (
              <button
                key={result.id}
                onClick={() =>
                  handleSelectCategory(result.id, {
                    id: result.id,
                    name: result.name,
                    description: result.description,
                    path: result.path,
                    icon_name: result.icon_name,
                  } as Category)
                }
                className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-gray-50 transition-colors"
              >
                <div className="text-left">
                  <div className="font-medium text-gray-900">{result.name}</div>
                  <div className="text-sm text-gray-600">{result.path}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                    {result.match_type}
                  </span>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No search results */}
      {searchQuery && searchResults.length === 0 && !isSearching && (
        <div className="text-center py-8 text-gray-500">
          <p>{t('category.noResults')}</p>
          <p className="text-sm mt-1">{t('category.tryDifferentKeywords')}</p>
        </div>
      )}

      {/* Root Categories (when no search) */}
      {!searchQuery && rootCategories.length > 0 && (
        <div className="space-y-3">
          <div className="text-sm font-medium text-gray-700">
            {t('category.mainCategories')}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {rootCategories.map((cat) =>
              renderCategoryCard(cat, () => {
                if (cat.children_count && cat.children_count > 0) {
                  loadChildCategories(cat.id);
                } else {
                  handleSelectCategory(cat.id, cat);
                }
              })
            )}
          </div>
        </div>
      )}

      {/* Child Categories */}
      {!searchQuery && childCategories.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setChildCategories([]);
                setActiveParent(null);
              }}
              className="text-sm text-blue-600 hover:underline"
            >
              ← {t('common.back')}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {childCategories.map((cat) =>
              renderCategoryCard(cat, () => {
                if (cat.children_count && cat.children_count > 0) {
                  loadChildCategories(cat.id);
                } else {
                  handleSelectCategory(cat.id, cat);
                }
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
