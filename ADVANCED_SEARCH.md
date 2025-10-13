# Advanced Search System

## Overview
Full-featured search page with text queries, category filtering, condition filtering, sorting options, and pagination. URL-based state for shareable searches.

## Page Route
- **Path:** `/cauta`
- **Component:** `src/app/cauta/page.tsx`

## Features

### 1. Text Search
- **Debounced Input:** 500ms delay using `use-debounce`
- **Case-insensitive:** `ilike` operator
- **Multi-field:** Searches both `title` and `description`
- **Query Format:** `title.ilike.%query%,description.ilike.%query%`

### 2. Category Filter
Multi-select checkboxes for 7 categories:
- Electronice
- Cărți
- Haine
- Jucării
- Sport
- Casă
- Altele

### 3. Condition Filter
Multi-select checkboxes for 4 conditions:
- Nou (New)
- Ca nou (Like New)
- Bună (Good)
- Uzată (Used)

### 4. Sorting Options
Dropdown with 4 sort modes:
- **Cele mai recente** (Most Recent) - Default
- **Cele mai vechi** (Oldest)
- **Nume A-Z** (Title Ascending)
- **Nume Z-A** (Title Descending)

### 5. Pagination
- **Items per page:** 12
- **Page-based navigation:** Previous/Next buttons
- **URL parameter:** `?page=2`
- **Total pages calculation:** `Math.ceil(totalResults / ITEMS_PER_PAGE)`

### 6. URL State Management
All filters stored in URL query parameters:
```
/cauta?q=laptop&category=electronice,carti&condition=nou,ca_nou&sort=recent&page=1
```

**Parameters:**
- `q` - Search query
- `category` - Comma-separated categories
- `condition` - Comma-separated conditions
- `distance` - Maximum distance (future)
- `sort` - Sort mode
- `page` - Current page number

**Benefits:**
- Shareable search results
- Browser back/forward navigation
- Bookmark-friendly
- SEO-friendly

## Component Structure

### Main Page Component
```typescript
export default function SearchPage() {
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery] = useDebounce(searchQuery, 500);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('recent');
  const [page, setPage] = useState(1);
  
  // Results
  const [results, setResults] = useState<SearchObject[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  
  // Perform search on state changes
  useEffect(() => {
    performSearch();
  }, [debouncedQuery, selectedCategories, selectedConditions, sortBy, page]);
}
```

### Layout Structure
```
┌─────────────────────────────────────────────────┐
│ Header: "Caută Obiecte" + Result Count         │
├──────────────┬──────────────────────────────────┤
│              │                                  │
│   Filters    │        Results Grid              │
│   Sidebar    │        (3 columns)               │
│   (Sticky)   │                                  │
│              │                                  │
│              ├──────────────────────────────────┤
│              │        Pagination                │
└──────────────┴──────────────────────────────────┘
```

### Filters Sidebar
```tsx
<div className="bg-white rounded-lg shadow p-6 sticky top-4">
  {/* Reset Button */}
  <button onClick={clearFilters}>Resetează</button>
  
  {/* Search Input */}
  <input type="text" value={searchQuery} onChange={...} />
  
  {/* Categories */}
  {CATEGORIES.map(category => (
    <label>
      <input type="checkbox" checked={...} onChange={...} />
      {t(`categories.${category}`)}
    </label>
  ))}
  
  {/* Conditions */}
  {CONDITIONS.map(condition => (
    <label>
      <input type="checkbox" checked={...} onChange={...} />
      {condition.label[locale]}
    </label>
  ))}
  
  {/* Sort Dropdown */}
  <select value={sortBy} onChange={...}>
    <option value="recent">Cele mai recente</option>
    <option value="oldest">Cele mai vechi</option>
    <option value="title_asc">Nume A-Z</option>
    <option value="title_desc">Nume Z-A</option>
  </select>
</div>
```

### Results Grid
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
  {results.map(object => (
    <div className="bg-white rounded-lg shadow hover:shadow-xl cursor-pointer">
      {/* Image */}
      <div className="aspect-square bg-gray-200">
        <img src={object.images[0]} alt={object.title} />
        <div className="absolute top-2 right-2 bg-blue-600 text-white">
          {t(`categories.${object.category}`)}
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold truncate">{object.title}</h3>
        <p className="text-sm text-gray-600 line-clamp-2">{object.description}</p>
        <div className="flex items-center justify-between text-xs">
          <span>📍 {object.location}</span>
          <span>{new Date(object.created_at).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  ))}
</div>
```

## Database Query

### Supabase Query Builder
```typescript
const performSearch = async () => {
  let query = supabase
    .from('objects')
    .select('*', { count: 'exact' })
    .eq('status', 'available');

  // Text search (OR condition)
  if (debouncedQuery) {
    query = query.or(
      `title.ilike.%${debouncedQuery}%,description.ilike.%${debouncedQuery}%`
    );
  }

  // Category filter (IN condition)
  if (selectedCategories.length > 0) {
    query = query.in('category', selectedCategories);
  }

  // Condition filter
  if (selectedConditions.length > 0) {
    query = query.in('condition', selectedConditions);
  }

  // Sorting
  switch (sortBy) {
    case 'recent':
      query = query.order('created_at', { ascending: false });
      break;
    case 'oldest':
      query = query.order('created_at', { ascending: true });
      break;
    case 'title_asc':
      query = query.order('title', { ascending: true });
      break;
    case 'title_desc':
      query = query.order('title', { ascending: false });
      break;
  }

  // Pagination
  const from = (page - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;
  
  setResults(data || []);
  setTotalResults(count || 0);
  updateURL();
};
```

## Responsive Design

### Breakpoints
- **Mobile (< 768px):** 1 column grid, filters in modal/drawer
- **Tablet (768px - 1280px):** 2 column grid
- **Desktop (> 1280px):** 3 column grid + sticky sidebar

### Grid Classes
```css
grid-cols-1           /* Mobile: 1 column */
md:grid-cols-2        /* Tablet: 2 columns */
xl:grid-cols-3        /* Desktop: 3 columns */
```

## Empty States

### No Results
```tsx
{results.length === 0 && (
  <div className="text-center py-16">
    <p className="text-4xl mb-4">🔍</p>
    <p className="text-xl font-semibold text-gray-900 mb-2">
      {locale === 'ro' ? 'Niciun rezultat' : 'No results'}
    </p>
    <p className="text-gray-600">
      {locale === 'ro' 
        ? 'Încearcă să ajustezi filtrele'
        : 'Try adjusting your filters'}
    </p>
  </div>
)}
```

### Loading State
```tsx
{loading && (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
)}
```

## Debouncing

**Package:** `use-debounce` v10+

**Implementation:**
```typescript
import { useDebounce } from 'use-debounce';

const [searchQuery, setSearchQuery] = useState('');
const [debouncedQuery] = useDebounce(searchQuery, 500);

useEffect(() => {
  // Only triggers 500ms after user stops typing
  performSearch();
}, [debouncedQuery]);
```

**Benefits:**
- Reduces API calls
- Better performance
- Smoother UX
- No search spam

## URL Management

### Reading from URL
```typescript
const searchParams = useSearchParams();

const [searchQuery, setSearchQuery] = useState(
  searchParams.get('q') || ''
);
const [selectedCategories, setSelectedCategories] = useState<string[]>(
  searchParams.get('category')?.split(',').filter(Boolean) || []
);
const [page, setPage] = useState(
  parseInt(searchParams.get('page') || '1')
);
```

### Writing to URL
```typescript
const updateURL = () => {
  const params = new URLSearchParams();
  
  if (searchQuery) params.set('q', searchQuery);
  if (selectedCategories.length > 0) 
    params.set('category', selectedCategories.join(','));
  if (selectedConditions.length > 0) 
    params.set('condition', selectedConditions.join(','));
  if (sortBy !== 'recent') 
    params.set('sort', sortBy);
  if (page > 1) 
    params.set('page', page.toString());

  const queryString = params.toString();
  router.replace(`/cauta${queryString ? `?${queryString}` : ''}`, { 
    scroll: false 
  });
};
```

## Filter Actions

### Toggle Category
```typescript
const toggleCategory = (category: string) => {
  setSelectedCategories(prev =>
    prev.includes(category)
      ? prev.filter(c => c !== category)
      : [...prev, category]
  );
  setPage(1); // Reset to page 1 on filter change
};
```

### Clear All Filters
```typescript
const clearFilters = () => {
  setSearchQuery('');
  setSelectedCategories([]);
  setSelectedConditions([]);
  setMaxDistance(999999);
  setSortBy('recent');
  setPage(1);
};
```

## Pagination

### Calculation
```typescript
const ITEMS_PER_PAGE = 12;
const totalPages = Math.ceil(totalResults / ITEMS_PER_PAGE);

// Range for Supabase query
const from = (page - 1) * ITEMS_PER_PAGE;  // e.g., page 2: (2-1)*12 = 12
const to = from + ITEMS_PER_PAGE - 1;      // e.g., 12 + 12 - 1 = 23
query = query.range(from, to);             // Items 12-23
```

### UI Component
```tsx
{totalPages > 1 && (
  <div className="flex items-center justify-center space-x-2">
    <button
      onClick={() => setPage(p => Math.max(1, p - 1))}
      disabled={page === 1}
      className="px-4 py-2 border rounded-lg disabled:opacity-50"
    >
      {locale === 'ro' ? 'Înapoi' : 'Previous'}
    </button>
    
    <span className="text-sm text-gray-600">
      {locale === 'ro' 
        ? `Pagina ${page} din ${totalPages}`
        : `Page ${page} of ${totalPages}`}
    </span>
    
    <button
      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
      disabled={page === totalPages}
      className="px-4 py-2 border rounded-lg disabled:opacity-50"
    >
      {locale === 'ro' ? 'Înainte' : 'Next'}
    </button>
  </div>
)}
```

## Future Enhancements

### Distance-Based Search (TODO)
```typescript
// Add user location and calculate distances
const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
const [maxDistance, setMaxDistance] = useState(999999);

// Geocoding for location search
const geocodeLocation = async (address: string) => {
  // Use Google Maps Geocoding API or similar
};

// Filter by distance
const filterByDistance = (objects: SearchObject[]) => {
  return objects.filter(obj => {
    const distance = calculateDistance(userLocation, obj.location);
    return distance <= maxDistance;
  });
};
```

### Full-Text Search Enhancement (TODO)
```sql
-- Create GIN index for better full-text search
CREATE INDEX idx_objects_search 
ON objects 
USING GIN (to_tsvector('romanian', title || ' ' || description));

-- Use ts_query for advanced search
SELECT * FROM objects
WHERE to_tsvector('romanian', title || ' ' || description) 
  @@ to_tsquery('romanian', 'laptop & gaming');
```

### Saved Searches (TODO)
```typescript
// Allow users to save search criteria
const saveSearch = async (name: string) => {
  await supabase
    .from('saved_searches')
    .insert([{
      user_id: userId,
      name: name,
      query: searchQuery,
      categories: selectedCategories,
      conditions: selectedConditions,
      sort: sortBy,
    }]);
};
```

## Testing Checklist

- [ ] Text search finds objects by title
- [ ] Text search finds objects by description
- [ ] Category filter works with single selection
- [ ] Category filter works with multiple selections
- [ ] Condition filter works correctly
- [ ] Sorting changes result order
- [ ] Pagination shows correct items
- [ ] URL updates on filter changes
- [ ] URL params restore search state
- [ ] Debounce prevents excessive API calls
- [ ] Empty state displays correctly
- [ ] Loading state works
- [ ] Clear filters resets all state
- [ ] Click on object navigates to detail page
- [ ] Responsive design works on mobile
- [ ] Bilingual labels display correctly

## Performance Optimization

- ✅ Debounced text input (500ms)
- ✅ Indexed database columns (category, condition, created_at)
- ✅ Pagination limits results (12 per page)
- ✅ Count query optimization (`count: 'exact'`)
- ✅ URL state prevents unnecessary re-renders
- ⚠️ Consider caching popular searches (future)
- ⚠️ Consider virtual scrolling for large result sets (future)

## SEO Considerations

- ✅ URL-based state (crawlable)
- ✅ Semantic HTML structure
- ✅ Alt text on images
- ⚠️ Consider server-side rendering (Next.js SSR)
- ⚠️ Add meta tags for search pages
- ⚠️ Implement structured data (Schema.org)

---

**Branch:** `feature/advanced-search`  
**Status:** ✅ Complete  
**Deployment:** Vercel Preview Available
