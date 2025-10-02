// Swaply Matching Algorithm
// Intelligent matching system based on "what I have" vs "what I want"

export interface SwapObject {
  id: string;
  user_id: string;
  name: string;
  description: string;
  category: string;
  condition: string;
  estimated_value?: number;
  desired_items: string;
  location: string;
  exchange_preferences: {
    local: boolean;
    courier: boolean;
    travel: boolean;
  };
  images: string[];
  created_at: string;
}

export interface MatchScore {
  object_id: string;
  owner_id: string;
  score: number;
  reasons: string[];
  compatibility_details: {
    category_match: boolean;
    keyword_matches: string[];
    location_compatibility: boolean;
    value_compatibility: boolean;
    exchange_method_compatible: boolean;
  };
}

export interface MatchingOptions {
  max_distance_km?: number;
  min_score_threshold?: number;
  preferred_categories?: string[];
  max_results?: number;
  include_travel_swaps?: boolean;
}

/**
 * Main matching function - finds potential swap matches for a user's desired items
 */
export function findMatches(
  userObject: SwapObject,
  availableObjects: SwapObject[],
  options: MatchingOptions = {}
): MatchScore[] {
  const {
    max_distance_km = 50,
    min_score_threshold = 0.3,
    preferred_categories = [],
    max_results = 20,
    include_travel_swaps = true
  } = options;

  const matches: MatchScore[] = [];

  for (const targetObject of availableObjects) {
    // Skip own objects
    if (targetObject.user_id === userObject.user_id) continue;

    // Calculate match score
    const matchScore = calculateMatchScore(userObject, targetObject);
    
    // Apply filters
    if (matchScore.score < min_score_threshold) continue;
    
    // Check exchange method compatibility
    if (!isExchangeMethodCompatible(userObject, targetObject, include_travel_swaps)) continue;

    matches.push(matchScore);
  }

  // Sort by score (highest first) and return top results
  return matches
    .sort((a, b) => b.score - a.score)
    .slice(0, max_results);
}

/**
 * Calculate compatibility score between two objects
 */
function calculateMatchScore(userObject: SwapObject, targetObject: SwapObject): MatchScore {
  let score = 0;
  const reasons: string[] = [];
  const compatibility_details = {
    category_match: false,
    keyword_matches: [] as string[],
    location_compatibility: false,
    value_compatibility: false,
    exchange_method_compatible: false
  };

  // 1. KEYWORD MATCHING (40% of score)
  const keywordScore = calculateKeywordMatch(userObject.desired_items, targetObject);
  score += keywordScore.score * 0.4;
  compatibility_details.keyword_matches = keywordScore.matches;
  if (keywordScore.matches.length > 0) {
    reasons.push(`${keywordScore.matches.length} keyword matches found`);
  }

  // 2. CATEGORY COMPATIBILITY (25% of score)
  const categoryScore = calculateCategoryMatch(userObject.desired_items, targetObject.category);
  score += categoryScore * 0.25;
  if (categoryScore > 0.5) {
    compatibility_details.category_match = true;
    reasons.push('Category matches your interests');
  }

  // 3. REVERSE MATCH - Does target user want what you have? (20% of score)
  const reverseScore = calculateKeywordMatch(targetObject.desired_items, userObject);
  score += reverseScore.score * 0.2;
  if (reverseScore.score > 0.3) {
    reasons.push('They might want what you have too!');
  }

  // 4. VALUE COMPATIBILITY (10% of score)
  const valueScore = calculateValueCompatibility(userObject, targetObject);
  score += valueScore * 0.1;
  if (valueScore > 0.7) {
    compatibility_details.value_compatibility = true;
    reasons.push('Similar estimated values');
  }

  // 5. LOCATION PROXIMITY (5% of score)
  const locationScore = calculateLocationCompatibility(userObject.location, targetObject.location);
  score += locationScore * 0.05;
  if (locationScore > 0.8) {
    compatibility_details.location_compatibility = true;
    reasons.push('Close to your location');
  }

  // Bonus points for perfect matches
  if (compatibility_details.keyword_matches.length >= 3) {
    score += 0.1;
    reasons.push('Excellent keyword match');
  }

  return {
    object_id: targetObject.id,
    owner_id: targetObject.user_id,
    score: Math.min(score, 1.0), // Cap at 1.0
    reasons,
    compatibility_details
  };
}

/**
 * Calculate keyword matching between desired items and target object
 */
function calculateKeywordMatch(
  desiredItems: string, 
  targetObject: SwapObject
): { score: number; matches: string[] } {
  // Extract keywords from desired items
  const desiredKeywords = extractKeywords(desiredItems);
  
  // Extract keywords from target object
  const targetKeywords = extractKeywords(
    `${targetObject.name} ${targetObject.description} ${targetObject.category}`
  );

  const matches: string[] = [];
  let totalMatches = 0;

  for (const desiredKeyword of desiredKeywords) {
    for (const targetKeyword of targetKeywords) {
      const similarity = calculateStringSimilarity(desiredKeyword, targetKeyword);
      if (similarity > 0.8) {
        matches.push(targetKeyword);
        totalMatches += similarity;
        break; // Don't double-count the same target keyword
      }
    }
  }

  // Score based on percentage of desired keywords matched
  const score = desiredKeywords.length > 0 ? 
    Math.min(totalMatches / desiredKeywords.length, 1.0) : 0;

  return { score, matches: [...new Set(matches)] }; // Remove duplicates
}

/**
 * Calculate category compatibility
 */
function calculateCategoryMatch(desiredItems: string, targetCategory: string): number {
  const categoryKeywords = {
    'tech': ['laptop', 'computer', 'phone', 'tablet', 'macbook', 'iphone', 'samsung', 'gaming', 'pc'],
    'books': ['carte', 'book', 'roman', 'manual', 'enciclopedie', 'revista'],
    'jewelry': ['bijuterie', 'jewelry', 'ceas', 'watch', 'inel', 'ring', 'colier'],
    'tools': ['unelte', 'tools', 'drill', 'scule', 'hammer', 'saw'],
    'gaming': ['playstation', 'xbox', 'nintendo', 'console', 'gaming', 'jocuri'],
    'home': ['mobilier', 'furniture', 'decoratiuni', 'home', 'kitchen', 'garden'],
    'sports': ['sport', 'fitness', 'bicicleta', 'bike', 'equipment'],
    'music': ['instrument', 'chitara', 'piano', 'music', 'audio'],
    'art': ['art', 'painting', 'canvas', 'craft', 'creative'],
    'fashion': ['haine', 'clothes', 'fashion', 'shoes', 'clothing'],
    'kids': ['copii', 'kids', 'toys', 'jucarii', 'baby'],
    'other': []
  };

  const keywords = categoryKeywords[targetCategory as keyof typeof categoryKeywords] || [];
  const desiredLower = desiredItems.toLowerCase();

  let matches = 0;
  for (const keyword of keywords) {
    if (desiredLower.includes(keyword)) {
      matches++;
    }
  }

  return keywords.length > 0 ? matches / keywords.length : 0;
}

/**
 * Calculate value compatibility
 */
function calculateValueCompatibility(obj1: SwapObject, obj2: SwapObject): number {
  if (!obj1.estimated_value || !obj2.estimated_value) {
    return 0.5; // Neutral score if values are missing
  }

  const ratio = Math.min(obj1.estimated_value, obj2.estimated_value) / 
                Math.max(obj1.estimated_value, obj2.estimated_value);

  // Score is higher when values are closer
  return ratio;
}

/**
 * Calculate location compatibility (simplified - in reality would use geodistance)
 */
function calculateLocationCompatibility(loc1: string, loc2: string): number {
  const loc1Lower = loc1.toLowerCase();
  const loc2Lower = loc2.toLowerCase();

  // Same city/area
  if (loc1Lower === loc2Lower) return 1.0;
  
  // Same region/sector
  const commonWords = loc1Lower.split(' ').filter(word => 
    loc2Lower.includes(word) && word.length > 2
  );
  
  return commonWords.length > 0 ? 0.8 : 0.3;
}

/**
 * Check if exchange methods are compatible
 */
function isExchangeMethodCompatible(
  obj1: SwapObject, 
  obj2: SwapObject, 
  includeTravel: boolean
): boolean {
  const prefs1 = obj1.exchange_preferences;
  const prefs2 = obj2.exchange_preferences;

  // Local exchange - both must support it and be in compatible locations
  if (prefs1.local && prefs2.local) return true;
  
  // Courier exchange - both must support it
  if (prefs1.courier && prefs2.courier) return true;
  
  // Travel exchange - both must support it and include_travel must be true
  if (includeTravel && prefs1.travel && prefs2.travel) return true;

  return false;
}

/**
 * Extract meaningful keywords from text
 */
function extractKeywords(text: string): string[] {
  // Remove common words and extract meaningful terms
  const stopWords = new Set([
    'si', 'sau', 'in', 'cu', 'de', 'la', 'pe', 'pentru', 'din', 'ca', 'este', 'sunt',
    'and', 'or', 'in', 'with', 'from', 'to', 'for', 'is', 'are', 'the', 'a', 'an'
  ]);

  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Remove punctuation
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word))
    .slice(0, 10); // Limit to top 10 keywords
}

/**
 * Calculate similarity between two strings using simple algorithm
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1.0;
  
  // Check if one string contains the other
  if (str1.includes(str2) || str2.includes(str1)) return 0.9;
  
  // Levenshtein distance-based similarity (simplified)
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1.0;
  
  const distance = levenshteinDistance(str1, str2);
  return (maxLength - distance) / maxLength;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Get detailed match explanation for UI display
 */
export function getMatchExplanation(matchScore: MatchScore): string {
  const { score, reasons, compatibility_details } = matchScore;
  
  let explanation = `${Math.round(score * 100)}% compatibility\n\n`;
  
  if (reasons.length > 0) {
    explanation += "Why this is a good match:\n";
    reasons.forEach(reason => explanation += `• ${reason}\n`);
  }
  
  if (compatibility_details.keyword_matches.length > 0) {
    explanation += `\nMatching keywords: ${compatibility_details.keyword_matches.join(', ')}`;
  }
  
  return explanation.trim();
}