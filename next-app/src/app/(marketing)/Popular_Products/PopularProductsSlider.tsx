"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { FaStar, FaStarHalfAlt, FaEye } from "react-icons/fa";
import { getMostOrderedProducts } from "../../../../utils/product";
import { getImageUrl } from "../../../../utils/imageUtils";
import Link from "next/link";

interface PopularProduct {
    id: number;
    name: string;
    description: string;
    image_url: string | null;
    category: {
        id: number;
        name: string;
    } | null;
    brand: {
        id: number;
        name: string;
    } | null;
    price_range: {
        min: string | number;
        max: string | number;
        currency: string;
    };
    total_stock: number;
    likes_count: number;
    variants_count: number;
    best_variant: {
        id: number;
        title: string | null;
        sku: string;
        sp: string | number;
        mrp: string | number;
        stock: number;
        image_url: string | null;
    } | null;
    total_ordered_quantity: number;
    total_orders_count: number;
    total_revenue: number;
    average_rating: string | number;
    reviews_count: number;
    created_at: string;
}

const PopularProductsSlider = () => {
    const [products, setProducts] = useState<PopularProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchPopularProducts = async () => {
            try {
                setLoading(true);
                const response = await getMostOrderedProducts(8);

                if (response.success && response.result) {
                    const products = response.result.products || [];
                    setProducts(products);
                } else {
                    setError(response.message || "Failed to fetch popular products");
                }
            } catch (err) {
                setError("An error occurred while fetching products");
                console.error("Error fetching popular products:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchPopularProducts();
    }, []);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 350;
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    // Touch handlers for swipe functionality
    const minSwipeDistance = 50;

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;

        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            scroll('right');
        } else if (isRightSwipe) {
            scroll('left');
        }
    };

    const Rating = ({ rating, reviewsCount }: { rating: number; reviewsCount: number }) => {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;

        return (
            <div className="flex items-center">
                <div className="flex text-amber-400 text-xs sm:text-sm">
                    {Array.from({ length: fullStars }).map((_, i) => (
                        <FaStar key={i} />
                    ))}
                    {hasHalfStar && <FaStarHalfAlt />}
                    {Array.from({ length: 5 - fullStars - (hasHalfStar ? 1 : 0) }).map((_, i) => (
                        <FaStar key={`empty-${i}`} className="text-gray-300" />
                    ))}
                </div>
                <span className="text-xs text-gray-500 ml-1">({reviewsCount})</span>
            </div>
        );
    };

    const formatPrice = (price: number, currency: string = "INR") => {
        return currency === "INR" ? `₹${price.toLocaleString()}` : `$${price.toFixed(2)}`;
    };

    const formatNumber = (num: number) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    if (loading) {
        return (
            <section className="py-8 sm:py-12 md:py-16 bg-white">
                <div className="w-full max-w-[1536px] mx-auto px-7 sm:px-4 md:px-6">
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                        <div className="flex-1">
                            <div className="h-6 sm:h-8 bg-gray-300 rounded w-48 sm:w-64 mb-2 animate-pulse"></div>
                            <div className="h-3 sm:h-4 bg-gray-200 rounded w-56 sm:w-80 animate-pulse"></div>
                        </div>
                        <div className="h-8 w-20 sm:w-24 bg-gray-200 rounded-lg animate-pulse"></div>
                    </div>

                    {/* Loading Skeleton - Horizontal Scroll */}
                    <div className="overflow-hidden">
                        <div className="flex gap-3 sm:gap-4 md:gap-5 lg:gap-6">
                            {Array.from({ length: 6 }).map((_, index) => (
                                <div key={index} className="flex-shrink-0 w-[160px] sm:w-[180px] md:w-[280px] lg:w-[320px]">
                                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                                        <div className="w-full h-[200px] sm:h-[220px] md:h-[340px] lg:h-[400px] bg-gray-200 animate-pulse" />
                                        <div className="p-3 md:p-4 space-y-2 md:space-y-3">
                                            <div className="h-3 md:h-4 bg-gray-200 rounded animate-pulse" />
                                            <div className="h-3 bg-gray-100 rounded w-3/4 animate-pulse" />
                                            <div className="h-3 md:h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className="py-8 sm:py-12 md:py-16 bg-white">
                <div className="w-full max-w-[1536px] mx-auto px-7 sm:px-4 md:px-6">
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4">Popular Products</h2>
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <p className="text-red-500 mb-4">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="py-8 sm:py-12 md:py-16 bg-white">
            <div className="w-full max-w-[1536px] mx-auto px-7 sm:px-4 md:px-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <div>
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Popular Products</h2>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1">Best-selling items loved by customers</p>
                    </div>
                    {products.length > 5 && (
                        <Link
                            href="/Popular_Products"
                            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-all duration-200 border border-orange-200 hover:border-orange-300"
                        >
                            <span>View All</span>
                            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    )}
                </div>

                {products.length > 0 ? (
                    <div className="relative">
                        {/* Horizontal Scroll for All Screen Sizes */}
                        <div className="relative">
                            {/* Left Navigation Button - Hidden on Mobile and when items <= 4 */}
                            {products.length > 4 && (
                                <button
                                    onClick={() => scroll('left')}
                                    className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 lg:w-12 lg:h-12 items-center justify-center bg-white/90 hover:bg-white shadow-lg rounded-full transition-all duration-200 hover:scale-110 -ml-5"
                                    aria-label="Scroll left"
                                >
                                    <svg className="w-5 h-5 lg:w-6 lg:h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                            )}

                            {/* Right Navigation Button - Hidden on Mobile and when items <= 4 */}
                            {products.length > 4 && (
                                <button
                                    onClick={() => scroll('right')}
                                    className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 lg:w-12 lg:h-12 items-center justify-center bg-white/90 hover:bg-white shadow-lg rounded-full transition-all duration-200 hover:scale-110 -mr-5"
                                    aria-label="Scroll right"
                                >
                                    <svg className="w-5 h-5 lg:w-6 lg:h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            )}

                            {/* Scrollable Container */}
                            <div
                                ref={scrollContainerRef}
                                className="flex gap-3 sm:gap-4 md:gap-5 lg:gap-6 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory pb-2"
                                style={{
                                    scrollbarWidth: 'none',
                                    msOverflowStyle: 'none',
                                }}
                                onTouchStart={onTouchStart}
                                onTouchMove={onTouchMove}
                                onTouchEnd={onTouchEnd}
                            >
                                {products.map((product) => {
                                    const rawImageUrl = product.image_url || product.best_variant?.image_url;
                                    const displayImage = getImageUrl(rawImageUrl) || "https://via.placeholder.com/400x400?text=No+Image";
                                    const price = parseFloat(String(product.best_variant?.sp || product.price_range.min || 0));
                                    const originalPrice = parseFloat(String(product.best_variant?.mrp || 0));
                                    const hasDiscount = originalPrice > price;
                                    const rating = parseFloat(String(product.average_rating || 0));

                                    return (
                                        <Link key={product.id} href={`/products/${product.id}`}>
                                            <div className="flex-shrink-0 w-[160px] sm:w-[180px] md:w-[280px] lg:w-[320px] snap-start group cursor-pointer bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 flex flex-col h-[300px] sm:h-[340px] md:h-[440px] lg:h-[500px]">
                                                <div className="relative overflow-hidden rounded-t-lg flex-shrink-0">
                                                    <img
                                                        src={displayImage}
                                                        alt={product.name}
                                                        className="w-full h-[180px] sm:h-[200px] md:h-[280px] lg:h-[320px] object-cover object-center group-hover:scale-105 transition-transform duration-300"
                                                        onError={(e) => {
                                                            e.currentTarget.src = "https://via.placeholder.com/400x400?text=No+Image";
                                                        }}
                                                    />
                                                    {/* {hasDiscount && (
                                                        <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-semibold">
                                                            {Math.round((1 - price / originalPrice) * 100)}% OFF
                                                        </span>
                                                    )} */}
                                                </div>
                                                <div className="p-3 flex-1 flex flex-col justify-between">
                                                    <div>
                                                        <h3 className="font-medium text-gray-900 line-clamp-2 group-hover:text-orange-600 transition-colors text-xs leading-tight min-h-[2rem]">
                                                            {product.name}
                                                        </h3>
                                                        <Rating rating={rating} reviewsCount={product.reviews_count || 0} />
                                                    </div>
                                                    <div>
                                                        <div className="flex flex-col gap-0.5 mt-1.5">
                                                            <p className="text-gray-900 font-semibold text-sm">
                                                                {formatPrice(price, product.price_range.currency)}
                                                            </p>
                                                            {hasDiscount && (
                                                                <p className="text-gray-500 line-through text-xs">
                                                                    {formatPrice(originalPrice, product.price_range.currency)}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center justify-between text-[10px] text-gray-500 mt-2">
                                                            <span className="truncate">{product.category?.name}</span>
                                                            <span className="flex items-center gap-0.5 flex-shrink-0 ml-1">
                                                                <FaEye className="w-2.5 h-2.5" />
                                                                {formatNumber(product.total_orders_count)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}

                                {/* View All Card */}
                                {products.length > 5 && (
                                    <Link href="/Popular_Products">
                                        <div className="flex-shrink-0 w-[160px] sm:w-[180px] md:w-[280px] lg:w-[320px] h-[300px] sm:h-[340px] md:h-[440px] lg:h-[500px] snap-start group cursor-pointer bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg shadow-md hover:shadow-xl transition-all duration-300">
                                            <div className="h-full flex flex-col items-center justify-center p-4 text-center">
                                                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-white/20 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                                    <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                                    </svg>
                                                </div>
                                                <h3 className="text-sm md:text-base lg:text-lg font-bold text-white mb-1">Explore All</h3>
                                                <p className="text-xs md:text-sm text-white/80">Popular Products</p>
                                            </div>
                                        </div>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        </div>
                        <p className="text-gray-500 text-lg font-medium">No popular products yet</p>
                        <p className="text-gray-400 text-sm mt-2">Products will appear here once customers start placing orders</p>
                    </div>
                )}
            </div>

            <style jsx>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </section>
    );
};

export default PopularProductsSlider;