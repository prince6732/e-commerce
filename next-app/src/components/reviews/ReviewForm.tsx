import React, { useState } from 'react';
import { Star, X, Send } from 'lucide-react';
import StarRating from '../ui/StarRating';
import { CreateReviewData, UpdateReviewData } from '../../../utils/reviewApi';

interface ReviewFormProps {
    productId: number;
    initialData?: {
        rating: number;
        title: string;
        review_text: string;
    };
    isEditing?: boolean;
    onSubmit: (data: CreateReviewData | UpdateReviewData) => Promise<void>;
    onCancel: () => void;
    loading?: boolean;
}

const ReviewForm: React.FC<ReviewFormProps> = ({
    productId,
    initialData,
    isEditing = false,
    onSubmit,
    onCancel,
    loading = false
}) => {
    const [formData, setFormData] = useState({
        rating: initialData?.rating || 0,
        title: initialData?.title || '',
        review_text: initialData?.review_text || ''
    });
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

        if (formData.rating === 0) {
            newErrors.rating = 'Please select a rating';
        }

        if (formData.title.trim().length < 3) {
            newErrors.title = 'Title must be at least 3 characters';
        }

        if (formData.review_text.trim().length < 10) {
            newErrors.review_text = 'Review must be at least 10 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            const submitData = isEditing
                ? { ...formData }
                : { ...formData, product_id: productId };

            await onSubmit(submitData);
            // Close the form after successful submission
            onCancel();
        } catch (error) {
            console.error('Error submitting review:', error);
        }
    };

    const handleRatingChange = (rating: number) => {
        setFormData(prev => ({ ...prev, rating }));
        if (errors.rating) {
            setErrors(prev => ({ ...prev, rating: '' }));
        }
    };

    return (
        <div className="bg-white rounded-lg p-5">
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Rating Section */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rating <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                        <StarRating
                            rating={formData.rating}
                            interactive={true}
                            onRatingChange={handleRatingChange}
                            size="md"
                        />
                        <span className="text-xs text-gray-600">
                            {formData.rating > 0 && `${formData.rating} star${formData.rating !== 1 ? 's' : ''}`}
                        </span>
                    </div>
                    {errors.rating && (
                        <p className="mt-1 text-xs text-red-600">{errors.rating}</p>
                    )}
                </div>

                {/* Title Section */}
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1.5">
                        Review Title <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="title"
                        value={formData.title}
                        onChange={(e) => {
                            setFormData(prev => ({ ...prev, title: e.target.value }));
                            if (errors.title) setErrors(prev => ({ ...prev, title: '' }));
                        }}
                        placeholder="Sum up your review"
                        className={`w-full px-3 text-black py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.title ? 'border-red-300' : 'border-gray-300'
                            }`}
                        maxLength={100}
                    />
                    <div className="flex justify-between mt-1">
                        {errors.title ? (
                            <p className="text-xs text-red-600">{errors.title}</p>
                        ) : (
                            <div></div>
                        )}
                        <span className="text-xs text-gray-400">
                            {formData.title.length}/100
                        </span>
                    </div>
                </div>

                {/* Review Text Section */}
                <div>
                    <label htmlFor="review_text" className="block text-sm font-medium text-gray-700 mb-1.5">
                        Your Review <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        id="review_text"
                        value={formData.review_text}
                        onChange={(e) => {
                            setFormData(prev => ({ ...prev, review_text: e.target.value }));
                            if (errors.review_text) setErrors(prev => ({ ...prev, review_text: '' }));
                        }}
                        placeholder="Share your thoughts about this product..."
                        rows={4}
                        className={`w-full text-black px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-vertical ${errors.review_text ? 'border-red-300' : 'border-gray-300'
                            }`}
                        maxLength={1000}
                    />
                    <div className="flex justify-between mt-1">
                        {errors.review_text ? (
                            <p className="text-xs text-red-600">{errors.review_text}</p>
                        ) : (
                            <div></div>
                        )}
                        <span className="text-xs text-gray-400">
                            {formData.review_text.length}/1000
                        </span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg font-medium hover:bg-gray-50 transition-colors"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading || formData.rating === 0}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Send className="w-4 h-4" />
                                {isEditing ? 'Update' : 'Submit'}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ReviewForm;