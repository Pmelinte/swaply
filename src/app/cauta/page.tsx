'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getBrowserSupabase } from '@/lib/supabase/client';
import { useI18n } from '@/lib/i18n';
import { useDebounce } from 'use-debounce';

interface SearchObject {
  id: string;
  title: string;
  description: string;
  category: string;
  condition: string;
  location: string;
  images: string[];
  created_at: string;
  user_id: string;
  distance_km?: number; // Optional, only present when distance search is active
}

const CATEGORIES = [
  'electronice',
  'carti',
  'haine',
  'jucarii',
  'sport',
  'casa',
  'altele',
];

const CONDITIONS = [
  { value: 'nou', label: { ro: 'Nou', en: 'New' } },
  { value: 'ca_nou', label: { ro: 'Ca nou', en: 'Like New' } },
  { value: 'buna', label: { ro: 'Bună', en: 'Good' } },
  { value: 'uzata', label: { ro: 'Uzată', en: 'Used' } },
];

const DISTANCE_OPTIONS = [
  { value: 10, label: '10 km' },
  { value: 25, label: '25 km' },
  { value: 50, label: '50 km' },
  { value: 100, label: '100 km' },
  { value: 999999, label: { ro: 'Toată țara', en: 'Entire country' } },
];

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, locale } = useI18n();

  // Search state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [debouncedQuery] = useDebounce(searchQuery, 500);

  // Filter state
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    searchParams.get('category')?.split(',').filter(Boolean) || []
  );
  const [selectedConditions, setSelectedConditions] = useState<string[]>(
    searchParams.get('condition')?.split(',').filter(Boolean) || []
  );
  const [maxDistance, setMaxDistance] = useState<number>(
    parseInt(searchParams.get('distance') || '999999')
  );
  const [sortBy, setSortBy] = useState<string>(
    searchParams.get('sort') || 'recent'
  );

  // Location state
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  // Results state
  const [results, setResults] = useState<SearchObject[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  const supabase = getBrowserSupabase();

  // Get user location on mount
  useEffect(() => {
    if ('geolocation' in navigator && maxDistance !== 999999) {
      getUserLocation();
    }
  }, []);

  const getUserLocation = () => {
    setLocationLoading(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
        setLocationLoading(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLocationError(
          locale === 'ro'
            ? 'Nu am putut obține locația. Asigură-te că ai permis accesul la locație.'
            : 'Could not get location. Make sure you allowed location access.'
        );
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000, // Cache for 5 minutes
      }
    );
  };

  useEffect(() => {
    performSearch();
  }, [debouncedQuery, selectedCategories, selectedConditions, maxDistance, sortBy, page]);

  const performSearch = async () => {
    setLoading(true);
    try {
      // Use distance-based search if location is available and distance filter is active
      if (maxDistance !== 999999 && userLocation) {
        const { data, error } = await supabase.rpc('search_objects_by_distance', {
          user_lat: userLocation.lat,
          user_lon: userLocation.lon,
          radius_km: maxDistance,
          search_query: debouncedQuery || null,
          object_category: selectedCategories.length === 1 ? selectedCategories[0] : null,
          max_results: 1000, // Get all results for client-side pagination and filtering
        });

        if (error) throw error;

        let filteredResults = data || [];

        // Apply additional filters client-side
        if (selectedCategories.length > 1) {
          filteredResults = filteredResults.filter((obj: SearchObject & { distance_km: number }) =>
            selectedCategories.includes(obj.category)
          );
        }

        if (selectedConditions.length > 0) {
          filteredResults = filteredResults.filter((obj: SearchObject & { distance_km: number; condition: string }) =>
            selectedConditions.includes(obj.condition)
          );
        }

        // Apply sorting
        switch (sortBy) {
          case 'distance':
            // Already sorted by distance from function
            break;
          case 'recent':
            filteredResults.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            break;
          case 'oldest':
            filteredResults.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            break;
          case 'title_asc':
            filteredResults.sort((a, b) => a.title.localeCompare(b.title));
            break;
          case 'title_desc':
            filteredResults.sort((a, b) => b.title.localeCompare(a.title));
            break;
        }

        setTotalResults(filteredResults.length);

        // Apply pagination client-side
        const from = (page - 1) * ITEMS_PER_PAGE;
        const to = from + ITEMS_PER_PAGE;
        setResults(filteredResults.slice(from, to));
      } else {
        // Standard search without distance
        let query = supabase
          .from('objects')
          .select('*', { count: 'exact' })
          .eq('status', 'available');

        // Text search
        if (debouncedQuery) {
          query = query.or(`title.ilike.%${debouncedQuery}%,description.ilike.%${debouncedQuery}%`);
        }

        // Category filter
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

        if (error) throw error;

        setResults(data || []);
        setTotalResults(count || 0);
      }

      // Update URL
      updateURL();
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateURL = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedCategories.length > 0) params.set('category', selectedCategories.join(','));
    if (selectedConditions.length > 0) params.set('condition', selectedConditions.join(','));
    if (maxDistance !== 999999) params.set('distance', maxDistance.toString());
    if (sortBy !== 'recent') params.set('sort', sortBy);
    if (page > 1) params.set('page', page.toString());

    const queryString = params.toString();
    router.replace(`/cauta${queryString ? `?${queryString}` : ''}`, { scroll: false });
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
    setPage(1);
  };

  const toggleCondition = (condition: string) => {
    setSelectedConditions((prev) =>
      prev.includes(condition)
        ? prev.filter((c) => c !== condition)
        : [...prev, condition]
    );
    setPage(1);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategories([]);
    setSelectedConditions([]);
    setMaxDistance(999999);
    setSortBy('recent');
    setPage(1);
  };

  const totalPages = Math.ceil(totalResults / ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {locale === 'ro' ? 'Caută Obiecte' : 'Search Objects'}
          </h1>
          <p className="text-gray-600">
            {locale === 'ro' 
              ? `${totalResults} rezultate găsite`
              : `${totalResults} results found`}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">
                  {locale === 'ro' ? 'Filtre' : 'Filters'}
                </h2>
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {locale === 'ro' ? 'Resetează' : 'Reset'}
                </button>
              </div>

              {/* Search Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {locale === 'ro' ? 'Caută' : 'Search'}
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={locale === 'ro' ? 'Caută...' : 'Search...'}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Categories */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  {locale === 'ro' ? 'Categorii' : 'Categories'}
                </h3>
                <div className="space-y-2">
                  {CATEGORIES.map((category) => (
                    <label key={category} className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category)}
                        onChange={() => toggleCategory(category)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 capitalize">
                        {t(`categories.${category}`)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Conditions */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  {locale === 'ro' ? 'Stare' : 'Condition'}
                </h3>
                <div className="space-y-2">
                  {CONDITIONS.map((condition) => (
                    <label key={condition.value} className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedConditions.includes(condition.value)}
                        onChange={() => toggleCondition(condition.value)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        {condition.label[locale]}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Distance Filter */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  {locale === 'ro' ? 'Distanță maximă' : 'Maximum Distance'}
                </h3>
                {locationError && (
                  <div className="text-xs text-amber-600 mb-2 p-2 bg-amber-50 rounded">
                    ⚠️ {locationError}
                  </div>
                )}
                {locationLoading && (
                  <div className="text-xs text-blue-600 mb-2 p-2 bg-blue-50 rounded">
                    📍 {locale === 'ro' ? 'Obțin locația...' : 'Getting location...'}
                  </div>
                )}
                {userLocation && maxDistance !== 999999 && (
                  <div className="text-xs text-green-600 mb-2 p-2 bg-green-50 rounded">
                    ✓ {locale === 'ro' ? 'Locație activă' : 'Location active'}
                  </div>
                )}
                <select
                  value={maxDistance}
                  onChange={(e) => {
                    const newDistance = parseInt(e.target.value);
                    setMaxDistance(newDistance);
                    setPage(1);
                    // Request location if distance filter is enabled
                    if (newDistance !== 999999 && !userLocation && !locationLoading) {
                      getUserLocation();
                    }
                  }}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  {DISTANCE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {typeof option.label === 'string'
                        ? option.label
                        : option.label[locale]}
                    </option>
                  ))}
                </select>
                {maxDistance !== 999999 && !userLocation && !locationLoading && (
                  <button
                    onClick={getUserLocation}
                    className="mt-2 w-full text-xs text-blue-600 hover:text-blue-800 py-1 border border-blue-300 rounded"
                  >
                    📍 {locale === 'ro' ? 'Activează locația' : 'Enable location'}
                  </button>
                )}
              </div>

              {/* Sort */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  {locale === 'ro' ? 'Sortează' : 'Sort By'}
                </h3>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  {maxDistance !== 999999 && userLocation && (
                    <option value="distance">
                      {locale === 'ro' ? 'Distanță (aproape)' : 'Distance (nearest)'}
                    </option>
                  )}
                  <option value="recent">
                    {locale === 'ro' ? 'Cele mai recente' : 'Most Recent'}
                  </option>
                  <option value="oldest">
                    {locale === 'ro' ? 'Cele mai vechi' : 'Oldest'}
                  </option>
                  <option value="title_asc">
                    {locale === 'ro' ? 'Nume A-Z' : 'Title A-Z'}
                  </option>
                  <option value="title_desc">
                    {locale === 'ro' ? 'Nume Z-A' : 'Title Z-A'}
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : results.length === 0 ? (
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
            ) : (
              <>
                {/* Results Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                  {results.map((object) => (
                    <div
                      key={object.id}
                      onClick={() => router.push(`/obiecte/${object.id}`)}
                      className="bg-white rounded-lg shadow hover:shadow-xl transition-shadow cursor-pointer overflow-hidden"
                    >
                      <div className="aspect-square bg-gray-200 relative">
                        {object.images && object.images.length > 0 ? (
                          <img
                            src={object.images[0]}
                            alt={object.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            📦
                          </div>
                        )}
                        <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                          {t(`categories.${object.category}`)}
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-1 truncate">
                          {object.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {object.description}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>📍 {object.location}</span>
                          {object.distance_km !== undefined ? (
                            <span className="text-blue-600 font-medium">
                              {object.distance_km} km
                            </span>
                          ) : (
                            <span>
                              {new Date(object.created_at).toLocaleDateString(
                                locale === 'ro' ? 'ro-RO' : 'en-US'
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center space-x-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      {locale === 'ro' ? 'Înapoi' : 'Previous'}
                    </button>
                    <span className="text-sm text-gray-600">
                      {locale === 'ro' 
                        ? `Pagina ${page} din ${totalPages}`
                        : `Page ${page} of ${totalPages}`}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      {locale === 'ro' ? 'Înainte' : 'Next'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
