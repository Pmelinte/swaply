'use client';

import { useState, useEffect } from 'react';
import { getBrowserSupabase } from '@/lib/supabase/client';
import { useI18n } from '@/lib/i18n';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer: {
    id: string;
    email: string;
    user_profiles?: {
      display_name: string;
      avatar_url: string | null;
    };
  };
}

interface ReviewListProps {
  userId: string;
  limit?: number;
  showAll?: boolean;
}

export default function ReviewList({ userId, limit = 5, showAll = false }: ReviewListProps) {
  const { language } = useI18n();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [totalReviews, setTotalReviews] = useState(0);
  const supabase = getBrowserSupabase();

  useEffect(() => {
    loadReviews();
  }, [userId, limit]);

  const loadReviews = async () => {
    try {
      let query = supabase
        .from('reviews')
        .select(`
          *,
          reviewer:reviewer_id (
            id,
            email,
            user_profiles (
              display_name,
              avatar_url
            )
          )
        `, { count: 'exact' })
        .eq('reviewee_id', userId)
        .order('created_at', { ascending: false });

      if (!showAll) {
        query = query.limit(limit);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      setReviews(data || []);
      setTotalReviews(count || 0);

      // Calculate average
      if (data && data.length > 0) {
        const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
        setAverageRating(avg);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const StarDisplay = ({ rating }: { rating: number }) => (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-5 h-5 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header with Average Rating */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">
          {language === 'ro' ? 'Review-uri' : 'Reviews'} ({totalReviews})
        </h3>
        {averageRating !== null && (
          <div className="flex items-center space-x-2">
            <span className="text-3xl font-bold text-yellow-500">
              {averageRating.toFixed(1)}
            </span>
            <StarDisplay rating={Math.round(averageRating)} />
          </div>
        )}
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p className="text-4xl mb-2">⭐</p>
          <p>
            {language === 'ro' 
              ? 'Nu există review-uri încă'
              : 'No reviews yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => {
            const reviewerName = 
              review.reviewer?.user_profiles?.display_name || 
              review.reviewer?.email?.split('@')[0] || 
              'Unknown User';

            return (
              <div
                key={review.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {review.reviewer?.user_profiles?.avatar_url ? (
                        <img
                          src={review.reviewer.user_profiles.avatar_url}
                          alt={reviewerName}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        reviewerName.substring(0, 2).toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{reviewerName}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(review.created_at).toLocaleDateString(
                          language === 'ro' ? 'ro-RO' : 'en-US',
                          { year: 'numeric', month: 'long', day: 'numeric' }
                        )}
                      </p>
                    </div>
                  </div>
                  <StarDisplay rating={review.rating} />
                </div>

                {review.comment && (
                  <p className="text-gray-700 text-sm">{review.comment}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
