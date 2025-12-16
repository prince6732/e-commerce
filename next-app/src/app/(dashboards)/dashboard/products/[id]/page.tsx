"use client";

import Modal from "@/components/(sheared)/Modal";
import { useLoader } from "@/context/LoaderContext";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { getProductDetails, deleteVariant } from "../../../../../../utils/product";
import { FaArrowLeft } from "react-icons/fa";
import { Trash2 } from "lucide-react";

const basePath: string =
    `${process.env.NEXT_PUBLIC_UPLOAD_BASE}` || "https://api.zelton.co.in";

export default function ProductDetails() {
    const [product, setProduct] = useState<any>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedVariant, setSelectedVariant] = useState<any | null>(null);
    const { showLoader, hideLoader } = useLoader();
    const params = useParams();
    const productId = params.id as string;
    const router = useRouter();

    useEffect(() => {
        fetchProductDetails();
    }, [productId]);

    useEffect(() => {
        if (successMessage || errorMessage) {
            const timer = setTimeout(() => {
                setSuccessMessage(null);
                setErrorMessage(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [successMessage, errorMessage]);

    const fetchProductDetails = async () => {
        showLoader();
        try {
            const response = await getProductDetails(productId);
            if (response.success && response.result) {
                setProduct(response.result);
            } else {
                setErrorMessage("Failed to load product details");
            }
        } catch (err) {
            console.error(err);
            setErrorMessage("Failed to load product details");
        } finally {
            hideLoader();
        }
    };

    const handleDeleteVariant = async () => {
        if (!selectedVariant) return;
        showLoader();
        try {
            const response = await deleteVariant(selectedVariant.id);
            if (response.success) {
                setSuccessMessage("Variant deleted successfully");
                setIsDeleteModalOpen(false);
                setSelectedVariant(null);
                fetchProductDetails();
            } else {
                setErrorMessage(response.message || "Failed to delete variant");
            }
        } catch (err) {
            console.error(err);
            setErrorMessage("Failed to delete variant");
        } finally {
            hideLoader();
        }
    };

    const openDeleteModal = (variant: any) => {
        setSelectedVariant(variant);
        setIsDeleteModalOpen(true);
    };

    if (!product) {
        return <div className="p-6">Loading...</div>;
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="p-5 bg-white/70 backdrop-blur border border-gray-200 rounded-2xl shadow-lg mb-5">
                <div className="flex items-center justify-between">
                    <h2 className="lg:text-3xl text-xl font-bold px-5 text-gray-900 tracking-tight">
                        Product Details
                    </h2>
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
                    >
                        <FaArrowLeft className="text-lg" />
                        <span className="font-medium">Back</span>
                    </button>
                </div>
            </div>

            {/* Success/Error Toast */}
            {(successMessage || errorMessage) && (
                <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-lg shadow-lg font-semibold ${
                    successMessage ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}>
                    {successMessage || errorMessage}
                </div>
            )}

            {/* Product Information */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Product Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-4">
                        {product.image_url && (
                            <div>
                                <img
                                    src={`${basePath}${product.image_url}`}
                                    alt={product.name}
                                    className="w-full max-w-md h-64 object-cover rounded-xl border border-gray-200 shadow-sm"
                                />
                            </div>
                        )}
                    </div>

                    {/* Right Column */}
                    <div className="space-y-3">
                        <div>
                            <label className="text-sm font-semibold text-gray-600">Name</label>
                            <p className="text-lg font-medium text-gray-900">{product.name}</p>
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-gray-600">Item Code</label>
                            <p className="text-gray-900">{product.item_code || '-'}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-semibold text-gray-600">Category</label>
                                <p className="text-gray-900">{product.category?.name || '-'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-gray-600">Brand</label>
                                <p className="text-gray-900">{product.brand?.name || '-'}</p>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-gray-600">Status</label>
                            <p>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    product.status ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                }`}>
                                    {product.status ? "Active" : "Inactive"}
                                </span>
                            </p>
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-gray-600">Description</label>
                            <div 
                                className="text-gray-700 prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={{ __html: product.description || 'No description' }}
                            />
                        </div>
                    </div>
                </div>

                {/* Product Features */}
                {product.feature_json && JSON.parse(product.feature_json).length > 0 && (
                    <div className="mt-6">
                        <label className="text-sm font-semibold text-gray-600">Features</label>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                            {JSON.parse(product.feature_json).map((feature: string, index: number) => (
                                <li key={index} className="text-gray-700">{feature}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Product Variants */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                    Product Variants ({product.variants?.length || 0})
                </h3>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px] text-sm text-left">
                        <thead className="uppercase text-xs font-semibold text-gray-700 bg-gray-50">
                            <tr>
                                <th className="px-4 py-3">S.No.</th>
                                <th className="px-4 py-3">Image</th>
                                <th className="px-4 py-3">Title</th>
                                <th className="px-4 py-3">SKU</th>
                                <th className="px-4 py-3">Attributes</th>
                                <th className="px-4 py-3">MRP</th>
                                <th className="px-4 py-3">Selling Price</th>
                                <th className="px-4 py-3">Base Price</th>
                                <th className="px-4 py-3">Stock</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {product.variants && product.variants.length > 0 ? (
                                product.variants.map((variant: any, index: number) => (
                                    <tr key={variant.id} className="hover:bg-gray-50 transition">
                                        <td className="px-4 py-3">{index + 1}</td>
                                        
                                        <td className="px-4 py-3">
                                            {variant.image_url ? (
                                                <img
                                                    src={`${basePath}${variant.image_url}`}
                                                    alt={variant.title}
                                                    className="w-12 h-12 object-cover rounded-lg border"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                                    <span className="text-xs text-gray-400">No Img</span>
                                                </div>
                                            )}
                                        </td>

                                        <td className="px-4 py-3 font-medium">{variant.title || '-'}</td>
                                        <td className="px-4 py-3">{variant.sku}</td>

                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-1">
                                                {variant.attribute_values?.map((av: any) => (
                                                    <span 
                                                        key={av.id}
                                                        className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs"
                                                        title={av.attribute?.name}
                                                    >
                                                        {av.value}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>

                                        <td className="px-4 py-3">₹{variant.mrp}</td>
                                        <td className="px-4 py-3 font-semibold text-green-600">₹{variant.sp}</td>
                                        <td className="px-4 py-3">₹{variant.bp}</td>

                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                variant.stock > 10 
                                                    ? "bg-green-100 text-green-700" 
                                                    : variant.stock > 0 
                                                    ? "bg-yellow-100 text-yellow-700"
                                                    : "bg-red-100 text-red-700"
                                            }`}>
                                                {variant.stock}
                                            </span>
                                        </td>

                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                variant.status ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                            }`}>
                                                {variant.status ? "Active" : "Inactive"}
                                            </span>
                                        </td>

                                        <td className="px-4 py-3 text-center">
                                            <button
                                                title="Delete Variant"
                                                onClick={() => openDeleteModal(variant)}
                                                className="inline-flex items-center justify-center size-9 bg-red-100 hover:bg-red-200 text-red-600 rounded-full transition"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={11} className="text-center text-gray-400 py-8 italic">
                                        No Variants Found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Delete Variant Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setSelectedVariant(null);
                }}
                title="Delete Variant"
            >
                <div className="p-4">
                    <p className="text-gray-700 mb-4">
                        Are you sure you want to delete variant <strong>{selectedVariant?.sku}</strong>? 
                        This action cannot be undone.
                    </p>
                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={() => {
                                setIsDeleteModalOpen(false);
                                setSelectedVariant(null);
                            }}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDeleteVariant}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
