// Tip pentru rezultatul clasificării HuggingFace
interface HuggingFaceClassificationResult {
  category: string;
  confidence: number;
  suggestedTitle?: string;
  description?: string;
}

// Interfață pentru analiză preț îmbunătățită
export interface EnhancedPriceEstimation {
  estimatedPrice: number;
  priceRange: {
    min: number;
    max: number;
  };
  confidence: number;
  factors: {
    category: string;
    condition: ConditionType;
    brand?: string;
    age?: number;
    marketDemand: 'low' | 'medium' | 'high';
    rarity: 'common' | 'uncommon' | 'rare';
  };
  marketAnalysis: {
    averagePrice: number;
    competitorCount: number;
    demandTrend: 'decreasing' | 'stable' | 'increasing';
  };
  depreciation: {
    originalPrice: number;
    depreciationRate: number;
    ageInMonths: number;
  };
  reasoning: string;
}

// Tipuri pentru starea obiectelor în română
export type ConditionType = 'nou' | 'excelent' | 'bun' | 'acceptabil' | 'pentru_piese';

// Date de piață pentru România
export const ROMANIAN_MARKET_DATA = {
  categories: {
    'electronice': {
      averagePrice: 850,
      depreciationRate: 0.25,
      demandMultiplier: 1.3,
      brandPremium: {
        'apple': 1.4,
        'samsung': 1.2,
        'google': 1.15,
        'xiaomi': 0.9,
        'huawei': 0.85
      }
    },
    'carti': {
      averagePrice: 45,
      depreciationRate: 0.1,
      demandMultiplier: 0.8,
      brandPremium: {
        'humanitas': 1.1,
        'polirom': 1.05,
        'art': 1.05
      }
    },
    'imbracaminte': {
      averagePrice: 120,
      depreciationRate: 0.4,
      demandMultiplier: 1.1,
      brandPremium: {
        'zara': 1.2,
        'h&m': 0.9,
        'adidas': 1.3,
        'nike': 1.35,
        'tommy hilfiger': 1.25
      }
    },
    'accesorii': {
      averagePrice: 85,
      depreciationRate: 0.3,
      demandMultiplier: 1.0,
      brandPremium: {
        'fossil': 1.2,
        'casio': 1.1,
        'seiko': 1.25
      }
    },
    'casa_gradina': {
      averagePrice: 200,
      depreciationRate: 0.2,
      demandMultiplier: 0.9,
      brandPremium: {
        'ikea': 0.9,
        'jysk': 0.85,
        'dedeman': 0.8
      }
    },
    'sport': {
      averagePrice: 150,
      depreciationRate: 0.35,
      demandMultiplier: 1.15,
      brandPremium: {
        'nike': 1.4,
        'adidas': 1.35,
        'decathlon': 0.8,
        'puma': 1.1
      }
    },
    'copii': {
      averagePrice: 75,
      depreciationRate: 0.5,
      demandMultiplier: 1.2,
      brandPremium: {
        'lego': 1.3,
        'fisher-price': 1.15,
        'chicco': 1.1
      }
    },
    'auto_moto': {
      averagePrice: 500,
      depreciationRate: 0.3,
      demandMultiplier: 1.1,
      brandPremium: {
        'bosch': 1.25,
        'continental': 1.2,
        'michelin': 1.3
      }
    },
    'altele': {
      averagePrice: 100,
      depreciationRate: 0.25,
      demandMultiplier: 0.9,
      brandPremium: {}
    }
  },
  
  conditionMultipliers: {
    'nou': 1.0,
    'excelent': 0.85,
    'bun': 0.65,
    'acceptabil': 0.45,
    'pentru_piese': 0.15
  },
  
  locationMultipliers: {
    'bucuresti': 1.15,
    'cluj-napoca': 1.1,
    'timisoara': 1.05,
    'iasi': 1.0,
    'constanta': 1.0,
    'brasov': 1.02,
    'galati': 0.95,
    'craiova': 0.95,
    'ploiesti': 0.98,
    'braila': 0.92,
    'oradea': 0.96,
    'bacau': 0.93,
    'pitesti': 0.96,
    'arad': 0.94,
    'sibiu': 1.0,
    'targu-mures': 0.94,
    'baia-mare': 0.92,
    'buzau': 0.9,
    'botosani': 0.88,
    'satu-mare': 0.9,
    'ramnicu-valcea': 0.88,
    'suceava': 0.9,
    'piatra-neamt': 0.9,
    'drobeta-turnu-severin': 0.85,
    'focsani': 0.88,
    'tulcea': 0.85,
    'targoviste': 0.92,
    'resita': 0.85,
    'alba-iulia': 0.9,
    'slatina': 0.85,
    'calarasi': 0.83,
    'giurgiu': 0.85,
    'alexandria': 0.8,
    'rosiorii-de-vede': 0.78,
    'slobozia': 0.82,
    'vaslui': 0.85,
    'roman': 0.88,
    'onesti': 0.86,
    'campina': 0.9,
    'targu-jiu': 0.85,
    'miercurea-ciuc': 0.85,
    'sfantu-gheorghe': 0.88,
    'bistrita': 0.88,
    'deva': 0.86,
    'hunedoara': 0.84,
    'lugoj': 0.86,
    'caransebes': 0.82,
    'medgidia': 0.88,
    'mangalia': 0.9,
    'navodari': 0.92
  }
} as const;

// Funcție pentru detectarea brandului din text
export function detectBrand(title: string, description: string): string | undefined {
  const text = `${title} ${description}`.toLowerCase();
  
  const brands = [
    'apple', 'samsung', 'google', 'xiaomi', 'huawei', 'oneplus', 'sony',
    'nike', 'adidas', 'puma', 'new balance', 'converse', 'vans',
    'zara', 'h&m', 'tommy hilfiger', 'calvin klein', 'ralph lauren',
    'lego', 'fisher-price', 'chicco', 'pampers', 'huggies',
    'bosch', 'siemens', 'whirlpool', 'electrolux', 'arctic',
    'ikea', 'jysk', 'dedeman', 'leroy merlin', 'bricostore',
    'fossil', 'casio', 'seiko', 'citizen', 'tissot',
    'humanitas', 'polirom', 'art', 'nemira', 'rao',
    'michelin', 'continental', 'bridgestone', 'goodyear',
    'decathlon', 'intersport', 'hervis'
  ];
  
  for (const brand of brands) {
    if (text.includes(brand)) {
      return brand;
    }
  }
  
  return undefined;
}

// Funcție pentru calcularea vârstei obiectului
export function estimateAge(description: string): number {
  const ageKeywords = {
    'nou': 0,
    'recent': 3,
    'putin folosit': 6,
    'folosit': 12,
    'vechi': 24,
    'foarte vechi': 48
  };
  
  const text = description.toLowerCase();
  
  for (const [keyword, months] of Object.entries(ageKeywords)) {
    if (text.includes(keyword)) {
      return months;
    }
  }
  
  // Încearcă să detecteze anul
  const yearMatch = text.match(/20(\d{2})/);
  if (yearMatch) {
    const year = 2000 + parseInt(yearMatch[1]);
    const currentYear = new Date().getFullYear();
    return Math.max(0, (currentYear - year) * 12);
  }
  
  return 12; // Default: 1 an
}

// Funcție pentru analiza cererii de pe piață
export function analyzeMarketDemand(category: string): 'low' | 'medium' | 'high' {
  const demandMap: Record<string, 'low' | 'medium' | 'high'> = {
    'electronice': 'high',
    'sport': 'high',
    'copii': 'high',
    'imbracaminte': 'medium',
    'accesorii': 'medium',
    'auto_moto': 'medium',
    'carti': 'low',
    'casa_gradina': 'low',
    'altele': 'low'
  };
  
  return demandMap[category] || 'medium';
}

// Funcție pentru determinarea rarității
export function assessRarity(brand: string | undefined, category: string): 'common' | 'uncommon' | 'rare' {
  if (!brand) return 'common';
  
  const rareBrands = ['apple', 'nike', 'adidas', 'lego', 'bosch', 'tissot'];
  const uncommonBrands = ['samsung', 'google', 'puma', 'fossil', 'casio'];
  
  if (rareBrands.includes(brand.toLowerCase())) return 'rare';
  if (uncommonBrands.includes(brand.toLowerCase())) return 'uncommon';
  
  return 'common';
}

// Funcția principală pentru estimarea prețului
export async function estimatePrice(
  title: string,
  description: string,
  category: string,
  condition: ConditionType,
  location?: string,
  classificationResult?: HuggingFaceClassificationResult
): Promise<EnhancedPriceEstimation> {
  
  // Obține datele categoriei
  const categoryData = ROMANIAN_MARKET_DATA.categories[category as keyof typeof ROMANIAN_MARKET_DATA.categories] 
    || ROMANIAN_MARKET_DATA.categories.altele;
  
  // Detectează brandul
  const detectedBrand = detectBrand(title, description);
  
  // Estimează vârsta
  const ageInMonths = estimateAge(description);
  
  // Analizează cererea de pe piață
  const marketDemand = analyzeMarketDemand(category);
  
  // Evaluează raritatea
  const rarity = assessRarity(detectedBrand, category);
  
  // Calculează prețul de bază
  let basePrice = categoryData.averagePrice;
  
  // Aplică multiplicatorul pentru brand
  if (detectedBrand && detectedBrand in categoryData.brandPremium) {
    basePrice *= categoryData.brandPremium[detectedBrand as keyof typeof categoryData.brandPremium];
  }
  
  // Aplică multiplicatorul pentru stare
  const conditionMultiplier = ROMANIAN_MARKET_DATA.conditionMultipliers[condition];
  basePrice *= conditionMultiplier;
  
  // Aplică deprecierea
  const depreciationFactor = 1 - (categoryData.depreciationRate * ageInMonths / 12);
  const originalPrice = basePrice / Math.max(0.1, depreciationFactor);
  basePrice *= Math.max(0.1, depreciationFactor);
  
  // Aplică multiplicatorul pentru locație
  if (location) {
    const locationKey = location.toLowerCase().replace(/\s+/g, '-');
    const locationMultiplier = ROMANIAN_MARKET_DATA.locationMultipliers[locationKey as keyof typeof ROMANIAN_MARKET_DATA.locationMultipliers] || 1.0;
    basePrice *= locationMultiplier;
  }
  
  // Ajustări pentru cererea de pe piață
  const demandMultipliers = { low: 0.85, medium: 1.0, high: 1.15 };
  basePrice *= demandMultipliers[marketDemand];
  
  // Ajustări pentru raritate
  const rarityMultipliers = { common: 1.0, uncommon: 1.1, rare: 1.25 };
  basePrice *= rarityMultipliers[rarity];
  
  // Calculează intervalul de preț
  const variance = 0.25; // ±25%
  const minPrice = Math.max(10, basePrice * (1 - variance));
  const maxPrice = basePrice * (1 + variance);
  
  // Calculează încrederea
  let confidence = 0.7; // Bază
  if (detectedBrand) confidence += 0.1;
  if (classificationResult) confidence += 0.1;
  if (ageInMonths <= 6) confidence += 0.1;
  
  confidence = Math.min(1.0, confidence);
  
  // Generează explicația
  const reasoning = generateReasoning(
    category,
    condition,
    detectedBrand,
    ageInMonths,
    marketDemand,
    rarity,
    basePrice
  );
  
  return {
    estimatedPrice: Math.round(basePrice),
    priceRange: {
      min: Math.round(minPrice),
      max: Math.round(maxPrice)
    },
    confidence,
    factors: {
      category,
      condition,
      brand: detectedBrand,
      age: ageInMonths,
      marketDemand,
      rarity
    },
    marketAnalysis: {
      averagePrice: categoryData.averagePrice,
      competitorCount: getCompetitorCount(category),
      demandTrend: getDemandTrend(category)
    },
    depreciation: {
      originalPrice: Math.round(originalPrice),
      depreciationRate: categoryData.depreciationRate,
      ageInMonths
    },
    reasoning
  };
}

// Funcții auxiliare
function getCompetitorCount(category: string): number {
  const competitorCounts: Record<string, number> = {
    'electronice': 450,
    'imbracaminte': 380,
    'sport': 220,
    'copii': 180,
    'accesorii': 160,
    'auto_moto': 140,
    'casa_gradina': 120,
    'carti': 90,
    'altele': 100
  };
  
  return competitorCounts[category] || 100;
}

function getDemandTrend(category: string): 'decreasing' | 'stable' | 'increasing' {
  const trends: Record<string, 'decreasing' | 'stable' | 'increasing'> = {
    'electronice': 'increasing',
    'sport': 'increasing',
    'copii': 'stable',
    'imbracaminte': 'stable',
    'accesorii': 'stable',
    'auto_moto': 'stable',
    'casa_gradina': 'decreasing',
    'carti': 'decreasing',
    'altele': 'stable'
  };
  
  return trends[category] || 'stable';
}

function generateReasoning(
  category: string,
  condition: ConditionType,
  brand: string | undefined,
  ageInMonths: number,
  marketDemand: 'low' | 'medium' | 'high',
  rarity: 'common' | 'uncommon' | 'rare',
  estimatedPrice: number
): string {
  const reasons = [];
  
  reasons.push(`Categoria "${category}" are o cerere ${marketDemand === 'high' ? 'mare' : marketDemand === 'medium' ? 'medie' : 'mică'} pe piață.`);
  
  if (brand) {
    reasons.push(`Brandul "${brand}" adaugă valoare produsului.`);
  }
  
  const conditionDescriptions = {
    'nou': 'starea nouă menține valoarea maximă',
    'excelent': 'starea excelentă păstrează majoritatea valorii',
    'bun': 'starea bună reduce moderat valoarea',
    'acceptabil': 'starea acceptabilă reduce semnificativ valoarea',
    'pentru_piese': 'starea pentru piese reduce dramatic valoarea'
  };
  
  reasons.push(conditionDescriptions[condition]);
  
  if (ageInMonths > 0) {
    const years = Math.floor(ageInMonths / 12);
    const months = ageInMonths % 12;
    let ageText = '';
    if (years > 0) ageText += `${years} ${years === 1 ? 'an' : 'ani'}`;
    if (months > 0) {
      if (ageText) ageText += ' și ';
      ageText += `${months} ${months === 1 ? 'lună' : 'luni'}`;
    }
    reasons.push(`Vârsta estimată de ${ageText} afectează prețul prin depreciere.`);
  }
  
  if (rarity !== 'common') {
    reasons.push(`Produsul este considerat ${rarity === 'rare' ? 'rar' : 'neobișnuit'}, ceea ce poate crește valoarea.`);
  }
  
  return reasons.join(' ');
}