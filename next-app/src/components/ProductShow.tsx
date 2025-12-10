"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import imgPlaceholder from "@/public/imagePlaceholder.png";
import { ProductDetail } from "@/common/interface";
import { useLoader } from "@/context/LoaderContext";
import { getSubcategoryProducts } from "../../utils/product";

type ProductShowProps = {
    subcategoryId: number;
    subcategoryName?: string;
};

const ProductShowComponent: React.FC<ProductShowProps> = ({ subcategoryId, subcategoryName }) => {
    const [products, setProducts] = useState<ProductDetail[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const router = useRouter();
    const { showLoader, hideLoader } = useLoader();

    const baseUrl =
        process.env.NEXT_PUBLIC_UPLOAD_BASE || "https://api.zelton.co.in";


    useEffect(() => {
        if (subcategoryId) {
            fetchProducts(subcategoryId);
        }
    }, [subcategoryId]);

    const fetchProducts = async (id: number) => {
        setLoading(true);
        // showLoader();
        try {
            const data = await getSubcategoryProducts(id);
            setProducts(data.products || []);
            setErrorMessage(null);
        } catch (err) {
            console.error("Error fetching products:", err);
            setErrorMessage("Failed to load products");
        } finally {
            hideLoader();
            setLoading(false);
        }
    };

    const handleViewDetails = (id: number) => {
        router.push(`/products/${id}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen from-gray-50 to-white">
                <div className="container mx-auto px-4 py-16">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading products...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (errorMessage) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
                <div className="container mx-auto px-4 py-16">
                    <div className="text-center">
                        <div className="w-24 h-24 text-red-400 mx-auto mb-6">
                            <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Products</h3>
                        <p className="text-gray-600 mb-8">{errorMessage}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-8 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold rounded-full hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!products.length) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
                <div className="container mx-auto px-4 py-16">
                    <div className="text-center">
                        <div className="w-24 h-24 text-gray-400 mx-auto mb-6">
                            <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">No Products Found</h3>
                        <p className="text-gray-600 mb-8">No products available for this subcategory at the moment</p>
                        <button
                            onClick={() => window.history.back()}
                            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-full hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                        >
                            Browse Other Categories
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-10">
            <h2 className="text-xl font-semibold mb-6 text-center">{subcategoryName} Products</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {products.map((prod) => {
                    const price = prod.variants?.[0]?.sp;

                    return (
                        <div
                            key={prod.id}
                            className="bg-white shadow-md rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                        >
                            <div onClick={() => handleViewDetails(prod.id)} className="aspect-square relative cursor-pointer" >
                                <Image
                                    src={
                                        prod.image_url
                                            ? `${baseUrl}${prod.image_url}`
                                            : imgPlaceholder.src
                                    }
                                    alt={prod.name}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                            </div>

                            <div className="p-3">
                                <h3 className="text-sm font-medium text-gray-800 line-clamp-2">
                                    {prod.name}
                                </h3>
                                {prod.description && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        {prod.description.replace(/<[^>]+>/g, "").slice(0, 50)}...
                                    </p>
                                )}
                                {price && (
                                    <p className="text-sm font-semibold mt-1">₹{price}</p>
                                )}

                                <div className="flex justify-between gap-3 mt-3">
                                    <button
                                        onClick={() => handleViewDetails(prod.id)}
                                        className="w-full bg-pink-600 text-white text-sm font-medium py-2 rounded hover:bg-pink-700"
                                    >
                                        View Details
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ProductShowComponent;
