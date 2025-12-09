import React, { useState } from 'react';
import { ThumbsUp, Edit, Trash2, MoreVertical, CheckCircle, Shield } from 'lucide-react';
import StarRating from '../ui/StarRating';
import UserAvatar from '../ui/UserAvatar';
import { Review } from '../../../utils/reviewApi';

interface ReviewCardProps {
  review: Review;
  currentUserId?: number;
  onEdit?: (review: Review) => void;
  onDelete?: (reviewId: number) => void;
  onToggleHelpful?: (reviewId: number) => Promise<{ helpful_count: number; is_helpful: boolean }>;
}

const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  currentUserId,
  onEdit,
  onDelete,
  onToggleHelpful
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isHelpful, setIsHelpful] = useState(false);
  const [helpfulCount, setHelpfulCount] = useState(review.helpful_count);
  const [helpfulLoading, setHelpfulLoading] = useState(false);

  const isOwnReview = currentUserId === review.user_id;

  const handleToggleHelpful = async () => {
    if (!onToggleHelpful || isOwnReview) return;

    setHelpfulLoading(true);
    try {
      const result = await onToggleHelpful(review.id);
      setIsHelpful(result.is_helpful);
      setHelpfulCount(result.helpful_count);
    } catch (error) {
      console.error('Error toggling helpful:', error);
    } finally {
      setHelpfulLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white py-5 px-4 hover:bg-gray-50 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          <UserAvatar 
            name={review.user_name}
            profilePicture={review.user?.profile_picture}
            size="sm"
          />
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-gray-900 text-sm">{review.user_name}</h4>
              {review.is_verified && (
                <span className="flex items-center gap-1 text-green-600 text-xs">
                  <CheckCircle className="w-3 h-3" />
                  Verified
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1 bg-green-600 text-white text-xs font-semibold px-1.5 py-0.5 rounded">
                <span>{review.rating}</span>
                <span>★</span>
              </div>
              <span className="text-xs text-gray-500">• {formatDate(review.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Actions Menu */}
        {isOwnReview && (onEdit || onDelete) && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-gray-400" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                {onEdit && (
                  <button
                    onClick={() => {
                      onEdit(review);
                      setShowMenu(false);
                    }}
                    className="flex items-center gap-1.5 w-full px-3 py-1.5 text-left hover:bg-gray-50 transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5 text-gray-600" />
                    <span className="text-xs">Edit</span>
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => {
                      onDelete(review.id);
                      setShowMenu(false);
                    }}
                    className="flex items-center gap-1.5 w-full px-3 py-1.5 text-left hover:bg-red-50 transition-colors text-red-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="text-xs">Delete</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Review Title */}
      {review.title && (
        <h5 className="font-medium text-gray-900 mb-2 text-sm">{review.title}</h5>
      )}

      {/* Review Text */}
      {review.review_text && (
        <p className="text-gray-700 text-sm leading-relaxed mb-3">{review.review_text}</p>
      )}

      {/* Footer Actions */}
      <div className="flex items-center gap-3 pt-3">
        {/* Helpful Button */}
        {!isOwnReview && onToggleHelpful && (
          <button
            onClick={handleToggleHelpful}
            disabled={helpfulLoading}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-all ${isHelpful
                ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                : 'text-gray-600 hover:bg-gray-100'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {helpfulLoading ? (
              <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <ThumbsUp className={`w-3.5 h-3.5 ${isHelpful ? 'fill-current' : ''}`} />
            )}
            <span>Helpful {helpfulCount > 0 && `(${helpfulCount})`}</span>
          </button>
        )}

        {isOwnReview && (
          <div className="flex items-center gap-1 text-gray-600 text-xs">
            <Shield className="w-3.5 h-3.5" />
            Your Review
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewCard;