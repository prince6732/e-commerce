import React, { useState, useEffect } from 'react';
import { ChevronDown, Plus, Filter, Shield } from 'lucide-react';
import StarRating from '../ui/StarRating';
import ReviewCard from './ReviewCard';
import ReviewForm from './ReviewForm';
// import RatingSummary from './RatingSummary';
import Modal from '../(sheared)/Modal';
import {
    Review,
    ReviewSummary,
    getProductReviews,
    createReview,
    updateReview,
    deleteReview,
    toggleReviewHelpful,
    getUserProductReview,
    CreateReviewData,
    UpdateReviewData
} from '../../../utils/reviewApi';
import { useAuth } from '@/context/AuthContext';

interface ProductReviewsProps {
    productId: number;
    onRatingUpdate?: () => void;
}

type SortOption = 'newest' | 'oldest' | 'highest' | 'lowest' | 'helpful';

const ProductReviews: React.FC<ProductReviewsProps> = ({ productId, onRatingUpdate }) => {
    const { user } = useAuth();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [summary, setSummary] = useState<ReviewSummary>({
        total_reviews: 0,
        average_rating: 0,
        rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    });
    const [userReview, setUserReview] = useState<Review | null>(null);

    // UI State
    const [loading, setLoading] = useState(false);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [editingReview, setEditingReview] = useState<Review | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [reviewToDelete, setReviewToDelete] = useState<Review | null>(null);

    // Filters and Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [sortBy, setSortBy] = useState<SortOption>('newest');
    const [ratingFilter, setRatingFilter] = useState<number | null>(null);

    const sortOptions: { value: SortOption; label: string }[] = [
        { value: 'newest', label: 'Newest First' },
        { value: 'oldest', label: 'Oldest First' },
        { value: 'highest', label: 'Highest Rating' },
        { value: 'lowest', label: 'Lowest Rating' },
        { value: 'helpful', label: 'Most Helpful' }
    ];

    // Fetch reviews
    const fetchReviews = async (page = 1, resetList = true) => {
        setLoading(true);
        try {
            const response = await getProductReviews(productId, {
                page,
                per_page: 8,
                sort_by: sortBy,
                ...(ratingFilter && { rating: ratingFilter })
            });

            if (resetList) {
                setReviews(response.reviews.data);
            } else {
                setReviews(prev => [...prev, ...response.reviews.data]);
            }

            setSummary(response.summary);
            setCurrentPage(response.reviews.current_page);
            setTotalPages(response.reviews.last_page);
            setHasMore(response.reviews.current_page < response.reviews.last_page);
        } catch (error) {
            console.error('Error fetching reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch user's review
    const fetchUserReview = async () => {
        if (!user) return;

        try {
            const response = await getUserProductReview(productId);
            setUserReview(response.review);
        } catch (error) {
            console.error('Error fetching user review:', error);
        }
    };

    // Effects
    useEffect(() => {
        fetchReviews(1, true);
    }, [productId, sortBy, ratingFilter]);

    useEffect(() => {
        fetchUserReview();
    }, [productId, user]);

    // Listen for openReviewModal event
    useEffect(() => {
        const handleOpenReviewModal = (e: Event) => {
            const customEvent = e as CustomEvent;
            console.log('Opening review modal for product:', customEvent.detail?.productId);
            setShowReviewForm(true);
            setEditingReview(null);
        };

        window.addEventListener('openReviewModal', handleOpenReviewModal);
        return () => {
            window.removeEventListener('openReviewModal', handleOpenReviewModal);
        };
    }, []);

    // Handlers
    const handleCreateReview = async (data: CreateReviewData) => {
        try {
            const response = await createReview(data);
            setUserReview(response.review || null);
            fetchReviews(1, true); // Refresh reviews
            // Trigger rating update
            onRatingUpdate?.();
        } catch (error) {
            console.error('Error creating review:', error);
            throw error;
        }
    };

    const handleUpdateReview = async (data: UpdateReviewData) => {
        if (!editingReview) return;

        try {
            const response = await updateReview(editingReview.id, data);
            setUserReview(response.review || null);
            setEditingReview(null);
            fetchReviews(1, true); // Refresh reviews
            // Trigger rating update
            onRatingUpdate?.();
        } catch (error) {
            console.error('Error updating review:', error);
            throw error;
        }
    };

    const handleFormSubmit = async (data: CreateReviewData | UpdateReviewData) => {
        if (editingReview) {
            await handleUpdateReview(data as UpdateReviewData);
        } else {
            await handleCreateReview(data as CreateReviewData);
        }
    };

    const handleDeleteReview = async (reviewId: number) => {
        const reviewToDelete = reviews.find(r => r.id === reviewId) || userReview;
        if (reviewToDelete) {
            setReviewToDelete(reviewToDelete);
            setShowDeleteModal(true);
        }
    };

    const confirmDeleteReview = async () => {
        if (!reviewToDelete) return;

        try {
            await deleteReview(reviewToDelete.id);
            setUserReview(null);
            fetchReviews(1, true); // Refresh reviews
            setShowDeleteModal(false);
            setReviewToDelete(null);
            // Trigger rating update
            onRatingUpdate?.();
        } catch (error) {
            console.error('Error deleting review:', error);
        }
    };

    const cancelDeleteReview = () => {
        setShowDeleteModal(false);
        setReviewToDelete(null);
    };

    const handleToggleHelpful = async (reviewId: number) => {
        return await toggleReviewHelpful(reviewId);
    };

    const handleLoadMore = () => {
        if (currentPage < totalPages) {
            fetchReviews(currentPage + 1, false);
        }
    };

    const handleEditReview = (review: Review) => {
        setEditingReview(review);
        setShowReviewForm(true);
    };

    const handleCancelForm = () => {
        setShowReviewForm(false);
        setEditingReview(null);
    };

    return (
        <>
            <div className="space-y-6">
                {/* Reviews Header */}
                <div className="flex items-center justify-between border-b pb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Customer Reviews & Ratings</h2>
                    {user && !userReview && (
                        <button
                            onClick={() => setShowReviewForm(true)}
                            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Write a Review
                        </button>
                    )}
                </div>

                {/* Reviews Section */}
                {summary.total_reviews > 0 && (
                    <>
                        {/* Filters and Sort */}
                        <div className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl">
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-medium text-gray-700">
                                    {summary.total_reviews} review{summary.total_reviews !== 1 ? 's' : ''}
                                    {ratingFilter && ` • ${ratingFilter} stars`}
                                </span>
                            </div>

                            <div className="flex items-center gap-3">
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                                    className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {sortOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Reviews List */}
                        <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
                            {reviews.map((review) => (
                                <ReviewCard
                                    key={review.id}
                                    review={review}
                                    currentUserId={user?.id}
                                    onEdit={review.user_id === user?.id ? handleEditReview : undefined}
                                    onDelete={review.user_id === user?.id ? handleDeleteReview : undefined}
                                    onToggleHelpful={review.user_id !== user?.id ? handleToggleHelpful : undefined}
                                />
                            ))}
                        </div>

                        {/* Load More Reviews Button */}
                        {hasMore && (
                            <div className="text-center">
                                <button
                                    onClick={handleLoadMore}
                                    disabled={loading}
                                    className="px-6 py-2.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                >
                                    {loading ? 'Loading...' : 'Load More Reviews'}
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* Empty State */}
                {summary.total_reviews === 0 && !loading && (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl">
                        <div className="mb-4 flex justify-center">
                            <StarRating rating={0} size="lg" />
                        </div>

                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No reviews yet</h3>
                        <p className="text-gray-600 mb-4">Be the first to review this product</p>

                        {user && (
                            <button
                                onClick={() => setShowReviewForm(true)}
                                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-colors"
                            >
                                Write the First Review
                            </button>
                        )}
                    </div>
                )}

                {/* Review Form Modal */}
                {showReviewForm && (
                    <Modal
                        isOpen={showReviewForm}
                        onClose={handleCancelForm}
                        title={editingReview ? "Edit Your Review" : "Write a Review"}
                    >
                        <ReviewForm
                            productId={productId}
                            initialData={editingReview ? {
                                rating: editingReview.rating,
                                title: editingReview.title || '',
                                review_text: editingReview.review_text || ''
                            } : undefined}
                            isEditing={!!editingReview}
                            onSubmit={handleFormSubmit}
                            onCancel={handleCancelForm}
                            loading={loading}
                        />
                    </Modal>
                )}

                {/* Delete Confirmation Modal */}
                <Modal
                    isOpen={showDeleteModal}
                    onClose={cancelDeleteReview}
                    title="Delete Review"
                    width="max-w-md"
                >
                    <div className="space-y-4">
                        <p className="text-gray-700">
                            Are you sure you want to delete this review? This action cannot be undone.
                        </p>

                        {reviewToDelete && (
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                    <StarRating rating={reviewToDelete.rating} size="sm" />
                                    <span className="text-sm text-gray-600">
                                        {reviewToDelete.rating} out of 5 stars
                                    </span>
                                </div>
                                {reviewToDelete.title && (
                                    <p className="font-medium text-sm text-gray-900">{reviewToDelete.title}</p>
                                )}
                                {reviewToDelete.review_text && (
                                    <p className="text-sm text-gray-700 mt-1 line-clamp-2">
                                        {reviewToDelete.review_text}
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                onClick={cancelDeleteReview}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeleteReview}
                                disabled={loading}
                                className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
                            >
                                {loading ? 'Deleting...' : 'Delete Review'}
                            </button>
                        </div>
                    </div>
                </Modal>
            </div>
        </>
    );
};

export default ProductReviews;