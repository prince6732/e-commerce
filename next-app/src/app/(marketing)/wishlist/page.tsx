"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLike } from "@/context/LikeContext";
import { useAuth } from "@/context/AuthContext";
import { Heart, ShoppingCart, ArrowLeft, Trash2 } from "lucide-react";
import imgPlaceholder from "@/public/imagePlaceholder.png";
import { getUserLikedProducts } from "../../../../utils/likeApi";
import { fetchThemes } from "../../../../utils/theme";

type Themes = {
    id: number;
    background_color: string;
    text_color: string;
    primary_color: string;
    gradient_start?: string | null;
    gradient_end?: string | null;
    gradient_direction: string;
};

interface LikedProduct {
    id: number;
    name: string;
    description?: string;
    item_code?: string;
    image_url?: string;
    category?: {
        name: string;
    };
    brand?: {
        name: string;
    };
    variants: Array<{
        id: number;
        title: string;
        sku: string;
        sp: number;
        mrp?: number;
        stock: number;
        image_url?: string;
        image_json?: string;
    }>;
    min_price?: number;
    likes_count?: number;
}

const LikesPage = () => {
    const router = useRouter();
    const [themes, setThemes] = useState<Themes | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const { user, loading: authLoading } = useAuth();
    const { toggleLike, isLiked, likesLoading } = useLike();
    const [likedProducts, setLikedProducts] = useState<LikedProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [removingId, setRemovingId] = useState<number | null>(null);

    const basePath = process.env.NEXT_PUBLIC_UPLOAD_BASE || "https://api.zelton.co.in";

    useEffect(() => {
        if (authLoading) return;
        fetchLikedProducts();
    }, [user, authLoading]);

    useEffect(() => {
        loadTheme();
    }, []);

    const loadTheme = async () => {
        try {
            const data = await fetchThemes();
            if (Array.isArray(data) && data.length > 0) {
                const latest = data[data.length - 1];
                setThemes(latest);
            } else {
                setErrorMessage("No themes available");
            }
        } catch {
            setErrorMessage("Failed to fetch theme. Please try again.");
        }
    };
    const fetchLikedProducts = async () => {
        try {
            setLoading(true);
            const response = await getUserLikedProducts();
            if (response.res === 'success') {
                setLikedProducts(response.liked_products);
            }
        } catch (error) {
            console.error('Error fetching liked products:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveFromWishlist = async (productId: number) => {
        setRemovingId(productId);
        const success = await toggleLike(productId);
        if (success) {
            setLikedProducts(prev => prev.filter(product => product.id !== productId));
        }
        setRemovingId(null);
    };

    const handleProductClick = (productId: number) => {
        router.push(`/products/${productId}`);
    };

    const getProductImageUrl = (product: LikedProduct) => {
        if (product.image_url) {
            return `${basePath}${product.image_url}`;
        }
        if (product.variants && product.variants.length > 0 && product.variants[0].image_url) {
            return `${basePath}${product.variants[0].image_url}`;
        }
        return imgPlaceholder.src;
    };

    // Show loading while auth is being checked
    if (authLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
                <div className="container mx-auto px-4 py-16">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading your wishlist...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
                <div className="container mx-auto px-4 py-16">
                    <div className="text-center">
                        <Heart className="w-24 h-24 text-gray-400 mx-auto mb-6" />
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">Please Login</h1>
                        <p className="text-gray-600 mb-8">You need to login to view your wishlist</p>
                        <button
                            onClick={() => router.push('/login')}
                            style={{
                                background: themes
                                    ? `linear-gradient(${themes.gradient_direction}, ${themes.gradient_start || themes.primary_color}, ${themes.gradient_end || themes.primary_color})`
                                    : "linear-gradient(to right, #f97316, #facc15)",
                                color: themes?.text_color || "#fff",
                            }}
                            className="px-8 py-3 bg-gradient-to-r font-semibold rounded-full hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                        >
                            Login Now
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
                <div className="container mx-auto px-4 py-16">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading your wishlist...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-700 hover:text-gray-900 hover:bg-white border border-gray-200 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-medium">Back</span>
                    </button>
                    <div>
                        <h1 className="md:text-3xl text-xl font-bold text-gray-900">My Wishlist</h1>
                        <p className="text-gray-600">{likedProducts.length} {likedProducts.length === 1 ? 'item' : 'items'} in your wishlist</p>
                    </div>
                </div>

                {likedProducts.length === 0 ? (
                    <div className="text-center py-16">
                        <Heart className="w-24 h-24 text-gray-400 mx-auto mb-6" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Your wishlist is empty</h2>
                        <p className="text-gray-600 mb-8">Start adding products you love to your wishlist</p>
                        <button
                            onClick={() => router.push('/')}
                            style={{
                                background: themes
                                    ? `linear-gradient(${themes.gradient_direction}, ${themes.gradient_start || themes.primary_color}, ${themes.gradient_end || themes.primary_color})`
                                    : "linear-gradient(to right, #f97316, #facc15)",
                                color: themes?.text_color || "#fff",
                            }}
                            className="px-8 py-3  font-semibold rounded-full hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                        >
                            Browse Products
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {likedProducts.map((product) => (
                            <div key={product.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group">
                                {/* Product Image */}
                                <div className="relative aspect-square overflow-hidden">
                                    <Image
                                        src={getProductImageUrl(product)}
                                        alt={product.name}
                                        fill
                                        unoptimized
                                        className="object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                                        onClick={() => handleProductClick(product.id)}
                                    />
                                    {/* Remove from wishlist button */}
                                    <button
                                        onClick={() => handleRemoveFromWishlist(product.id)}
                                        disabled={removingId === product.id || likesLoading}
                                        className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full text-red-500 hover:bg-red-100 transition-all duration-200 disabled:opacity-50"
                                    >
                                        {removingId === product.id ? (
                                            <div className="w-5 h-5 border-2 border-red-300 border-t-red-500 rounded-full animate-spin"></div>
                                        ) : (
                                            <Heart className="w-5 h-5 fill-current" />
                                        )}
                                    </button>
                                </div>

                                {/* Product Info */}
                                <div className="p-4">
                                    <h3
                                        className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 cursor-pointer hover:text-orange-500 transition-colors"
                                        onClick={() => handleProductClick(product.id)}
                                    >
                                        {product.name}
                                    </h3>

                                    <div className="flex items-center gap-2 mb-3">
                                        {product.category && (
                                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                                {product.category.name}
                                            </span>
                                        )}
                                        {product.brand && (
                                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                                {product.brand.name}
                                            </span>
                                        )}
                                    </div>

                                    {product.variants.length > 0 && (
                                        <div className="mb-4">
                                            <div className="text-xl font-bold text-gray-900">
                                                ₹{product.variants[0].sp}
                                            </div>
                                            {product.variants[0].mrp && product.variants[0].mrp > product.variants[0].sp && (
                                                <div className="text-sm text-gray-500 line-through">
                                                    ₹{product.variants[0].mrp}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Action buttons */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleProductClick(product.id)}
                                            className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                                        >
                                            <ShoppingCart className="w-4 h-4" />
                                            View Product
                                        </button>
                                        <button
                                            onClick={() => handleRemoveFromWishlist(product.id)}
                                            disabled={removingId === product.id || likesLoading}
                                            className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors text-sm disabled:opacity-50"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LikesPage;