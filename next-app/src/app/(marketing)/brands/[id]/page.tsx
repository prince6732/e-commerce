"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowLeft, Package, Loader2 } from "lucide-react";
import { getBrandById } from "../../../../../utils/brand";
import { Brand } from "@/common/interface";

const basePath = process.env.NEXT_PUBLIC_UPLOAD_BASE || "https://api.zelton.co.in";

export default function BrandDetailPage() {
    const params = useParams();
    const router = useRouter();
    const brandId = params.id as string;

    const [brand, setBrand] = useState<Brand | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchBrandDetails = async () => {
            try {
                setLoading(true);
                const data = await getBrandById(brandId);
                setBrand(data);
            } catch (err: any) {
                console.error("Error fetching brand:", err);
                setError(err.message || "Failed to load brand details");
            } finally {
                setLoading(false);
            }
        };

        if (brandId) {
            fetchBrandDetails();
        }
    }, [brandId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading brand details...</p>
                </div>
            </div>
        );
    }

    if (error || !brand) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Brand Not Found</h1>
                    <p className="text-gray-600 mb-6">{error || "The brand you're looking for doesn't exist."}</p>
                    <button
                        onClick={() => router.push("/")}
                        className="px-6 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-xl hover:from-orange-600 hover:to-yellow-600 transition-all duration-300 font-medium"
                    >
                        Go to Home
                    </button>
                </div>
            </div>
        );
    }

    const sections = [
        {
            image: brand.image1,
            description: brand.description1,
            layout: "image-left",
        },
        {
            image: brand.image2,
            description: brand.description2,
            layout: "image-right",
        },
        {
            image: brand.image3,
            description: brand.description3,
            layout: "image-left",
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-xl hover:from-orange-600 hover:to-yellow-600 transition-all duration-300"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span className="hidden sm:inline">Back</span>
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{brand.name}</h1>
                            <div
                                className="text-gray-700 leading-relaxed space-y-4"
                                dangerouslySetInnerHTML={{ __html: brand.description ?? "" }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Brand Sections */}
            <div className="container mx-auto px-4 py-12">
                <div className="space-y-16">
                    {sections.map((section, index) => {
                        // Skip sections without both image and description
                        if (!section.image || !section.description) return null;

                        const imageUrl = `${basePath}${section.image}`;

                        return (
                            <div
                                key={index}
                                className={`flex flex-col ${section.layout === "image-right"
                                    ? "lg:flex-row-reverse"
                                    : "lg:flex-row"
                                    } gap-8 lg:gap-12 items-center`}
                            >
                                {/* Image */}
                                <div className="w-full lg:w-1/2">
                                    <div className="relative rounded-2xl overflow-hidden shadow-2xl group">
                                        <div className="aspect-[4/3] relative">
                                            <Image
                                                src={imageUrl}
                                                alt={`${brand.name} - Section ${index + 1}`}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                unoptimized
                                            />
                                        </div>
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="w-full lg:w-1/2">
                                    <div className="space-y-6">

                                        <div className="prose prose-lg max-w-none">
                                            <div
                                                className="text-gray-700 leading-relaxed space-y-4"
                                                dangerouslySetInnerHTML={{ __html: section.description }}
                                            />
                                        </div>

                                        {/* Decorative element */}
                                        <div className="flex items-center gap-2 pt-4">
                                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Empty State if no sections */}
                {sections.every((s) => !s.image || !s.description) && (
                    <div className="text-center py-16">
                        <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            No additional information available
                        </h3>
                        <p className="text-gray-600">
                            Brand details will be updated soon.
                        </p>
                    </div>
                )}

                {/* Call to Action */}
                <div className="mt-16 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-2xl p-8 lg:p-12 text-center text-white shadow-xl">
                    <h2 className="text-3xl font-bold mb-4">Explore {brand.name} Products</h2>
                    <p className="text-white/90 mb-6 max-w-2xl mx-auto">
                        Discover our complete range of {brand.name} products and find the perfect items for your needs.
                    </p>
                    <button
                        onClick={() => router.push(`/products?brand=${brand.id}`)}
                        className="px-8 py-4 bg-white text-orange-600 rounded-xl hover:bg-gray-100 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                        Shop Now
                    </button>
                </div>
            </div>
        </div>
    );
}
