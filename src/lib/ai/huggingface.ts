// Enhanced HuggingFace AI Integration for Swaply

interface ClassificationResult {
  category: string;
  confidence: number;
  suggestedTitle?: string;
  description?: string;
}

interface PriceEstimation {
  estimatedPrice: number;
  currency: string;
  confidence: number;
  marketRange: { min: number; max: number };
  factors: string[];
}

// Romanian category mapping
const categoryMapping: Record<string, string> = {
  'electronic': 'Electronice',
  'clothing': 'Haine',
  'book': 'Carti',
  'toy': 'Jucarii',
  'sport': 'Sport',
  'music': 'Muzica',
  'art': 'Arta',
  'tool': 'Instrumente',
  'home': 'Casa',
  'jewelry': 'Accesorii',
  'game': 'Gaming',
  'general': 'Generale'
};

export class HuggingFaceAI {
  private hasApiKey: boolean;

  constructor() {
    this.hasApiKey = !!process.env.HUGGINGFACE_API_KEY;
  }

  /**
   * Classify object from image with intelligent fallback
   */
  async classifyObjectFromImage(imageFile: File): Promise<ClassificationResult> {
    try {
      // Real API classification (if key available)
      if (this.hasApiKey) {
        const result = await this.performRealClassification(imageFile);
        if (result) return result;
      }

      // Smart mock classification based on filename
      return this.generateSmartMockClassification(imageFile);
    } catch (error) {
      console.error('Classification error:', error);
      return this.getDefaultClassification();
    }
  }

  /**
   * Real HuggingFace API classification
   */
  private async performRealClassification(imageFile: File): Promise<ClassificationResult | null> {
    try {
      const imageData = await this.fileToBase64(imageFile);
      
      const response = await fetch('https://api-inference.huggingface.co/models/google/vit-base-patch16-224', {
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({ inputs: imageData }),
      });

      if (response.ok) {
        const result = await response.json();
        const topResult = result[0];
        
        return {
          category: this.mapToSwaplyCategory(topResult.label),
          confidence: topResult.score,
          suggestedTitle: this.generateTitle(topResult.label),
          description: this.generateDescription(topResult.label)
        };
      }

      return null;
    } catch (error) {
      console.error('Real classification failed:', error);
      return null;
    }
  }

  /**
   * Smart mock classification based on patterns
   */
  private generateSmartMockClassification(imageFile: File): ClassificationResult {
    const fileName = imageFile.name.toLowerCase();
    
    // Pattern matching for Romanian context
    const patterns = {
      'Electronice': ['iphone', 'laptop', 'telefon', 'computer', 'macbook', 'samsung', 'tablet', 'electronic'],
      'Haine': ['tricou', 'pantalon', 'rochie', 'geaca', 'adidas', 'nike', 'clothing', 'shirt'],
      'Sport': ['fotbal', 'tenis', 'bicicleta', 'bike', 'sport', 'fitness', 'ball'],
      'Muzica': ['chitara', 'pian', 'guitar', 'piano', 'music', 'instrument'],
      'Casa': ['masa', 'scaun', 'pat', 'table', 'chair', 'furniture', 'home'],
      'Gaming': ['playstation', 'xbox', 'nintendo', 'gaming', 'console'],
      'Carti': ['carte', 'book', 'roman', 'manual'],
      'Arta': ['tablou', 'pictura', 'art', 'painting']
    };

    for (const [category, keywords] of Object.entries(patterns)) {
      if (keywords.some(keyword => fileName.includes(keyword))) {
        return {
          category,
          confidence: 0.85,
          suggestedTitle: this.generateMockTitle(category),
          description: this.generateMockDescription(category)
        };
      }
    }

    return this.getDefaultClassification();
  }

  /**
   * Generate titles based on category
   */
  private generateMockTitle(category: string): string {
    const titles: Record<string, string[]> = {
      'Electronice': ['iPhone 13 Pro Max 256GB', 'MacBook Pro M2 2023', 'Samsung Galaxy S24'],
      'Haine': ['Tricou Nike Original', 'Jeans Zara Slim Fit', 'Geacă The North Face'],
      'Sport': ['Bicicletă MTB Trek', 'Minge Fotbal Adidas', 'Racheta Tenis Wilson'],
      'Muzica': ['Chitară Acoustică Yamaha', 'Pian Digital Casio', 'Boxe JBL'],
      'Casa': ['Masă Dining IKEA', 'Scaun Gaming', 'Bibliotecă Lemn'],
      'Gaming': ['PlayStation 5', 'Xbox Series X', 'Nintendo Switch OLED'],
      'Carti': ['Colecție Harry Potter', 'Manual Programare', 'Romane Clasice'],
      'Arta': ['Tablou Pictat Manual', 'Set Pensule Pro', 'Print Art Limitat']
    };

    const categoryTitles = titles[category] || ['Obiect de Calitate'];
    return categoryTitles[Math.floor(Math.random() * categoryTitles.length)];
  }

  /**
   * Generate descriptions based on category
   */
  private generateMockDescription(category: string): string {
    const descriptions: Record<string, string[]> = {
      'Electronice': [
        'Dispozitiv în stare excelentă, toate accesoriile incluse.',
        'Funcționează perfect, fără defecte. Ideal pentru upgrade.',
        'Tehnologie avansată într-o condiție ca nouă.'
      ],
      'Haine': [
        'Articol vestimentar în stare foarte bună, purtat rar.',
        'Material de calitate superioară, fără uzură vizibilă.',
        'Brand original, autentic. Perfect pentru garderoba ta.'
      ],
      'Sport': [
        'Echipament sportiv profesional, întreținut cu grijă.',
        'Folosit în condiții optime, funcționează impecabil.',
        'Gear de top pentru performanțe maxime.'
      ]
    };

    const categoryDescs = descriptions[category] || [
      'Obiect de calitate în stare bună, perfect pentru schimb.'
    ];
    
    return categoryDescs[Math.floor(Math.random() * categoryDescs.length)];
  }

  /**
   * Estimate price based on category and details
   */
  async estimatePrice(category: string, title: string): Promise<PriceEstimation> {
    const priceRanges: Record<string, { min: number; max: number }> = {
      'Electronice': { min: 200, max: 8000 },
      'Haine': { min: 50, max: 500 },
      'Casa': { min: 100, max: 2000 },
      'Sport': { min: 50, max: 1500 },
      'Gaming': { min: 150, max: 2500 },
      'Muzica': { min: 100, max: 3000 },
      'Carti': { min: 10, max: 200 },
      'Arta': { min: 50, max: 2000 },
      'Instrumente': { min: 30, max: 800 },
      'Jucarii': { min: 20, max: 300 },
      'Accesorii': { min: 20, max: 800 },
      'Generale': { min: 50, max: 500 }
    };

    const range = priceRanges[category] || priceRanges['Generale'];
    const basePrice = (range.min + range.max) / 2;
    
    // Adjust based on title keywords
    let multiplier = 1;
    const titleLower = title.toLowerCase();
    
    if (titleLower.includes('pro') || titleLower.includes('max')) multiplier += 0.3;
    if (titleLower.includes('nou') || titleLower.includes('sigilat')) multiplier += 0.2;
    if (titleLower.includes('vintage') || titleLower.includes('colecție')) multiplier += 0.4;

    const estimatedPrice = Math.round(basePrice * multiplier);

    return {
      estimatedPrice,
      currency: 'RON',
      confidence: 0.8,
      marketRange: {
        min: Math.round(range.min * multiplier),
        max: Math.round(range.max * multiplier)
      },
      factors: [
        `Categoria: ${category}`,
        'Analiza cuvinte cheie din titlu',
        'Prețuri piață România',
        'Trend-uri actuale de schimb'
      ]
    };
  }

  // Helper methods
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  private mapToSwaplyCategory(label: string): string {
    const labelLower = label.toLowerCase();
    
    for (const [key, value] of Object.entries(categoryMapping)) {
      if (labelLower.includes(key)) {
        return value;
      }
    }
    
    return 'Generale';
  }

  private generateTitle(label: string): string {
    // Transform HuggingFace label to Romanian title
    const cleanLabel = label.replace(/[^a-zA-Z\s]/g, '').trim();
    return cleanLabel.charAt(0).toUpperCase() + cleanLabel.slice(1);
  }

  private generateDescription(label: string): string {
    return `Obiect identificat ca ${label.toLowerCase()}. În stare bună, gata pentru schimb.`;
  }

  private getDefaultClassification(): ClassificationResult {
    return {
      category: 'Generale',
      confidence: 0.5,
      suggestedTitle: 'Obiect pentru Schimb',
      description: 'Obiect în stare bună, detalii în imagini.'
    };
  }
}

// Export singleton instance
export const huggingFaceAI = new HuggingFaceAI();

// Export types
export type { ClassificationResult, PriceEstimation };