"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Product, ApiResponse } from "@/common/interface";
import { getProductById } from "../../../../../../../../../utils/product";

const basePath: string =
    process.env.NEXT_PUBLIC_UPLOAD_BASE || "https://api.zelton.co.in";

export default function ProductDetailPage() {
    const params = useParams();
    const { productId } = params;
    const [product, setProduct] = useState<Product | null>(null);
    const router = useRouter();
    const [activeVariantImage, setActiveVariantImage] = useState<{
        [key: number]: string | null;
    }>({});

    useEffect(() => {
        if (!productId) return;
        fetchProduct();
    }, [productId]);

    const fetchProduct = async () => {
        try {
            const data: ApiResponse<Product> = await getProductById(
                productId!.toString()
            );
            if (data.success && data.result) {
                const parsedProduct: Product = {
                    ...data.result,
                    featureList: data.result.feature_json
                        ? JSON.parse(data.result.feature_json)
                        : [],
                    detailList: data.result.detail_json
                        ? JSON.parse(data.result.detail_json)
                        : [],
                    itemCode: data.result.item_code,
                    imageUrl: data.result.image_url,
                    imageJson: data.result.image_json
                        ? JSON.parse(data.result.image_json)
                        : [],
                };
                setProduct(parsedProduct);
            } else {
                console.error(data.message);
            }
        } catch (err) {
            console.error("Failed to fetch product:", err);
        }
    };

    if (!product) {
        return (
            <div className="text-center mt-20 text-gray-500">Loading product...</div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto mt-10 bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-2xl border border-gray-200/60 p-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-10 border-b border-gray-100 pb-5">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full shadow-sm transition-all duration-200 font-medium"
                >
                    <span className="font-bold text-lg">&larr;</span> Back
                </button>
                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                    Product Details
                </h2>
            </div>

            {/* Product Overview */}
            <div className="flex flex-col md:flex-row gap-10 items-start mb-10">
                {/* Main Image */}
                <div className="w-60 h-60 border border-gray-200 rounded-2xl overflow-hidden shadow-md bg-gray-50 flex items-center justify-center hover:shadow-lg transition-all duration-300">
                    <img
                        src={
                            product.imageUrl
                                ? `${basePath}${product.imageUrl}`
                                : "/placeholder.svg"
                        }
                        alt={product.name}
                        className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                    />
                </div>

                {/* Product Info */}
                <div className="flex-1 space-y-5">
                    <h2 className="text-4xl font-bold text-gray-900">{product.name}</h2>
                    <div className="flex flex-wrap gap-3">
                        <div className="px-4 py-1.5 rounded-full bg-gray-100 text-gray-700 font-medium text-sm shadow-sm">
                            <span className="font-semibold">Item Code:</span>{" "}
                            {product.itemCode || "N/A"}
                        </div>
                        <div
                            className={`px-4 py-1.5 rounded-full font-semibold text-sm shadow-sm ${product.status
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                                }`}
                        >
                            {product.status ? "Active" : "Inactive"}
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-1">
                            Description
                        </h3>
                        <div
                            className="text-gray-700 bg-white rounded-xl p-4 border border-gray-100 shadow-sm leading-relaxed"
                            dangerouslySetInnerHTML={{
                                __html: product.description || "<p>No Description</p>",
                            }}
                        />
                    </div>

                    {/* Additional Images */}
                    {product.imageJson && product.imageJson.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                More Images
                            </h3>
                            <div className="flex flex-wrap gap-3">
                                {product.imageJson.map((img: string, idx: number) => (
                                    <div
                                        key={idx}
                                        className="w-24 h-24 border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-transform duration-300 hover:scale-105"
                                    >
                                        <img
                                            src={`${basePath}${img}`}
                                            alt={`${product.name} ${idx + 1}`}
                                            className="object-cover w-full h-full"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Features */}
            <div className="mb-10">
                <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="w-2 h-6 bg-indigo-500 rounded-full"></span> Features
                </h3>
                <div className="flex flex-wrap gap-3">
                    {(product.featureList ?? []).length > 0 ? (
                        product.featureList?.map((feature: string, idx: number) => (
                            <div
                                key={idx}
                                className="px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 font-semibold shadow-sm text-sm border border-indigo-100"
                            >
                                {feature}
                            </div>
                        ))
                    ) : (
                        <div className="text-gray-400 italic">No features available.</div>
                    )}
                </div>
            </div>

            {/* Details */}
            <div className="mb-10">
                <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="w-2 h-6 bg-blue-500 rounded-full"></span> Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {(product.detailList ?? []).length > 0 ? (
                        product.detailList?.map((detail, idx) => (
                            <div
                                key={idx}
                                className="p-5 rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all duration-200 flex flex-col gap-2"
                            >
                                <div className="font-semibold text-gray-700">{detail.key}</div>
                                <div className="text-gray-600">{detail.value}</div>
                            </div>
                        ))
                    ) : (
                        <div className="text-gray-400 italic">No details available.</div>
                    )}
                </div>
            </div>

            {/* Variants */}
            <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <span className="w-2 h-6 bg-emerald-500 rounded-full"></span> Variants
                </h3>

                {product.variants && product.variants.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {product.variants.map((variant, idx) => {
                            const variantImages: string[] = variant.image_json
                                ? JSON.parse(variant.image_json)
                                : [];

                            const currentImage =
                                activeVariantImage[idx] || variant.image_url || null;

                            return (
                                <div
                                    key={idx}
                                    className="group bg-white border border-gray-100 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
                                >
                                    {/* Main Image */}
                                    {variant.image_url && (
                                        <div className="relative w-full h-48 bg-gray-50 overflow-hidden border-b border-gray-100">
                                            <img
                                                src={
                                                    currentImage
                                                        ? `${basePath}${currentImage}`
                                                        : "/placeholder.svg"
                                                }
                                                alt="Variant"
                                                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                                            />
                                            <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-md text-xs font-medium px-3 py-1 rounded-full shadow-sm">
                                                #{idx + 1}
                                            </span>
                                        </div>)}

                                    {/* Variant Info */}
                                    <div className="p-5 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="text-gray-900 font-semibold text-lg">
                                                {variant.sku}
                                            </div>
                                            <div
                                                className={`px-3 py-1 text-xs font-medium rounded-full ${variant.status
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-red-100 text-red-700"
                                                    }`}
                                            >
                                                {variant.status  ? "Active" : "Inactive"}
                                            </div>
                                        </div>

                                        {/* Price Info */}
                                        <div className="flex flex-wrap gap-4 text-sm text-gray-700">
                                            <span>
                                                <strong>MRP:</strong> ₹{variant.mrp}
                                            </span>
                                            <span>
                                                <strong>SP:</strong>{" "}
                                                <span className="text-green-700 font-semibold">
                                                    ₹{variant.sp}
                                                </span>
                                            </span>
                                            <span>
                                                <strong>BP:</strong>{" "}
                                                <span className="text-blue-700 font-semibold">
                                                    ₹{variant.bp}
                                                </span>
                                            </span>
                                            <span>
                                                <strong>Stock:</strong>{" "}
                                                <span
                                                    className={`font-medium ${variant.stock > 0
                                                        ? "text-gray-800"
                                                        : "text-red-600"
                                                        }`}
                                                >
                                                    {variant.stock}
                                                </span>
                                            </span>
                                        </div>

                                        {/* Extra Images */}
                                        {variantImages.length > 0 && (
                                            <div className="mt-3 flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300">
                                                {variantImages.map((img, i) => (
                                                    <div
                                                        key={i}
                                                        className={`w-16 h-16 flex-shrink-0 border rounded-xl overflow-hidden cursor-pointer transition-transform duration-200 ${activeVariantImage[idx] === img
                                                            ? "ring-2 ring-emerald-500"
                                                            : "hover:scale-105 border-gray-200"
                                                            }`}
                                                        onClick={() =>
                                                            setActiveVariantImage((prev) => ({
                                                                ...prev,
                                                                [idx]: img,
                                                            }))
                                                        }
                                                    >
                                                        <img
                                                            src={`${basePath}${img}`}
                                                            alt={`Variant ${i + 1}`}
                                                            className="object-cover w-full h-full"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-gray-400 italic text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        No variants available.
                    </div>
                )}
            </div>
        </div>
    );
}
