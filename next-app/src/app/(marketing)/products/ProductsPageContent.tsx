"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Filter, X, ChevronLeft, ChevronRight, ChevronDown, Home } from "lucide-react";
import axios from "../../../../utils/axios";
import { fetchThemes } from "../../../../utils/theme";
import imgPlaceholder from "@/public/imagePlaceholder.png";

const basePath = process.env.NEXT_PUBLIC_UPLOAD_BASE || "https://api.zelton.co.in";

type Themes = {
    id: number;
    background_color: string;
    text_color: string;
    primary_color: string;
    gradient_start?: string | null;
    gradient_end?: string | null;
    gradient_direction: string;
};

type Product = {
    id: number;
    name: string;
    description: string;
    image_url: string;
    min_price: number;
    max_price: number;
    brand: { id: number; name: string } | null;
    category: { id: number; name: string } | null;
    variants: any[];
};

type Category = {
    id: number;
    name: string;
    parent_id: number | null;
    image?: string;
};

const ProductsPage = () => {
    const searchParams = useSearchParams();

    const [themes, setThemes] = useState<Themes | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [subcategories, setSubcategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [categoryDropdownOpen, setCategoryDropdownOpen] = useState<number | null>(null);

    // Filter states
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
    const [selectedCategory, setSelectedCategory] = useState<number | null>(
        searchParams.get('category_id') ? parseInt(searchParams.get('category_id')!) : null
    );
    const [selectedSubcategory, setSelectedSubcategory] = useState<number | null>(
        searchParams.get('subcategory_id') ? parseInt(searchParams.get('subcategory_id')!) : null
    );

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalProducts, setTotalProducts] = useState(0);

    useEffect(() => {
        loadTheme();
        loadCategories();
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [currentPage, selectedCategory, selectedSubcategory]);

    const loadTheme = async () => {
        try {
            const data = await fetchThemes();
            if (Array.isArray(data) && data.length > 0) {
                setThemes(data[data.length - 1]);
            }
        } catch (error) {
            console.error("Failed to fetch theme:", error);
        }
    };

    const loadCategories = async () => {
        try {
            const response = await axios.get('/api/categories');
            const allCategories = response.data;
            
            if (!Array.isArray(allCategories)) {
                console.error('Categories is not an array:', allCategories);
                return;
            }
            
            // Parent categories (those with parent_id === null)
            const parents = allCategories.filter((cat: any) => cat.parent_id === null);
            
            // Flatten all subcategories from children arrays
            const subs: Category[] = [];
            allCategories.forEach((cat: any) => {
                if (cat.children && cat.children.length > 0) {
                    cat.children.forEach((child: any) => {
                        subs.push({
                            id: child.id,
                            name: child.name,
                            parent_id: child.parent_id,
                            image: child.image
                        });
                    });
                }
            });
            
            setCategories(parents);
            setSubcategories(subs);
        } catch (error) {
            console.error("Failed to fetch categories:", error);
        }
    };

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const params: any = {
                page: currentPage,
                per_page: 20,
            };

            if (searchQuery) params.search = searchQuery;
            
            // If subcategory is selected, use it as category_id
            // Otherwise, use the selected category
            if (selectedSubcategory) {
                params.category_id = selectedSubcategory;
            } else if (selectedCategory) {
                params.category_id = selectedCategory;
            }

            const response = await axios.get('/api/products-paginated', { params });

            if (response.data.success) {
                setProducts(response.data.data);
                setTotalPages(response.data.pagination.last_page);
                setTotalProducts(response.data.pagination.total);
            }
        } catch (error) {
            console.error("Failed to fetch products:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        setCurrentPage(1);
        fetchProducts();
    };

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedCategory(null);
        setSelectedSubcategory(null);
        setCurrentPage(1);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const getFilteredSubcategories = () => {
        if (!selectedCategory) return [];
        return subcategories.filter(sub => sub.parent_id === selectedCategory);
    };

    const getSubcategoriesForCategory = (categoryId: number) => {
        return subcategories.filter(sub => sub.parent_id === categoryId);
    };

    const getSelectedCategoryName = () => {
        if (!selectedCategory) return null;
        return categories.find(cat => cat.id === selectedCategory)?.name;
    };

    const getSelectedSubcategoryName = () => {
        if (!selectedSubcategory) return null;
        return subcategories.find(sub => sub.id === selectedSubcategory)?.name;
    };

    if (loading && products.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
                <div className="container mx-auto px-4 py-16">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading products...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
            <div className="container mx-auto px-4 py-8">
                {/* Breadcrumb Navigation */}
                <div className="mb-6">
                    <div className="flex items-center gap-2 text-sm">
                        <Link href="/" className="text-gray-500 hover:text-orange-600 transition-colors flex items-center gap-1">
                            <Home className="w-4 h-4" />
                            Home
                        </Link>
                        <span className="text-gray-400">/</span>
                        <Link href="/products" className="text-gray-500 hover:text-orange-600 transition-colors">
                            Products
                        </Link>
                        {selectedCategory && (
                            <>
                                <span className="text-gray-400">/</span>
                                <span className="text-orange-600 font-medium">{getSelectedCategoryName()}</span>
                            </>
                        )}
                        {selectedSubcategory && (
                            <>
                                <span className="text-gray-400">/</span>
                                <span className="text-orange-600 font-medium">{getSelectedSubcategoryName()}</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        {selectedSubcategory ? getSelectedSubcategoryName() : selectedCategory ? getSelectedCategoryName() : 'All Products'}
                    </h1>
                    <p className="text-gray-600">{totalProducts} products found</p>
                </div>

                {/* Search Bar */}
                <div className="mb-6">
                    <div className="flex gap-3">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                placeholder="Search products..."
                                className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        </div>
                        <button
                            onClick={handleSearch}
                            style={{
                                background: themes
                                    ? `linear-gradient(${themes.gradient_direction}, ${themes.gradient_start || themes.primary_color}, ${themes.gradient_end || themes.primary_color})`
                                    : "linear-gradient(to right, #f97316, #facc15)",
                                color: themes?.text_color || "#fff",
                            }}
                            className="px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
                        >
                            Search
                        </button>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="lg:hidden px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all"
                        >
                            <Filter className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="flex gap-8">
                    {/* Filters Sidebar */}
                    <div className={`${showFilters ? 'block' : 'hidden'} lg:block w-full lg:w-80 flex-shrink-0`}>
                        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden sticky top-8">
                            {/* Filter Header */}
                            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 px-6 py-5 border-b border-orange-100">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center shadow-lg">
                                            <Filter className="w-5 h-5 text-white" />
                                        </div>
                                        <h2 className="text-xl font-bold text-gray-900">Filters</h2>
                                    </div>
                                    {(selectedCategory || selectedSubcategory || searchQuery) && (
                                        <button
                                            onClick={clearFilters}
                                            className="text-sm text-orange-600 hover:text-orange-700 font-semibold hover:underline transition-all"
                                        >
                                            Reset
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Filter Content */}
                            <div className="p-6">
                                {/* Categories Filter with Dropdown */}
                                <div className="mb-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-1 h-6 bg-gradient-to-b from-orange-500 to-yellow-500 rounded-full"></div>
                                        <h3 className="font-bold text-gray-900 text-lg">Categories</h3>
                                    </div>
                                    <div className="space-y-1.5">
                                        <button
                                            onClick={() => {
                                                setSelectedCategory(null);
                                                setSelectedSubcategory(null);
                                                setCategoryDropdownOpen(null);
                                                setCurrentPage(1);
                                            }}
                                            className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 font-medium ${!selectedCategory && !selectedSubcategory
                                                    ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white shadow-lg shadow-orange-200'
                                                    : 'text-gray-700 hover:bg-gray-50 border border-gray-200'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full ${!selectedCategory && !selectedSubcategory ? 'bg-white' : 'bg-orange-500'}`}></div>
                                                <span>All Categories</span>
                                            </div>
                                        </button>
                                        {categories.map((category) => {
                                            const categorySubcategories = getSubcategoriesForCategory(category.id);
                                            const hasSubcategories = categorySubcategories.length > 0;
                                            const isDropdownOpen = categoryDropdownOpen === category.id;
                                            const isCategorySelected = selectedCategory === category.id && !selectedSubcategory;
                                            
                                            return (
                                                <div key={category.id} className="relative">
                                                    <button
                                                        onClick={() => {
                                                            // Toggle dropdown
                                                            if (isDropdownOpen) {
                                                                setCategoryDropdownOpen(null);
                                                            } else {
                                                                setCategoryDropdownOpen(category.id);
                                                            }
                                                        }}
                                                        className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex items-center gap-3 group ${
                                                            isCategorySelected
                                                                ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white shadow-lg shadow-orange-200'
                                                                : 'text-gray-700 hover:bg-gray-50 border border-gray-200'
                                                        }`}
                                                    >
                                                        {category.image && (
                                                            <div className={`relative w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 shadow-md ${
                                                                isCategorySelected ? 'ring-2 ring-white' : 'bg-gray-100'
                                                            }`}>
                                                                <Image
                                                                    src={`${basePath}${category.image}`}
                                                                    alt={category.name}
                                                                    fill
                                                                    unoptimized
                                                                    className="object-cover"
                                                                />
                                                            </div>
                                                        )}
                                                        <div className="flex-1">
                                                            <span className="font-semibold block">{category.name}</span>
                                                            {hasSubcategories && (
                                                                <span className={`text-xs ${isCategorySelected ? 'text-white/80' : 'text-gray-500'}`}>
                                                                    {categorySubcategories.length} items
                                                                </span>
                                                            )}
                                                        </div>
                                                        {hasSubcategories && (
                                                            <ChevronDown 
                                                                className={`w-5 h-5 transition-transform duration-200 flex-shrink-0 ${
                                                                    isDropdownOpen ? 'rotate-180' : ''
                                                                }`}
                                                            />
                                                        )}
                                                    </button>

                                                    {/* Subcategories Dropdown */}
                                                    {hasSubcategories && isDropdownOpen && (
                                                        <div className="mt-2 ml-3 pl-4 border-l-3 border-gradient-to-b from-orange-300 to-yellow-300 space-y-1.5">
                                                            {categorySubcategories.map((subcategory) => {
                                                                const isSubSelected = selectedSubcategory === subcategory.id;
                                                                return (
                                                                    <button
                                                                        key={subcategory.id}
                                                                        onClick={() => {
                                                                            setSelectedCategory(category.id);
                                                                            setSelectedSubcategory(subcategory.id);
                                                                            setCurrentPage(1);
                                                                        }}
                                                                        className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200 text-sm flex items-center gap-2.5 ${
                                                                            isSubSelected
                                                                                ? 'bg-orange-50 text-orange-600 font-semibold border-2 border-orange-200 shadow-sm'
                                                                                : 'text-gray-600 hover:bg-gray-50 border border-transparent'
                                                                        }`}
                                                                    >
                                                                        {subcategory.image && (
                                                                            <div className={`relative w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 shadow ${
                                                                                isSubSelected ? 'ring-2 ring-orange-300' : 'bg-gray-100'
                                                                            }`}>
                                                                                <Image
                                                                                    src={`${basePath}${subcategory.image}`}
                                                                                    alt={subcategory.name}
                                                                                    fill
                                                                                    className="object-cover"
                                                                                    unoptimized
                                                                                />
                                                                            </div>
                                                                        )}
                                                                        <span className="flex-1">{subcategory.name}</span>
                                                                        {isSubSelected && (
                                                                            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                                                        )}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Products Grid */}
                    <div className="flex-1">
                        {loading ? (
                            <div className="text-center py-16">
                                <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
                                <p className="text-gray-600">Loading products...</p>
                            </div>
                        ) : products.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Search className="w-12 h-12 text-gray-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">No Products Found</h3>
                                <p className="text-gray-600 mb-6">Try adjusting your filters or search query</p>
                                <button
                                    onClick={clearFilters}
                                    style={{
                                        background: themes
                                            ? `linear-gradient(${themes.gradient_direction}, ${themes.gradient_start || themes.primary_color}, ${themes.gradient_end || themes.primary_color})`
                                            : "linear-gradient(to right, #f97316, #facc15)",
                                        color: themes?.text_color || "#fff",
                                    }}
                                    className="px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* Products Grid - 4 columns */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                                    {products.map((product) => (
                                        <Link
                                            key={product.id}
                                            href={`/products/${product.id}`}
                                            className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
                                        >
                                            {/* Product Image */}
                                            <div className="relative h-64 bg-gray-100 overflow-hidden">
                                                <Image
                                                    src={product.image_url ? `${basePath}${product.image_url}` : imgPlaceholder}
                                                    alt={product.name}
                                                    fill
                                                    unoptimized
                                                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                                                />
                                            </div>

                                            {/* Product Info */}
                                            <div className="p-4">
                                                <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors">
                                                    {product.name}
                                                </h3>

                                                {product.category && (
                                                    <p className="text-sm text-gray-500 mb-2">{product.category.name}</p>
                                                )}

                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        {product.min_price === product.max_price ? (
                                                            <span className="text-xl font-bold text-gray-900">
                                                                ₹{product.min_price}
                                                            </span>
                                                        ) : (
                                                            <span className="text-xl font-bold text-gray-900">
                                                                ₹{product.min_price} - ₹{product.max_price}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-center gap-2 mt-8">
                                        <button
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                        >
                                            <ChevronLeft className="w-5 h-5" />
                                        </button>

                                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                            let pageNumber;
                                            if (totalPages <= 5) {
                                                pageNumber = i + 1;
                                            } else if (currentPage <= 3) {
                                                pageNumber = i + 1;
                                            } else if (currentPage >= totalPages - 2) {
                                                pageNumber = totalPages - 4 + i;
                                            } else {
                                                pageNumber = currentPage - 2 + i;
                                            }

                                            return (
                                                <button
                                                    key={i}
                                                    onClick={() => handlePageChange(pageNumber)}
                                                    style={currentPage === pageNumber ? {
                                                        background: themes
                                                            ? `linear-gradient(${themes.gradient_direction}, ${themes.gradient_start || themes.primary_color}, ${themes.gradient_end || themes.primary_color})`
                                                            : "linear-gradient(to right, #f97316, #facc15)",
                                                        color: themes?.text_color || "#fff",
                                                    } : {}}
                                                    className={`px-4 py-2 rounded-lg font-medium transition-all ${currentPage === pageNumber
                                                            ? 'shadow-lg'
                                                            : 'border border-gray-300 hover:bg-gray-100'
                                                        }`}
                                                >
                                                    {pageNumber}
                                                </button>
                                            );
                                        })}

                                        <button
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                        >
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Filter Overlay */}
            {showFilters && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-40"
                    onClick={() => setShowFilters(false)}
                />
            )}
        </div>
    );
};

export default ProductsPage;
