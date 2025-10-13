/**
 * AI Classification Infrastructure
 * OpenAI-ready with graceful degradation to keyword matching
 */

import { getBrowserSupabase } from '@/lib/supabase/client';

// ============================================================================
// TYPES
// ============================================================================

export interface ClassificationResult {
  category_id: string;
  predictions: Prediction[];
  method: 'openai' | 'clip' | 'keyword';
  confidence: number;
}

export interface Prediction {
  category_id: string;
  category_name: string;
  score: number;
  confidence: 'high' | 'medium' | 'low';
}

// ============================================================================
// KEYWORD MATCHING (FALLBACK)
// ============================================================================

// Keyword patterns per category (Romanian)
const KEYWORD_PATTERNS: Record<string, string[]> = {
  electronics: [
    'laptop', 'telefon', 'tableta', 'televizor', 'computer', 'pc',
    'monitor', 'casti', 'boxe', 'camera', 'foto', 'video', 'console',
    'playstation', 'xbox', 'nintendo', 'electronice', 'tech',
  ],
  home: [
    'canapea', 'masa', 'scaun', 'dulap', 'mobilier', 'pat', 'saltea',
    'fotoliu', 'etajera', 'biblioteca', 'bucatarie', 'aragaz', 'frigider',
    'masina de spalat', 'aspirator', 'curatenie', 'decor', 'decoratiuni',
  ],
  fashion: [
    'geaca', 'pantofi', 'haine', 'rochie', 'camasa', 'pantaloni',
    'blugi', 'jeans', 'tricou', 'pulover', 'geanta', 'poseta',
    'ceas', 'bijuterii', 'accesorii', 'incaltaminte', 'imbracaminte',
  ],
  sports: [
    'bicicleta', 'role', 'ski', 'snowboard', 'fotbal', 'tenis',
    'fitness', 'sala', 'greutati', 'antrenament', 'sport', 'echipament',
    'alergare', 'yoga', 'dans', 'arte martiale',
  ],
  vehicles: [
    'masina', 'auto', 'vehicul', 'scuter', 'motocicleta', 'atv',
    'barca', 'ambarcatiune', 'piese auto', 'accesorii auto', 'anvelope',
  ],
  books: [
    'carte', 'roman', 'literatura', 'poezie', 'manual', 'enciclopedie',
    'revista', 'benzi desenate', 'manga', 'comics', 'educatie',
  ],
  toys: [
    'jucarie', 'lego', 'papusa', 'peluche', 'puzzle', 'joc', 'societate',
    'board game', 'copii', 'bebelusi', 'carucior', 'scaun auto',
  ],
  tools: [
    'unelte', 'scule', 'bormasina', 'fierestrau', 'ciocan', 'surubelnita',
    'trusa', 'gradina', 'bricolaj', 'constructii', 'reparatii',
  ],
  services: [
    'serviciu', 'meditatie', 'curs', 'lectii', 'reparatii', 'curatenie',
    'transport', 'mutare', 'instalare', 'intretinere', 'menaj',
  ],
  housing: [
    'apartament', 'casa', 'garsoniera', 'studio', 'camera', 'spatiu',
    'teren', 'imobil', 'inchiriere', 'colocare', 'chirie',
  ],
};

/**
 * Classify from text using keyword matching
 */
export function classifyFromKeywords(
  title: string,
  description: string
): Prediction[] {
  const text = `${title} ${description}`.toLowerCase();
  const scores = new Map<string, number>();
  
  // Count keyword matches per category
  for (const [categoryId, keywords] of Object.entries(KEYWORD_PATTERNS)) {
    let score = 0;
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        score += matches.length;
      }
    });
    
    if (score > 0) {
      scores.set(categoryId, score);
    }
  }
  
  // Sort by score and return top 3
  const predictions = Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([categoryId, score]) => ({
      category_id: categoryId,
      category_name: categoryId, // Would be replaced by actual name from DB
      score: Math.min(score * 10, 100), // Normalize to 0-100
      confidence: score >= 5 ? 'high' : score >= 2 ? 'medium' : 'low',
    }));
  
  return predictions;
}

// ============================================================================
// OPENAI CLASSIFICATION (WHEN API KEY AVAILABLE)
// ============================================================================

/**
 * Classify from text using OpenAI
 */
export async function classifyFromTextOpenAI(
  title: string,
  description: string
): Promise<Prediction[]> {
  // Check if API key is available
  if (!process.env.OPENAI_API_KEY) {
    console.log('OpenAI API key not found, falling back to keyword matching');
    return classifyFromKeywords(title, description);
  }
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a product classifier. Classify the given item into one of these categories: ${Object.keys(KEYWORD_PATTERNS).join(', ')}. Return a JSON array of predictions with category_id, score (0-100), and confidence (high/medium/low).`,
          },
          {
            role: 'user',
            content: `Title: ${title}\nDescription: ${description}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 200,
      }),
    });
    
    if (!response.ok) throw new Error('OpenAI API error');
    
    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    
    return result.map((p: any) => ({
      ...p,
      category_name: p.category_id,
    }));
  } catch (error) {
    console.error('OpenAI classification failed, falling back to keywords:', error);
    return classifyFromKeywords(title, description);
  }
}

/**
 * Classify from image using OpenAI Vision
 */
export async function classifyFromImageOpenAI(imageUrl: string): Promise<Prediction[]> {
  // Check if API key is available
  if (!process.env.OPENAI_API_KEY) {
    console.log('OpenAI API key not found, cannot classify from image');
    return [];
  }
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a product classifier. Classify the given item into one of these categories: ${Object.keys(KEYWORD_PATTERNS).join(', ')}. Return a JSON array of predictions with category_id, score (0-100), and confidence (high/medium/low).`,
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'What category does this item belong to?' },
              { type: 'image_url', image_url: { url: imageUrl } },
            ],
          },
        ],
        max_tokens: 200,
      }),
    });
    
    if (!response.ok) throw new Error('OpenAI Vision API error');
    
    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    
    return result.map((p: any) => ({
      ...p,
      category_name: p.category_id,
    }));
  } catch (error) {
    console.error('OpenAI Vision classification failed:', error);
    return [];
  }
}

// ============================================================================
// EMBEDDINGS (FOR FUTURE SEMANTIC SEARCH)
// ============================================================================

/**
 * Generate embedding for text using OpenAI
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }
  
  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text,
      }),
    });
    
    if (!response.ok) throw new Error('OpenAI Embeddings API error');
    
    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('Failed to generate embedding:', error);
    return null;
  }
}

// ============================================================================
// MAIN API
// ============================================================================

/**
 * Classify object (tries OpenAI first, falls back to keywords)
 */
export async function classifyObject(
  title: string,
  description: string,
  imageUrl?: string
): Promise<ClassificationResult> {
  let predictions: Prediction[];
  let method: 'openai' | 'clip' | 'keyword';
  
  // Try image classification first if available
  if (imageUrl && process.env.OPENAI_API_KEY) {
    predictions = await classifyFromImageOpenAI(imageUrl);
    if (predictions.length > 0) {
      method = 'clip';
      return {
        category_id: predictions[0].category_id,
        predictions,
        method,
        confidence: predictions[0].score,
      };
    }
  }
  
  // Try text classification with OpenAI
  if (process.env.OPENAI_API_KEY) {
    predictions = await classifyFromTextOpenAI(title, description);
    method = 'openai';
  } else {
    // Fallback to keyword matching
    predictions = classifyFromKeywords(title, description);
    method = 'keyword';
  }
  
  return {
    category_id: predictions[0]?.category_id || 'other',
    predictions,
    method,
    confidence: predictions[0]?.score || 0,
  };
}

/**
 * Queue object for classification
 */
export async function queueForClassification(objectId: string, priority: number = 0) {
  const supabase = getBrowserSupabase();
  
  const { error } = await supabase
    .from('ai_classification_queue')
    .insert({
      object_id: objectId,
      priority,
      status: 'pending',
    });
  
  if (error) console.error('Failed to queue for classification:', error);
}

/**
 * Get classification from cache
 */
export async function getClassificationFromCache(objectId: string) {
  const supabase = getBrowserSupabase();
  
  const { data, error } = await supabase
    .from('classification_cache')
    .select('*')
    .eq('object_id', objectId)
    .single();
  
  if (error) return null;
  return data;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  classifyObject,
  classifyFromKeywords,
  classifyFromTextOpenAI,
  classifyFromImageOpenAI,
  generateEmbedding,
  queueForClassification,
  getClassificationFromCache,
};
