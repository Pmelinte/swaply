'use client';

import { useState } from 'react';
import { getBrowserSupabase } from '@/lib/supabase/client';
import { useI18n } from '@/lib/i18n';

interface RatingModalProps {
  swapId: string;
  revieweeId: string;
  revieweeName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function RatingModal({
  swapId,
  revieweeId,
  revieweeName,
  onClose,
  onSuccess,
}: RatingModalProps) {
  const { language } = useI18n();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = getBrowserSupabase();

  const handleSubmit = async () => {
    if (rating === 0) {
      setError(language === 'ro' ? 'Te rog selectează un rating' : 'Please select a rating');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check if can review
      const { data: canReview, error: checkError } = await supabase
        .rpc('can_review_swap', {
          p_swap_id: swapId,
          p_reviewer_id: user.id,
        });

      if (checkError) throw checkError;
      if (!canReview) {
        throw new Error(language === 'ro' 
          ? 'Nu poți lăsa review pentru acest schimb'
          : 'Cannot review this swap');
      }

      // Create review
      const { error: insertError } = await supabase
        .from('reviews')
        .insert([{
          swap_request_id: swapId,
          reviewer_id: user.id,
          reviewee_id: revieweeId,
          rating: rating,
          comment: comment.trim() || null,
        }]);

      if (insertError) throw insertError;

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error submitting review:', err);
      setError(err.message || (language === 'ro' 
        ? 'A apărut o eroare. Încearcă din nou.'
        : 'An error occurred. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const StarIcon = ({ filled }: { filled: boolean }) => (
    <svg
      className={`w-8 h-8 ${filled ? 'text-yellow-400' : 'text-gray-300'} transition-colors`}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
      />
    </svg>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {language === 'ro' ? 'Lasă un Review' : 'Leave a Review'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={submitting}
          >
            ✕
          </button>
        </div>

        {/* Reviewee Info */}
        <div className="mb-6 text-center">
          <p className="text-gray-600 mb-2">
            {language === 'ro' ? 'Cum a fost schimbul cu' : 'How was your swap with'}
          </p>
          <p className="text-lg font-semibold text-gray-900">{revieweeName}?</p>
        </div>

        {/* Star Rating */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
            {language === 'ro' ? 'Rating' : 'Rating'}
          </label>
          <div className="flex justify-center space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="focus:outline-none transition-transform hover:scale-110"
                disabled={submitting}
              >
                <StarIcon filled={star <= (hoveredRating || rating)} />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-center mt-2 text-sm text-gray-600">
              {rating === 1 && (language === 'ro' ? 'Foarte slab' : 'Very poor')}
              {rating === 2 && (language === 'ro' ? 'Slab' : 'Poor')}
              {rating === 3 && (language === 'ro' ? 'OK' : 'OK')}
              {rating === 4 && (language === 'ro' ? 'Bun' : 'Good')}
              {rating === 5 && (language === 'ro' ? 'Excelent!' : 'Excellent!')}
            </p>
          )}
        </div>

        {/* Comment */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {language === 'ro' ? 'Comentariu (opțional)' : 'Comment (optional)'}
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            maxLength={500}
            placeholder={language === 'ro' 
              ? 'Scrie câteva cuvinte despre experiența ta...'
              : 'Write a few words about your experience...'}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            disabled={submitting}
          />
          <p className="text-xs text-gray-500 mt-1 text-right">
            {comment.length}/500
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={submitting}
          >
            {language === 'ro' ? 'Anulează' : 'Cancel'}
          </button>
          <button
            onClick={handleSubmit}
            disabled={rating === 0 || submitting}
            className={`flex-1 px-4 py-3 rounded-lg font-medium text-white transition-colors ${
              rating === 0 || submitting
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {submitting 
              ? (language === 'ro' ? 'Se trimite...' : 'Submitting...')
              : (language === 'ro' ? 'Trimite Review' : 'Submit Review')}
          </button>
        </div>
      </div>
    </div>
  );
}
