import React from 'react';
import StarRating from '../ui/StarRating';
import { ReviewSummary } from '../../../utils/reviewApi';

interface RatingSummaryProps {
  summary: ReviewSummary;
  onRatingFilter?: (rating: number | null) => void;
  selectedRating?: number | null;
}

const RatingSummary: React.FC<RatingSummaryProps> = ({
  summary,
  onRatingFilter,
  selectedRating
}) => {
  const { average_rating, total_reviews, rating_distribution } = summary;

  const getRatingPercentage = (rating: number) => {
    if (!total_reviews || total_reviews === 0) return 0;
    const count = rating_distribution[rating] || 0;
    const percentage = (count / total_reviews) * 100;
    return isNaN(percentage) ? 0 : percentage;
  };

  const handleRatingClick = (rating: number) => {
    if (onRatingFilter) {
      const newRating = selectedRating === rating ? null : rating;
      onRatingFilter(newRating);
    }
  };

  return (
    <div className="bg-gradient-to-br from-yellow-50 to-orange-100/50 border border-yellow-200/60 rounded-3xl p-6 shadow-lg">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Customer Reviews</h3>
        <div className="flex items-center justify-center gap-3 mb-2">
          <span className="text-4xl font-bold text-yellow-600">{average_rating.toFixed(1)}</span>
          <div>
            <StarRating rating={average_rating} size="lg" />
            <p className="text-sm text-gray-600 mt-1">
              Based on {total_reviews} review{total_reviews !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Rating Distribution */}
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = rating_distribution[rating] || 0;
          const percentage = getRatingPercentage(rating);
          const isSelected = selectedRating === rating;

          return (
            <div
              key={rating}
              onClick={() => handleRatingClick(rating)}
              className={`flex items-center gap-3 p-2 rounded-xl transition-all cursor-pointer group relative ${isSelected
                ? 'bg-yellow-200/60 shadow-sm'
                : 'hover:bg-yellow-100/50'
                } ${onRatingFilter ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <div className="flex items-center gap-1 min-w-[40px]">
                <span className="text-sm font-medium text-gray-700">{rating}</span>
              </div>

              {/* Stars shown on hover only */}
              <div className="absolute left-10 top-1/2 -translate-y-1/2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 bg-white px-2 py-1 rounded-lg shadow-md z-10">
                <StarRating rating={rating} size="sm" />
              </div>

              <div className="flex-1 relative">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${isSelected
                      ? 'bg-yellow-500'
                      : 'bg-gradient-to-r from-yellow-400 to-yellow-500'
                      }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>

              <div className="min-w-[60px] text-right">
                <span className="text-sm text-gray-600">
                  {count} ({isNaN(percentage) ? '0' : percentage.toFixed(0)}%)
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {selectedRating && (
        <button
          onClick={() => onRatingFilter && onRatingFilter(null)}
          className="w-full mt-4 px-4 py-2 bg-yellow-200/60 hover:bg-yellow-300/60 text-yellow-800 rounded-xl text-sm font-medium transition-colors"
        >
          Clear Filter • Showing {selectedRating} star reviews
        </button>
      )}
    </div>
  );
};

export default RatingSummary;