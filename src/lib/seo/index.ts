/**
 * SEO Content Generation Library
 * Auto-generate titles, descriptions, JSON-LD, and Open Graph tags
 */

// ============================================================================
// TYPES
// ============================================================================

export interface SEOMetadata {
  title: string;
  description: string;
  keywords: string[];
  canonical?: string;
  image?: string;
  type?: 'website' | 'article' | 'product';
}

export interface JSONLDProduct {
  '@context': 'https://schema.org';
  '@type': 'Product';
  name: string;
  description: string;
  image: string[];
  offers: {
    '@type': 'Offer';
    price: string;
    priceCurrency: string;
    availability: string;
    url: string;
  };
  brand?: {
    '@type': 'Brand';
    name: string;
  };
  category?: string;
}

export interface JSONLDPlace {
  '@context': 'https://schema.org';
  '@type': 'Place';
  name: string;
  address: {
    '@type': 'PostalAddress';
    addressLocality: string;
    addressRegion: string;
    addressCountry: string;
  };
  geo?: {
    '@type': 'GeoCoordinates';
    latitude: number;
    longitude: number;
  };
}

// ============================================================================
// SEO TITLE GENERATION
// ============================================================================

/**
 * Generate SEO-optimized title for object
 */
export function generateSEOTitle(
  objectTitle: string,
  categoryName: string,
  location?: string
): string {
  // Clean title
  const cleanTitle = objectTitle.trim().slice(0, 50);
  
  // Template: "[Title] | [Category] | Swaply"
  let title = `${cleanTitle} | ${categoryName}`;
  
  if (location) {
    title += ` în ${location}`;
  }
  
  title += ' | Swaply';
  
  // Max 60 characters for SEO
  if (title.length > 60) {
    title = `${cleanTitle} | ${categoryName} | Swaply`;
  }
  
  return title;
}

/**
 * Generate SEO description
 */
export function generateSEODescription(
  objectTitle: string,
  objectDescription: string,
  categoryName: string,
  location?: string,
  userName?: string
): string {
  // Clean description
  const cleanDesc = objectDescription
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 120);
  
  // Template with action verbs
  let description = `Schimbă ${objectTitle} (${categoryName})`;
  
  if (location) {
    description += ` în ${location}`;
  }
  
  if (userName) {
    description += ` cu ${userName}`;
  }
  
  description += ` pe Swaply. ${cleanDesc}`;
  
  // Max 160 characters for SEO
  if (description.length > 160) {
    description = description.slice(0, 157) + '...';
  }
  
  return description;
}

/**
 * Extract keywords from text
 */
export function extractKeywords(
  title: string,
  description: string,
  categoryName: string
): string[] {
  const stopWords = new Set([
    'si', 'sau', 'cu', 'la', 'de', 'în', 'pe', 'pentru', 'din', 'ca',
    'este', 'sunt', 'am', 'ai', 'a', 'o', 'un', 'unei', 'unei'
  ]);
  
  // Combine all text
  const text = `${title} ${description} ${categoryName}`
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word));
  
  // Count frequency
  const freq = new Map<string, number>();
  text.forEach(word => {
    freq.set(word, (freq.get(word) || 0) + 1);
  });
  
  // Sort by frequency, take top 10
  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

// ============================================================================
// JSON-LD STRUCTURED DATA
// ============================================================================

/**
 * Generate Product JSON-LD
 */
export function generateProductJSONLD(
  object: {
    id: string;
    title: string;
    description: string;
    images: string[];
    category?: string;
    estimatedValue?: number;
    currency?: string;
    status?: string;
    userName?: string;
  }
): JSONLDProduct {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://swaply.ro';
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: object.title,
    description: object.description.slice(0, 200),
    image: object.images.slice(0, 5), // Max 5 images
    offers: {
      '@type': 'Offer',
      price: object.estimatedValue?.toString() || '0',
      priceCurrency: object.currency || 'RON',
      availability: object.status === 'available' 
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: `${baseUrl}/obiecte/${object.id}`,
    },
    ...(object.userName && {
      brand: {
        '@type': 'Brand',
        name: object.userName,
      },
    }),
    ...(object.category && {
      category: object.category,
    }),
  };
}

/**
 * Generate Place JSON-LD for location
 */
export function generatePlaceJSONLD(
  location: {
    city: string;
    region?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  }
): JSONLDPlace {
  return {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: location.city,
    address: {
      '@type': 'PostalAddress',
      addressLocality: location.city,
      addressRegion: location.region || '',
      addressCountry: location.country || 'RO',
    },
    ...(location.latitude && location.longitude && {
      geo: {
        '@type': 'GeoCoordinates',
        latitude: location.latitude,
        longitude: location.longitude,
      },
    }),
  };
}

/**
 * Generate Offer JSON-LD for swap
 */
export function generateOfferJSONLD(
  swap: {
    id: string;
    objectTitle: string;
    objectDescription: string;
    objectImages: string[];
    userName: string;
    userEmail?: string;
    validUntil?: string;
  }
) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://swaply.ro';
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Offer',
    name: `Schimb: ${swap.objectTitle}`,
    description: swap.objectDescription.slice(0, 200),
    image: swap.objectImages[0],
    url: `${baseUrl}/schimburi/${swap.id}`,
    offeredBy: {
      '@type': 'Person',
      name: swap.userName,
      ...(swap.userEmail && { email: swap.userEmail }),
    },
    ...(swap.validUntil && {
      validThrough: swap.validUntil,
    }),
  };
}

// ============================================================================
// OPEN GRAPH & TWITTER CARDS
// ============================================================================

/**
 * Generate Open Graph meta tags
 */
export function generateOpenGraphTags(metadata: SEOMetadata): Record<string, string> {
  return {
    'og:title': metadata.title,
    'og:description': metadata.description,
    'og:type': metadata.type || 'website',
    ...(metadata.image && { 'og:image': metadata.image }),
    ...(metadata.canonical && { 'og:url': metadata.canonical }),
    'og:site_name': 'Swaply',
    'og:locale': 'ro_RO',
  };
}

/**
 * Generate Twitter Card meta tags
 */
export function generateTwitterCardTags(metadata: SEOMetadata): Record<string, string> {
  return {
    'twitter:card': 'summary_large_image',
    'twitter:title': metadata.title,
    'twitter:description': metadata.description,
    ...(metadata.image && { 'twitter:image': metadata.image }),
    'twitter:site': '@swaply_ro',
  };
}

/**
 * Generate all meta tags
 */
export function generateAllMetaTags(metadata: SEOMetadata): Record<string, string> {
  return {
    title: metadata.title,
    description: metadata.description,
    keywords: metadata.keywords.join(', '),
    ...(metadata.canonical && { canonical: metadata.canonical }),
    ...generateOpenGraphTags(metadata),
    ...generateTwitterCardTags(metadata),
  };
}

// ============================================================================
// CONTENT CLEANUP HELPERS
// ============================================================================

/**
 * Clean object title for SEO
 */
export function cleanTitle(title: string): string {
  return title
    .trim()
    .replace(/\s+/g, ' ') // Multiple spaces to single
    .replace(/[^\w\s\-.,!?()]/g, '') // Remove special chars
    .slice(0, 100); // Max length
}

/**
 * Clean object description for SEO
 */
export function cleanDescription(description: string): string {
  return description
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\n{3,}/g, '\n\n') // Max 2 newlines
    .slice(0, 1000); // Max length
}

/**
 * Detect duplicate content
 */
export function isDuplicateContent(
  text1: string,
  text2: string,
  threshold: number = 0.8
): boolean {
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));
  
  // Calculate Jaccard similarity
  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);
  
  const similarity = intersection.size / union.size;
  return similarity >= threshold;
}

/**
 * Suggest title improvements
 */
export function suggestTitleImprovements(title: string): string[] {
  const suggestions: string[] = [];
  
  if (title.length < 10) {
    suggestions.push('Titlul este prea scurt. Adaugă mai multe detalii (ex: marcă, model, stare).');
  }
  
  if (title.length > 100) {
    suggestions.push('Titlul este prea lung. Păstrează doar informațiile esențiale.');
  }
  
  if (!/[a-zA-Z0-9]/.test(title)) {
    suggestions.push('Titlul trebuie să conțină litere sau cifre.');
  }
  
  if (title === title.toUpperCase() && title.length > 10) {
    suggestions.push('Evită scrierea întregului titlu cu majuscule.');
  }
  
  if (!/[A-ZĂÂÎȘȚ]/.test(title)) {
    suggestions.push('Începe titlul cu majusculă.');
  }
  
  return suggestions;
}

/**
 * Suggest description improvements
 */
export function suggestDescriptionImprovements(description: string): string[] {
  const suggestions: string[] = [];
  
  if (description.length < 50) {
    suggestions.push('Descrierea este prea scurtă. Adaugă mai multe detalii despre obiect.');
  }
  
  if (description.length > 2000) {
    suggestions.push('Descrierea este prea lungă. Concentrează-te pe informații esențiale.');
  }
  
  // Check for contact info (security risk)
  const phonePattern = /\b0\d{9}\b/g;
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  
  if (phonePattern.test(description)) {
    suggestions.push('⚠️ Nu include numărul de telefon în descriere. Folosește mesageria platformei.');
  }
  
  if (emailPattern.test(description)) {
    suggestions.push('⚠️ Nu include adresa de email în descriere. Comunicarea se face prin platformă.');
  }
  
  return suggestions;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Generation
  generateSEOTitle,
  generateSEODescription,
  extractKeywords,
  
  // JSON-LD
  generateProductJSONLD,
  generatePlaceJSONLD,
  generateOfferJSONLD,
  
  // Meta tags
  generateOpenGraphTags,
  generateTwitterCardTags,
  generateAllMetaTags,
  
  // Cleanup
  cleanTitle,
  cleanDescription,
  isDuplicateContent,
  suggestTitleImprovements,
  suggestDescriptionImprovements,
};
