'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { RiSearchLine, RiGridLine, RiListUnordered, RiArrowLeftLine } from 'react-icons/ri';
import axios from '../../../../utils/axios';
import Link from 'next/link';

const basePath = process.env.NEXT_PUBLIC_UPLOAD_BASE || "https://api.zelton.co.in";

interface Product {
    id: number;
    name: string;
    description?: string;
    image_url?: string;
    category?: { id: number; name: string };
    brand?: { id: number; name: string };
    variants: Array<{
        id: number;
        title?: string;
        mrp: number;
        sp: number;
        stock: number;
        image_url?: string;
    }>;
    matching_variants?: Array<{
        id: number;
        title?: string;
        mrp: number;
        sp: number;
    }>;
}



interface SearchResponse {
    res: string;
    message: string;
    data: {
        products: Product[];
        pagination: {
            current_page: number;
            total_count: number;
            per_page: number;
            total_pages: number;
            has_more: boolean;
        };
        search_info: {
            query: string;
            category_id?: number;
            brand_id?: number;
            results_count: number;
        };
    };
}

const SearchPage = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const query = searchParams?.get('q') || '';

    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [pagination, setPagination] = useState<any>(null);
    const [searchInfo, setSearchInfo] = useState<any>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [sortBy, setSortBy] = useState('relevance');

    // Perform search
    const performSearch = async (page = 1) => {
        if (!query.trim()) return;

        setIsLoading(true);
        try {
            const params: any = {
                q: query,
                page,
                limit: 20,
            };

            const response = await axios.get<SearchResponse>(`/api/search-products`, { params });

            if (response.data.res === 'success') {
                let results = response.data.data.products;

                // Apply client-side sorting
                if (sortBy !== 'relevance') {
                    results = [...results].sort((a, b) => {
                        switch (sortBy) {
                            case 'price_low_high':
                                const aMinPrice = Math.min(...(a.variants?.map((v: any) => v.sp || v.mrp) || [0]));
                                const bMinPrice = Math.min(...(b.variants?.map((v: any) => v.sp || v.mrp) || [0]));
                                return aMinPrice - bMinPrice;
                            case 'price_high_low':
                                const aMaxPrice = Math.max(...(a.variants?.map((v: any) => v.sp || v.mrp) || [0]));
                                const bMaxPrice = Math.max(...(b.variants?.map((v: any) => v.sp || v.mrp) || [0]));
                                return bMaxPrice - aMaxPrice;
                            case 'name':
                                return a.name.localeCompare(b.name);
                            default:
                                return 0;
                        }
                    });
                }

                setSearchResults(results);
                setPagination(response.data.data.pagination);
                setSearchInfo(response.data.data.search_info);
            } else {
                setSearchResults([]);
            }
        } catch (error) {
            console.error('Search error:', error);
            setSearchResults([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (query) {
            performSearch(currentPage);
        }
    }, [query, currentPage, sortBy]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const getMinPrice = (variants: Product['variants']) => {
        if (!variants || variants.length === 0) return 0;
        return Math.min(...variants.map(v => v.sp || v.mrp));
    };

    const getMaxPrice = (variants: Product['variants']) => {
        if (!variants || variants.length === 0) return 0;
        return Math.max(...variants.map(v => v.sp || v.mrp));
    };

    const hasDiscount = (variants: Product['variants']) => {
        return variants?.some(v => v.sp && v.sp < v.mrp) || false;
    };



    if (!query) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <RiSearchLine className="text-6xl text-gray-300 mx-auto mb-4" />
                    <h2 className="text-2xl font-semibold text-gray-600 mb-2">No search query provided</h2>
                    <p className="text-gray-500">Please enter a search term to find products.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Enhanced Search Header */}
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-b border-orange-100">
                <div className="container mx-auto px-4 py-4">
                    {/* Main Header Content */}
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-4 mb-2">
                                {/* Back Button */}
                                <button
                                    onClick={() => router.back()}
                                    className="flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors p-2 hover:bg-white/60 rounded-lg group"
                                >
                                    <RiArrowLeftLine className="text-xl group-hover:transform group-hover:-translate-x-1 transition-all" />
                                    <span className="hidden sm:inline font-medium">Back</span>
                                </button>

                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-xl flex items-center justify-center">
                                        <RiSearchLine className="text-white text-xl" />
                                    </div>
                                    <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent">
                                        Search Results
                                    </h1>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 flex-wrap">
                                <div className="bg-white px-4 py-2 rounded-full border border-orange-200 shadow-sm">
                                    <span className="text-sm text-gray-600">Searching for: </span>
                                    <span className="font-semibold text-orange-600">"{query}"</span>
                                </div>
                                {searchInfo && (
                                    <div className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-sm">
                                        {searchResults.length} results found
                                    </div>
                                )}
                                {pagination && pagination.total_pages > 1 && (
                                    <div className="bg-white px-4 py-2 rounded-full border border-gray-200 text-sm text-gray-600 shadow-sm">
                                        Page {pagination.current_page} of {pagination.total_pages}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-4 flex-wrap">
                            {/* View Mode Toggle */}
                            <div className="flex bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-3 rounded-lg transition-all ${viewMode === 'grid'
                                        ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    <RiGridLine className="text-lg" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-3 rounded-lg transition-all ${viewMode === 'list'
                                        ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    <RiListUnordered className="text-lg" />
                                </button>
                            </div>

                            {/* Sort Dropdown */}
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="bg-white border border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-gray-700 shadow-sm hover:shadow-md transition-all"
                            >
                                <option value="relevance">Most Relevant</option>
                                <option value="price_low_high">Price: Low to High</option>
                                <option value="price_high_low">Price: High to Low</option>
                                <option value="name">Name A-Z</option>
                            </select>
                        </div>
                    </div>


                </div>
            </div>

            {/* Search Results */}
            <div className="container mx-auto px-4 py-8">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                    </div>
                ) : searchResults.length > 0 ? (
                    <>
                        {/* Products Grid/List */}
                        <div className={`grid gap-6 ${viewMode === 'grid'
                            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                            : 'grid-cols-1 max-w-4xl mx-auto'
                            }`}>
                            {searchResults.map((product) => (
                                <div
                                    key={product.id}
                                    className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 group ${viewMode === 'list' ? 'flex' : ''
                                        }`}
                                >
                                    {/* Product Image */}
                                    <div className={`relative overflow-hidden ${viewMode === 'list' ? 'w-48 flex-shrink-0' : 'aspect-square'
                                        }`}>
                                        {product.image_url ? (
                                            <img
                                                src={`${basePath}${product.image_url}`}
                                                alt={product.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                                                <span className="text-gray-500 font-bold text-xl">
                                                    {product.name?.charAt(0).toUpperCase() || 'P'}
                                                </span>
                                            </div>
                                        )}
                                        {hasDiscount(product.variants) && (
                                            <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                                SALE
                                            </div>
                                        )}
                                    </div>

                                    {/* Product Info */}
                                    <div className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                                        <Link href={`/products/${product.id}`}>
                                            <h3 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-2 mb-2">
                                                {product.name}
                                            </h3>
                                        </Link>

                                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                                            {product.category?.name && (
                                                <span>{product.category.name}</span>
                                            )}
                                            {product.brand?.name && (
                                                <>
                                                    <span>•</span>
                                                    <span>{product.brand.name}</span>
                                                </>
                                            )}
                                        </div>

                                        {product.variants && product.variants.length > 0 && (
                                            <div className="mb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg font-bold text-gray-900">
                                                        ₹{getMinPrice(product.variants).toLocaleString()}
                                                        {getMinPrice(product.variants) !== getMaxPrice(product.variants) &&
                                                            ` - ₹${getMaxPrice(product.variants).toLocaleString()}`
                                                        }
                                                    </span>
                                                    {hasDiscount(product.variants) && (
                                                        <span className="text-sm text-gray-500 line-through">
                                                            ₹{Math.max(...product.variants.map(v => v.mrp)).toLocaleString()}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Matching Variants */}
                                        {/* {product.matching_variants && product.matching_variants.length > 0 && (
                                            <div className="mb-3">
                                                <div className="text-xs font-semibold text-orange-600 mb-1">
                                                    Matching Variants:
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                    {product.matching_variants.slice(0, 3).map((variant) => (
                                                        <span
                                                            key={variant.id}
                                                            className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full"
                                                        >
                                                            {variant.title}
                                                        </span>
                                                    ))}
                                                    {product.matching_variants.length > 3 && (
                                                        <span className="text-xs text-gray-500">
                                                            +{product.matching_variants.length - 3} more
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )} */}

                                        <Link
                                            href={`/products/${product.id}`}
                                            className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 text-white py-2 px-4 rounded-xl font-medium hover:from-orange-600 hover:to-yellow-600 transition-all text-center block"
                                        >
                                            View Details
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {pagination && pagination.total_pages > 1 && (
                            <div className="flex justify-center items-center gap-2 mt-12">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                                >
                                    Previous
                                </button>

                                {Array.from({ length: pagination.total_pages }, (_, i) => i + 1)
                                    .filter(page =>
                                        page === 1 ||
                                        page === pagination.total_pages ||
                                        Math.abs(page - currentPage) <= 2
                                    )
                                    .map((page, index, array) => (
                                        <div key={page} className="flex items-center">
                                            {index > 0 && array[index - 1] !== page - 1 && (
                                                <span className="px-2 text-gray-400">...</span>
                                            )}
                                            <button
                                                onClick={() => handlePageChange(page)}
                                                className={`px-4 py-2 rounded-lg font-medium transition-all ${currentPage === page
                                                    ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white'
                                                    : 'border border-gray-200 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {page}
                                            </button>
                                        </div>
                                    ))}

                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === pagination.total_pages}
                                    className="px-4 py-2 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-20">
                        <RiSearchLine className="text-6xl text-gray-300 mx-auto mb-4" />
                        <h2 className="text-2xl font-semibold text-gray-600 mb-2">No results found</h2>
                        <p className="text-gray-500 mb-6">
                            We couldn't find any products matching "{query}". Try adjusting your search terms.
                        </p>
                        <div className="space-y-2">
                            <p className="text-sm text-gray-500">Suggestions:</p>
                            <ul className="text-sm text-gray-500 space-y-1">
                                <li>• Check your spelling</li>
                                <li>• Try more general keywords</li>
                                <li>• Use different search terms</li>
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchPage;