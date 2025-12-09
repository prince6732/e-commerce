"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "../../../../utils/axios";
import imgPlaceholder from "@/public/imagePlaceholder.png";

type Product = {
    id: number;
    name: string;
    description: string;
    image_url: string;
    min_price: number;
    max_price: number;
    brand: { id: number; name: string } | null;
    category: { id: number; name: string } | null;
};

const imageUrl = `${process.env.NEXT_PUBLIC_UPLOAD_BASE}`;

export default function ProductSlider() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const router = useRouter();

    const fetchProducts = async () => {
        try {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/products-paginated`, {
                params: {
                    per_page: 12,
                    page: 1,
                }
            });
            if (res.data.success && Array.isArray(res.data.data)) {
                setProducts(res.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch products", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const onDetail = (product: Product) => {
        router.push(`/products/${product.id}`);
    };

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 300;
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

    return (
        <section className="py-8 sm:py-12 md:py-16 bg-white">
            <div className="w-full max-w-[1536px] mx-auto px-7 sm:px-4 md:px-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <div>
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Featured Products</h2>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1">Explore our latest collection</p>
                    </div>
                    {products.length > 5 && (
                        <button
                            onClick={() => router.push('/products')}
                            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-all duration-200 border border-orange-200 hover:border-orange-300"
                        >
                            <span>View All</span>
                            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="relative">
                        {/* Loading Skeleton - Horizontal Scroll */}
                        <div className="overflow-hidden">
                            <div className="flex gap-3 sm:gap-4 md:gap-5 lg:gap-6">
                                {Array.from({ length: 6 }).map((_, index) => (
                                    <div
                                        key={index}
                                        className="flex-shrink-0 w-[140px] sm:w-[160px] md:w-[280px] lg:w-[320px] h-[180px] sm:h-[200px] md:h-[340px] lg:h-[400px] rounded-lg bg-gray-200 animate-pulse"
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
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
                                {products.map((product) => (
                                    <div
                                        key={product.id}
                                        onClick={() => onDetail(product)}
                                        className="flex-shrink-0 w-[140px] sm:w-[160px] md:w-[280px] lg:w-[320px] snap-start group relative overflow-hidden rounded-lg cursor-pointer shadow-md hover:shadow-xl transition-all duration-300"
                                    >
                                        <div className="relative h-[180px] sm:h-[200px] md:h-[340px] lg:h-[400px]">
                                            <img
                                                src={
                                                    product.image_url
                                                        ? `${imageUrl}${product.image_url}`
                                                        : imgPlaceholder.src
                                                }
                                                alt={product.name}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end p-3 md:p-4">
                                                <div className="w-full">
                                                    <h3 className="text-sm md:text-base lg:text-lg font-semibold text-white line-clamp-2 leading-tight mb-1">
                                                        {product.name}
                                                    </h3>
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-white/90 text-xs md:text-sm font-bold">
                                                            {product.min_price === product.max_price
                                                                ? `₹${product.min_price}`
                                                                : `₹${product.min_price} - ₹${product.max_price}`
                                                            }
                                                        </p>
                                                        <p className="text-white/80 text-xs md:text-sm">View →</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* View All Card at the end */}
                                {products.length > 5 && (
                                    <div
                                        onClick={() => router.push('/products')}
                                        className="flex-shrink-0 w-[140px] sm:w-[160px] md:w-[280px] lg:w-[320px] h-[180px] sm:h-[200px] md:h-[340px] lg:h-[400px] snap-start group relative overflow-hidden rounded-lg cursor-pointer bg-gradient-to-br from-orange-400 to-orange-600 shadow-md hover:shadow-xl transition-all duration-300"
                                    >
                                        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                                            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-white/20 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                                <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                                </svg>
                                            </div>
                                            <h3 className="text-sm md:text-base font-bold text-white mb-1">View All</h3>
                                            <p className="text-xs md:text-sm text-white/80">Products</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Empty State */}
                        {products.length === 0 && (
                            <div className="text-center py-12 sm:py-16">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Products Found</h3>
                                <p className="text-sm text-gray-600">Products will appear here once they are added.</p>
                            </div>
                        )}
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
}
