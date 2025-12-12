"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import imgPlaceholder from "@/public/imagePlaceholder.png";
import axios from "../../../../../utils/axios";
import { ProductDetail, ProductVariant } from "@/common/interface";
import { CheckCircle2, ChevronDown, Layers3, Package, Settings2, Tag, XCircle, ShoppingCart, Plus, Minus, Heart, ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useLike } from "@/context/LikeContext";
import ProductReviews from "@/components/reviews/ProductReviews";
import ProductRatingDisplay from "@/components/ui/ProductRatingDisplay";
import { getSimilarProducts } from "../../../../../utils/similarProducts";
import { useLoader } from "@/context/LoaderContext";

const ProductPage = () => {
    const { id } = useParams();
    const router = useRouter();

    const [product, setProduct] = useState<ProductDetail | null>(null);
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
    const [mainImage, setMainImage] = useState<string | null>(null);
    const [galleryImages, setGalleryImages] = useState<string[]>([]);
    const [selectedOptions, setSelectedOptions] = useState<{ [key: number]: string }>({});
    const [isSpecsOpen, setIsSpecsOpen] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [addingToCart, setAddingToCart] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState<string>("");
    const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
    const [isHovering, setIsHovering] = useState(false);
    const [isInCart, setIsInCart] = useState(false);
    const [liveRatingSummary, setLiveRatingSummary] = useState<{
        average_rating: number;
        total_reviews: number;
        rating_distribution: { [key: number]: number };
    } | null>(null);
    const [isUpdatingRating, setIsUpdatingRating] = useState(false);
    const [similarProducts, setSimilarProducts] = useState<ProductDetail[]>([]);
    const [loadingSimilar, setLoadingSimilar] = useState(false);
    const [similarPagination, setSimilarPagination] = useState({
        current_page: 1,
        has_more: false,
        total: 0
    });

    const { addToCart, loading: cartLoading } = useCart();
    const { user } = useAuth();
    const { toggleLike, isLiked, likesLoading } = useLike();
    const { showLoader, hideLoader } = useLoader();

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.zelton.co.in/api";
    const baseUrl = process.env.NEXT_PUBLIC_UPLOAD_BASE || "https://api.zelton.co.in";
        
    const fetchLiveRatingSummary = async (showLoading = false) => {
        if (!id) return;
        try {
            if (showLoading) setIsUpdatingRating(true);
            const res = await axios.get(`${apiUrl}/api/get-product/${id}`);
            if (res.data.res === "success" && res.data.product.rating_summary) {
                setLiveRatingSummary(res.data.product.rating_summary);
            }
        } catch (error) {
            console.error("Error fetching live rating summary:", error);
        } finally {
            if (showLoading) {
                setTimeout(() => setIsUpdatingRating(false), 500);
            }
        }
    };

    useEffect(() => {
        if (!id) return;
        const fetchProduct = async () => {
            showLoader();
            try {
                const res = await axios.get(`${apiUrl}/api/get-product/${id}`);
                if (res.data.res === "success") {
                    const prod: ProductDetail = res.data.product;

                    prod.image_url = prod.image_url ? `${baseUrl}${prod.image_url}` : null;
                    prod.variants = prod.variants.map((v) => ({
                        ...v,
                        image_url: v.image_url ? `${baseUrl}${v.image_url}` : null,
                    }));

                    if (prod.brand?.image1) prod.brand.image1 = `${baseUrl}${prod.brand.image1}`;
                    if (prod.category?.image) prod.category.image = `${baseUrl}${prod.category.image}`;

                    const productImages: string[] = prod.image_json
                        ? JSON.parse(prod.image_json).map((path: string) => `${baseUrl}${path}`)
                        : [];

                    const firstVariant = prod.variants[0];
                    const variantImages: string[] =
                        firstVariant?.image_json
                            ? JSON.parse(firstVariant.image_json).map((path: string) => `${baseUrl}${path}`)
                            : [];

                    const gallery = [
                        ...(productImages.length ? productImages : []),
                        ...(variantImages.length ? variantImages : []),
                    ];

                    setProduct(prod);
                    setSelectedVariant(firstVariant || null);
                    setMainImage(firstVariant?.image_url || productImages[0] || imgPlaceholder.src);
                    setGalleryImages(gallery.length ? gallery : [imgPlaceholder.src]);

                    // Set initial rating summary
                    if (prod.rating_summary) {
                        setLiveRatingSummary(prod.rating_summary);
                    }

                    // Fetch similar products
                    fetchSimilarProducts(prod.id);
                }
            } catch (e) {
                console.error(e);
            } finally {
                hideLoader();
            }
        };
        fetchProduct();
    }, [id]);

    const fetchSimilarProducts = async (productId: number, page: number = 1) => {
        setLoadingSimilar(true);
        showLoader();
        try {
            const response = await getSimilarProducts(productId, page, 10);
            const processedProducts = response.products.map((prod: ProductDetail) => ({
                ...prod,
                image_url: prod.image_url ? `${baseUrl}${prod.image_url}` : null,
                variants: prod.variants?.map((v: ProductVariant) => ({
                    ...v,
                    image_url: v.image_url ? `${baseUrl}${v.image_url}` : null,
                })) || [],
            }));
            
            if (page === 1) {
                setSimilarProducts(processedProducts);
            } else {
                setSimilarProducts(prev => [...prev, ...processedProducts]);
            }
            
            setSimilarPagination(response.pagination);
        } catch (error) {
            console.error('Error fetching similar products:', error);
        } finally {
            setLoadingSimilar(false);
            hideLoader();
        }
    };

    const loadMoreSimilarProducts = () => {
        if (similarPagination.has_more && !loadingSimilar) {
            fetchSimilarProducts(product!.id, similarPagination.current_page + 1);
        }
    };

    useEffect(() => {
        if (!product || !selectedVariant) return;

        const variantImages: string[] =
            selectedVariant.image_json
                ? JSON.parse(selectedVariant.image_json).map((path: string) => `${baseUrl}${path}`)
                : [];

        const productImages: string[] =
            product.image_json
                ? JSON.parse(product.image_json).map((path: string) => `${baseUrl}${path}`)
                : [];

        const gallery = [...productImages, ...variantImages];

        setGalleryImages(gallery.length ? gallery : [imgPlaceholder.src]);
        setMainImage(selectedVariant.image_url || gallery[0] || imgPlaceholder.src);
    }, [selectedVariant, product]);

    useEffect(() => {
        if (!product) return;
        const matched = product.variants.find((v) => {
            if (!v.attribute_values) return false;
            return product.item_attributes.every((ia) => {
                const selectedVal = selectedOptions[ia.attribute_id];
                return (
                    !selectedVal ||
                    v.attribute_values?.some(
                        (av: any) => av.attribute.id === ia.attribute_id && av.value === selectedVal
                    ) || false
                );
            });
        });

        if (matched) setSelectedVariant(matched);
    }, [selectedOptions, product]);

    // Auto-hide toast after 3 seconds
    useEffect(() => {
        if (showToast) {
            const timer = setTimeout(() => {
                setShowToast(false);
                setToastMessage("");
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [showToast]);

    useEffect(() => {
        if (!id) return;

        const interval = setInterval(() => {
            fetchLiveRatingSummary();
        }, 30000);

        const handleFocus = () => {
            fetchLiveRatingSummary();
        };

        window.addEventListener('focus', handleFocus);

        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', handleFocus);
        };
    }, [id]);

    useEffect(() => {
        const handleRatingUpdate = () => {
            fetchLiveRatingSummary();
        };

        window.addEventListener('reviewUpdated', handleRatingUpdate);
        window.addEventListener('reviewSubmitted', handleRatingUpdate);
        window.addEventListener('reviewDeleted', handleRatingUpdate);

        return () => {
            window.removeEventListener('reviewUpdated', handleRatingUpdate);
            window.removeEventListener('reviewSubmitted', handleRatingUpdate);
            window.removeEventListener('reviewDeleted', handleRatingUpdate);
        };
    }, []);

    const handleAddToCart = async () => {
        if (!user) {
            router.push('/login');
            return;
        }

        if (!selectedVariant) {
            alert('Please select all required options');
            return;
        }

        if (selectedVariant.stock < quantity) {
            alert(`Only ${selectedVariant.stock} items available`);
            return;
        }

        setAddingToCart(true);

        const success = await addToCart(
            product!.id,
            Number(selectedVariant.id),
            quantity,
            selectedOptions
        );

        if (success) {
            setToastMessage('Item added to cart successfully!');
            setShowToast(true);
            setIsInCart(true);
        }

        setAddingToCart(false);
    };

    const handleViewCart = () => {
        router.push('/cart');
    };

    const increaseQuantity = () => {
        if (selectedVariant && quantity < selectedVariant.stock) {
            setQuantity(prev => prev + 1);
            setIsInCart(false);
        }
    };

    const decreaseQuantity = () => {
        if (quantity > 1) {
            setQuantity(prev => prev - 1);
            setIsInCart(false);
        }
    };

    const handleLike = async () => {
        if (!user) {
            router.push('/login');
            return;
        }

        if (!product) return;

        const success = await toggleLike(product.id);
        if (success) {
            const message = isLiked(product.id)
                ? 'Removed from wishlist!'
                : 'Added to wishlist!';
            setToastMessage(message);
            setShowToast(true);
        }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setZoomPosition({ x, y });
    };

    const formatSpecificationKey = (key: string): string => {
        // Convert snake_case or camelCase to Title Case
        return key
            .replace(/([A-Z])/g, ' $1') // Add space before capital letters
            .replace(/[_-]/g, ' ') // Replace underscores and hyphens with spaces
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ')
            .trim();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
                <div className="container mx-auto px-4 py-16">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading product details...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
                <div className="container mx-auto px-4 py-16">
                    <div className="text-center">
                        <div className="w-24 h-24 text-gray-400 mx-auto mb-6">
                            <Package className="w-full h-full" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">Product Not Found</h1>
                        <p className="text-gray-600 mb-8">The product you're looking for doesn't exist or has been removed</p>
                        <button
                            onClick={() => router.push('/')}
                            className="px-8 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-semibold rounded-full hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                        >
                            Back to Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const features = product.feature_json ? JSON.parse(product.feature_json) : [];
    const details = product.detail_json ? JSON.parse(product.detail_json) : [];

    const attributeOptions: Record<number, string[]> = {};
    product.item_attributes.forEach((ia) => {
        const values = new Set<string>();
        product.variants.forEach((variant) => {
            variant.attribute_values?.forEach((av: any) => {
                if (av.attribute.id === ia.attribute_id) values.add(av.value);
            });
        });
        attributeOptions[ia.attribute_id] = Array.from(values);
    });

    return (
        <div className="w-full max-w-[1536px] mx-auto px-7 sm:px-4 md:px-6 py-10">
            {/* Success Toast */}
            {showToast && toastMessage && (
                <div className="fixed top-6 right-6 z-[9999] px-6 py-4 rounded-lg shadow-lg font-semibold transition-all bg-green-100 text-green-800 border border-green-200">
                    {toastMessage}
                </div>
            )}

            <button onClick={() => router.back()} className="mb-6 text-sm text-gray-600">
                ← Back
            </button>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Left Section - Images */}
                <div className="w-full md:w-1/3 relative">
                    <div
                        className="relative w-full aspect-square rounded overflow-hidden shadow-lg cursor-crosshair border-2 border-gray-200"
                        onMouseMove={handleMouseMove}
                        onMouseEnter={() => setIsHovering(true)}
                        onMouseLeave={() => setIsHovering(false)}
                    >
                        <Image
                            src={mainImage || imgPlaceholder.src}
                            alt={product.name}
                            fill
                            unoptimized
                            className="object-cover"
                        />

                        {/* Zoom Indicator Square */}
                        {isHovering && (
                            <div
                                className="absolute bg-white/30 backdrop-blur-none pointer-events-none w-32 h-32 shadow-lg"
                                style={{
                                    left: `${Math.max(0, Math.min(81, zoomPosition.x - 16))}%`,
                                    top: `${Math.max(0, Math.min(81, zoomPosition.y - 16))}%`,
                                    boxShadow: '0 0 0 2px rgba(0,0,0,0.3), inset 0 0 0 2px rgba(255,255,255,0.8)'
                                }}
                            />
                        )}
                    </div>

                    {/* Zoomed Image Panel - Right side of main image */}
                    {isHovering && (
                        <div className="hidden lg:block absolute top-0 left-full ml-4 w-[700px] h-[650px] border-2 border-gray-200 rounded overflow-hidden shadow-2xl bg-white z-20">
                            <div
                                className="relative w-[400%] h-[400%]"
                                style={{
                                    transform: `translate(-${Math.max(0, Math.min(78, zoomPosition.x - 16))}%, -${Math.max(0, Math.min(78, zoomPosition.y - 16))}%)`,
                                }}
                            >
                                <Image
                                    src={mainImage || imgPlaceholder.src}
                                    alt={`${product.name} - Zoomed`}
                                    fill
                                    className="object-cover"
                                    quality={100}
                                    unoptimized
                                />
                            </div>
                        </div>
                    )}

                    {/* Thumbnail Gallery */}
                    <div className="flex gap-2 mt-3 flex-wrap">
                        {galleryImages.map((img, idx) => (
                            <div
                                key={idx}
                                className={`relative w-16 h-16 border rounded overflow-hidden cursor-pointer hover:ring-2 hover:ring-orange-300 transition-all duration-200 ${mainImage === img ? "ring-2 ring-orange-500" : ""
                                    }`}
                                onClick={() => setMainImage(img)}
                            >
                                <Image
                                    src={img}
                                    alt={`thumb-${idx}`}
                                    fill
                                    unoptimized
                                    className="object-cover"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Section - Product Info */}
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                        <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
                        <button
                            onClick={handleLike}
                            disabled={likesLoading}
                            className={`p-3 rounded-full transition-all duration-300 ${isLiked(product.id)
                                ? 'bg-red-100 text-red-500 hover:bg-red-200'
                                : 'bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-500'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            <Heart
                                className={`w-6 h-6 transition-all duration-300 ${isLiked(product.id) ? 'fill-current' : ''
                                    }`}
                            />
                        </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-gray-600 text-sm mb-4">
                        {product.category && (
                            <span className="flex items-center gap-1">
                                <Layers3 className="w-4 h-4 text-orange-500" /> {product.category.name}
                            </span>
                        )}
                        {product.brand && (
                            <span className="flex items-center gap-1">
                                <Tag className="w-4 h-4 text-orange-500" /> Brand: {product.brand.name}
                            </span>
                        )}

                        {/* Rating */}
                        {(liveRatingSummary || product.rating_summary) && (
                            <div className="flex items-center gap-1 ms-6 relative group">
                                <div className={`relative ${isUpdatingRating ? 'animate-pulse' : ''}`}>
                                    <ProductRatingDisplay
                                        averageRating={(liveRatingSummary || product.rating_summary)?.average_rating || 0}
                                        reviewCount={(liveRatingSummary || product.rating_summary)?.total_reviews || 0}
                                        size="md"
                                        showCount={true}
                                        className="text-base cursor-pointer transition-all duration-500"
                                    />
                                    {isUpdatingRating && (
                                        <div className="absolute -top-1 -right-1">
                                            <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                                        </div>
                                    )}
                                </div>

                                {/* Rating Chart Tooltip */}
                                <div className="absolute top-full left-0 mt-2 p-4 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 w-72">
                                    <h4 className="font-semibold text-gray-800 mb-3 text-sm">
                                        Rating
                                    </h4>

                                    {/* Rating Distribution */}
                                    <div className="space-y-2">
                                        {[5, 4, 3, 2, 1].map((rating) => {
                                            const currentRating = liveRatingSummary || product.rating_summary;
                                            const count = currentRating?.rating_distribution[rating] || 0;
                                            const percentage = currentRating?.total_reviews
                                                ? (count / currentRating.total_reviews) * 100
                                                : 0;

                                            return (
                                                <div key={rating} className="flex items-center gap-2 text-xs">
                                                    <span className="w-4 text-gray-600">{rating}</span>
                                                    <div className="flex text-yellow-400">
                                                        {Array.from({ length: rating }, (_, i) => (
                                                            <span key={i}>★</span>
                                                        ))}
                                                    </div>
                                                    <div className="flex-1 bg-gray-200 rounded-full h-2 mx-2">
                                                        <div
                                                            className="bg-yellow-400 h-2 rounded-full transition-all duration-500"
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                    <span className="w-8 text-right text-gray-600 transition-all duration-300">{count}</span>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Summary */}
                                    <div className="mt-3 pt-3 border-t border-gray-100 text-center">
                                        <div className="text-lg font-bold text-gray-800 transition-all duration-300">
                                            {((liveRatingSummary || product.rating_summary)?.average_rating || 0).toFixed(1)}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            Based on {(liveRatingSummary || product.rating_summary)?.total_reviews || 0} review{((liveRatingSummary || product.rating_summary)?.total_reviews || 0) !== 1 ? 's' : ''}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {product.item_code && (
                        <p className="text-gray-500 text-sm mb-6">
                            <Package className="inline-block w-4 h-4 mr-1 text-orange-500" />
                            Item Code: {product.item_code}
                        </p>
                    )}

                    {/* Features and Attribute Options Row */}
                    <div className={`grid gap-6 mb-6 border bg-gray-50  p-5 rounded-2xl shadow-sm border-gray-200 ${product.item_attributes.length > 0 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
                        {/* Attribute Options Section */}
                        {product.item_attributes.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                    <Tag className="w-5 h-5 text-orange-500" />
                                    Attribute Options
                                </h3>
                                <div className="space-y-4">
                                    {product.item_attributes.map((ia) => (
                                        <div key={ia.attribute_id}>
                                            <h4 className="font-semibold mb-2 text-gray-800 text-sm">
                                                {ia.attribute.name}
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {attributeOptions[ia.attribute_id]?.map((val) => {
                                                    const isAvailable = product.variants.some((variant) => {
                                                        if (!variant.attribute_values) return false;

                                                        const matchesOtherAttrs = Object.entries(selectedOptions).every(
                                                            ([attrId, selectedVal]) => {
                                                                if (parseInt(attrId) === ia.attribute_id || !selectedVal) return true;
                                                                return variant.attribute_values?.some(
                                                                    (av: any) =>
                                                                        av.attribute.id === parseInt(attrId) &&
                                                                        av.value === selectedVal
                                                                );
                                                            }
                                                        );

                                                        const hasCurrentValue = variant.attribute_values.some(
                                                            (av: any) => av.attribute.id === ia.attribute_id && av.value === val
                                                        );

                                                        return matchesOtherAttrs && hasCurrentValue && variant.stock > 0;
                                                    });

                                                    const isSelected = selectedOptions[ia.attribute_id] === val;

                                                    return (
                                                        <button
                                                            key={val}
                                                            disabled={!isAvailable}
                                                            onClick={() =>
                                                                setSelectedOptions((prev) => ({
                                                                    ...prev,
                                                                    [ia.attribute_id]:
                                                                        prev[ia.attribute_id] === val ? "" : val,
                                                                }))
                                                            }
                                                            className={`px-4 py-2 rounded-xl border text-sm font-medium transition ${isSelected
                                                                ? "bg-orange-500 text-white border-orange-500"
                                                                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                                                                } ${!isAvailable ? "opacity-50 cursor-not-allowed" : ""}`}
                                                        >
                                                            {val}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Features Section */}
                        {features.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                    <Settings2 className="w-5 h-5 text-blue-500" />
                                    Key Features
                                </h3>
                                <ul className="space-y-2">
                                    {features.map((feature: string, idx: number) => (
                                        <li key={idx} className="flex items-start gap-2 text-gray-700">
                                            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                            <span className="text-sm leading-relaxed">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Selected Variant and Description Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                        {/* Selected Variant Section */}
                        {selectedVariant && (
                            <div className="bg-orange-50 border border-orange-200 p-5 rounded-2xl shadow-sm">
                                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                    <ShoppingCart className="w-5 h-5 text-orange-500" />
                                    Selected Variant
                                </h3>
                                <div className="flex items-center gap-3 mb-2">
                                    {selectedVariant.stock > 0 ? (
                                        <CheckCircle2 className="text-green-600 w-5 h-5" />
                                    ) : (
                                        <XCircle className="text-red-500 w-5 h-5" />
                                    )}
                                    <span className="text-gray-800 font-semibold text-lg">
                                        ₹{selectedVariant.sp}
                                    </span>
                                    {selectedVariant.mrp && (
                                        <span className="text-gray-400 line-through text-sm">
                                            ₹{selectedVariant.mrp}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-600">
                                    Stock: <span className="font-medium">{selectedVariant.stock}</span>
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                    SKU: <span className="font-medium">{selectedVariant.sku}</span>
                                </p>

                                {/* Quantity Selector */}
                                <div className="flex items-center gap-4 mt-4">
                                    <span className="text-gray-700 font-medium">Quantity:</span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={decreaseQuantity}
                                            disabled={quantity <= 1}
                                            className="w-8 h-8 rounded-md bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200"
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <span className="w-8 text-center font-medium">{quantity}</span>
                                        <button
                                            onClick={increaseQuantity}
                                            disabled={!selectedVariant || quantity >= selectedVariant.stock}
                                            className="w-8 h-8 rounded-md bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3 mt-4">
                                    {/* Add to Cart / View Cart Button */}
                                    <button
                                        onClick={isInCart ? handleViewCart : handleAddToCart}
                                        disabled={selectedVariant.stock === 0 || addingToCart || cartLoading || !selectedVariant}
                                        className={`flex-1 px-6 py-3 ${isInCart ? 'bg-blue-500 hover:bg-blue-600' : 'bg-orange-500 hover:bg-orange-600'} text-white font-semibold rounded-lg shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2`}
                                    >
                                        {addingToCart || cartLoading ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                Adding...
                                            </>
                                        ) : isInCart ? (
                                            <>
                                                <ShoppingCart className="w-5 h-5" />
                                                View Cart
                                            </>
                                        ) : selectedVariant.stock > 0 ? (
                                            <>
                                                <ShoppingCart className="w-5 h-5" />
                                                Add to Cart
                                            </>
                                        ) : (
                                            "Out of Stock"
                                        )}
                                    </button>

                                    {/* Buy Now Button */}
                                    <button
                                        onClick={() => {
                                            if (user && selectedVariant && selectedVariant.stock > 0) {
                                                router.push(`/checkout/single?productId=${product.id}&variantId=${selectedVariant.id}&quantity=${quantity}`);
                                            }
                                        }}
                                        disabled={selectedVariant?.stock === 0 || !selectedVariant || !user}
                                        className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
                                    >
                                        {selectedVariant?.stock === 0 ? (
                                            "Out of Stock"
                                        ) : !user ? (
                                            "Login to Buy"
                                        ) : (
                                            <>
                                                <ShoppingBag className="w-5 h-5" />
                                                Buy Now
                                            </>
                                        )}
                                    </button>
                                </div>

                                {!user && (
                                    <p className="text-xs text-gray-600 text-center mt-2">
                                        <button
                                            onClick={() => router.push('/login')}
                                            className="text-orange-500 hover:text-orange-600 font-semibold underline"
                                        >
                                            Login
                                        </button>
                                        {" "}to add items to cart
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Product Description Section */}
                        {product.description && (
                            <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm">
                                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                    <Package className="w-5 h-5 text-orange-500" />
                                    Product Description
                                </h3>
                                <div
                                    className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
                                    dangerouslySetInnerHTML={{ __html: product.description }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-10">
                {details.length > 0 && (
                    <div className="mb-8 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                        <button
                            onClick={() => setIsSpecsOpen(!isSpecsOpen)}
                            className="w-full flex items-center justify-between p-5 text-left"
                        >
                            <div className="flex items-center gap-2">
                                <Settings2 className="w-5 h-5 text-blue-600" />
                                <h2 className="text-xl font-semibold text-gray-800">Specifications</h2>
                            </div>
                            <ChevronDown
                                className={`w-5 h-5 text-gray-600 transition-transform duration-300 ${isSpecsOpen ? "rotate-180" : ""
                                    }`}
                            />
                        </button>

                        <div
                            className={`overflow-hidden transition-all duration-500 ease-in-out ${isSpecsOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
                                }`}
                        >
                            <div className="overflow-hidden rounded-b-2xl border-t border-gray-100">
                                <table className="min-w-full text-sm text-gray-700">
                                    <tbody>
                                        {details.map((d: any, idx: number) => (
                                            <tr
                                                key={idx}
                                                className={`border-t border-gray-100 hover:bg-gray-50 transition-all ${idx % 2 === 0 ? "bg-gray-50/40" : "bg-white"
                                                    }`}
                                            >
                                                <td className="p-3 font-semibold w-1/3 text-gray-800">{formatSpecificationKey(d.key)}</td>
                                                <td className="p-3">{d.value}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Write Review Section */}
                <div className="mt-8 bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            {(liveRatingSummary || product.rating_summary) && (
                                <div className="flex items-center gap-3">
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-gray-900">
                                            {((liveRatingSummary || product.rating_summary)?.average_rating || 0).toFixed(1)}
                                        </div>
                                        <div className="flex items-center justify-center gap-1 text-yellow-500 text-sm">
                                            {Array.from({ length: 5 }, (_, i) => (
                                                <span key={i}>
                                                    {i < Math.round((liveRatingSummary || product.rating_summary)?.average_rating || 0) ? '★' : '☆'}
                                                </span>
                                            ))}
                                        </div>
                                        <p className="text-xs text-gray-600 mt-1">
                                            {((liveRatingSummary || product.rating_summary)?.total_reviews || 0).toLocaleString()} ratings
                                        </p>
                                    </div>
                                </div>
                            )}
                            <div className="h-12 w-px bg-orange-300"></div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Rate this product</h3>
                                <p className="text-sm text-gray-600">Share your thoughts with other customers</p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                if (!user) {
                                    router.push('/login');
                                    return;
                                }
                                // Open review modal - will be handled by ProductReviews component
                                window.dispatchEvent(new CustomEvent('openReviewModal'));
                            }}
                            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg flex items-center gap-2 whitespace-nowrap"
                        >
                            <Plus className="w-5 h-5" />
                            Write a Review
                        </button>
                    </div>
                </div>

                {/* Similar Products Section */}
                {similarProducts.length > 0 && (
                    <div className="mt-12">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <Layers3 className="w-6 h-6 text-orange-500" />
                                Similar Products
                            </h2>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {similarProducts.map((prod) => {
                                const lowestPrice = prod.variants && prod.variants.length > 0
                                    ? Math.min(...prod.variants.map(v => Number(v.sp)))
                                    : 0;
                                const highestMRP = prod.variants && prod.variants.length > 0
                                    ? Math.max(...prod.variants.filter(v => v.mrp).map(v => Number(v.mrp)))
                                    : 0;
                                const discount = highestMRP > lowestPrice
                                    ? Math.round(((highestMRP - lowestPrice) / highestMRP) * 100)
                                    : 0;

                                return (
                                    <div
                                        key={prod.id}
                                        onClick={() => router.push(`/products/${prod.id}`)}
                                        className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group"
                                    >
                                        <div className="relative aspect-square overflow-hidden bg-gray-50">
                                            <Image
                                                src={prod.image_url || imgPlaceholder.src}
                                                alt={prod.name}
                                                unoptimized
                                                fill
                                                className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                                            />
                                            {/* {discount > 0 && (
                                                <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                                                    {discount}% OFF
                                                </div>
                                            )} */}
                                        </div>
                                        <div className="p-3">
                                            <h3 className="font-medium text-sm text-gray-800 line-clamp-2 mb-2 group-hover:text-orange-600 transition-colors min-h-[40px]">
                                                {prod.name}
                                            </h3>

                                            {/* Brand */}
                                            {prod.brand && (
                                                <p className="text-xs text-gray-500 mb-1">{prod.brand.name}</p>
                                            )}

                                            {/* Rating */}
                                            {/* {prod.rating_summary && prod.rating_summary.total_reviews > 0 ? (
                                                <div className="flex items-center gap-1 mb-2">
                                                    <div className="flex items-center gap-1 bg-green-600 text-white text-xs font-semibold px-1.5 py-0.5 rounded">
                                                        <span>{prod.rating_summary.average_rating.toFixed(1)}</span>
                                                        <span>★</span>
                                                    </div>
                                                    <span className="text-xs text-gray-500">({prod.rating_summary.total_reviews.toLocaleString()})</span>
                                                </div>
                                            ) : (
                                                <div className="h-5 mb-2"></div>
                                            )} */}

                                            {/* Price */}
                                            <div className="flex items-baseline gap-2 flex-wrap">
                                                <span className="text-orange-600 font-bold text-lg">
                                                    ₹{lowestPrice.toLocaleString()}
                                                </span>
                                                {highestMRP > lowestPrice && (
                                                    <span className="text-gray-400 text-sm line-through">
                                                        ₹{highestMRP.toLocaleString()}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Category */}
                                            {prod.category && (
                                                <p className="text-xs text-gray-400 mt-1 truncate">{prod.category.name}</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {loadingSimilar && (
                            <div className="text-center py-8">
                                <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto"></div>
                            </div>
                        )}

                        {/* Load More Similar Products Button */}
                        {similarPagination.has_more && (
                            <div className="text-center mt-8">
                                <button
                                    onClick={loadMoreSimilarProducts}
                                    disabled={loadingSimilar}
                                    className="px-6 py-2.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg font-medium transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loadingSimilar ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                            Loading...
                                        </div>
                                    ) : (
                                        `Load More Products`
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Reviews Section - Below Similar Products */}
                <div className="mt-12">
                    <ProductReviews
                        productId={product.id}
                        onRatingUpdate={() => {
                            fetchLiveRatingSummary(true);
                            window.dispatchEvent(new CustomEvent('reviewUpdated', { detail: { productId: product.id } }));
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default ProductPage;
