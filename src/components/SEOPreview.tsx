'use client';

import { useEffect, useState } from 'react';
import { Eye, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  generateSEOTitle,
  generateSEODescription,
  extractKeywords,
  suggestTitleImprovements,
  suggestDescriptionImprovements,
  cleanTitle,
  cleanDescription,
} from '@/lib/seo';

// ============================================================================
// TYPES
// ============================================================================

interface SEOPreviewProps {
  title: string;
  description: string;
  categoryName: string;
  location?: string;
  userName?: string;
  imageUrl?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function SEOPreview({
  title,
  description,
  categoryName,
  location,
  userName,
  imageUrl,
}: SEOPreviewProps) {
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([]);
  const [descriptionSuggestions, setDescriptionSuggestions] = useState<string[]>([]);

  // Update SEO preview when inputs change
  useEffect(() => {
    if (!title || !categoryName) return;

    const cleanedTitle = cleanTitle(title);
    const cleanedDescription = cleanDescription(description);

    setSeoTitle(generateSEOTitle(cleanedTitle, categoryName, location));
    setSeoDescription(
      generateSEODescription(
        cleanedTitle,
        cleanedDescription,
        categoryName,
        location,
        userName
      )
    );
    setKeywords(extractKeywords(cleanedTitle, cleanedDescription, categoryName));
    setTitleSuggestions(suggestTitleImprovements(title));
    setDescriptionSuggestions(suggestDescriptionImprovements(description));
  }, [title, description, categoryName, location, userName]);

  // Don't show if no title
  if (!title) return null;

  const hasIssues = titleSuggestions.length > 0 || descriptionSuggestions.length > 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Eye className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Preview SEO</h3>
      </div>

      {/* Google Search Result Preview */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="space-y-1">
          {/* Title */}
          <div className="text-xl font-medium text-blue-600 hover:underline cursor-pointer">
            {seoTitle}
          </div>

          {/* URL */}
          <div className="text-sm text-green-700">
            {process.env.NEXT_PUBLIC_SITE_URL || 'https://swaply.ro'} › obiecte › ...
          </div>

          {/* Description */}
          <div className="text-sm text-gray-600">
            {seoDescription}
          </div>
        </div>
      </div>

      {/* Social Media Preview (Facebook/LinkedIn) */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        {imageUrl && (
          <div className="aspect-[1.91/1] bg-gray-100 relative">
            <img
              src={imageUrl}
              alt="Social preview"
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="p-3 space-y-1 bg-gray-50">
          <div className="text-xs text-gray-500 uppercase">
            {new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://swaply.ro').hostname}
          </div>
          <div className="font-semibold text-gray-900 line-clamp-1">
            {seoTitle}
          </div>
          <div className="text-sm text-gray-600 line-clamp-2">
            {seoDescription}
          </div>
        </div>
      </div>

      {/* Keywords */}
      {keywords.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Cuvinte cheie detectate:
          </h4>
          <div className="flex flex-wrap gap-2">
            {keywords.map((keyword, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {hasIssues && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">
            Sugestii de îmbunătățire:
          </h4>

          {titleSuggestions.length > 0 && (
            <div className="space-y-2">
              {titleSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 text-sm text-orange-700 bg-orange-50 p-3 rounded-lg"
                >
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{suggestion}</span>
                </div>
              ))}
            </div>
          )}

          {descriptionSuggestions.length > 0 && (
            <div className="space-y-2">
              {descriptionSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-2 text-sm p-3 rounded-lg ${
                    suggestion.startsWith('⚠️')
                      ? 'text-red-700 bg-red-50'
                      : 'text-orange-700 bg-orange-50'
                  }`}
                >
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{suggestion}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* All good message */}
      {!hasIssues && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-lg">
          <CheckCircle2 className="h-4 w-4" />
          <span>Titlul și descrierea arată bine! 🎉</span>
        </div>
      )}
    </div>
  );
}
