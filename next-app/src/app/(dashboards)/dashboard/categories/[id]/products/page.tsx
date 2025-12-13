"use client";

import { Category, Product } from "@/common/interface";
import Modal from "@/components/(sheared)/Modal";
import { useLoader } from "@/context/LoaderContext";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { FaArrowLeft, FaPlus } from "react-icons/fa";
import { getCategoryById } from "../../../../../../../utils/category";
import { getSubcategoryProducts } from "../../../../../../../utils/product";
import { TiInfoLargeOutline } from "react-icons/ti";

const basePath: string =
    `${process.env.NEXT_PUBLIC_UPLOAD_BASE}` || "https://api.zelton.co.in";

export default function Products() {
    const [category, setCategory] = useState<Category | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const { showLoader, hideLoader } = useLoader();
    const params = useParams();
    const categoryId = Number(params.id);
    const router = useRouter();

    useEffect(() => {
        if (!categoryId) return;
        fetchCategory();
        fetchProducts();
    }, [categoryId]);

    const fetchCategory = async () => {
        showLoader();
        try {
            const data = await getCategoryById(categoryId);
            setCategory(data.result!);
        } catch (err) {
            console.error(err);
            setErrorMessage("Failed to load category");
        } finally {
            hideLoader();
        }
    };

    const fetchProducts = async () => {
        if (!categoryId) return;
        showLoader();
        try {
            const data = await getSubcategoryProducts(categoryId);
            setProducts(data.products || []);
        } catch (err) {
            console.error(err);
            setErrorMessage("Failed to load products");
        } finally {
            hideLoader();
        }
    };

    const addProduct = () => {
        if (category?.attributes && category?.attributes?.length > 0) {
            if (category?.attributes?.length === 1) {
                router.push(`/dashboard/categories/${categoryId}/products/add-single-attribute-product`);
            } else {
                router.push(`/dashboard/categories/${categoryId}/products/add-multi-variant`);
            }
        } else {
            router.push(`/dashboard/categories/${categoryId}/products/add-single-variant`);
        }
    };

    const openDescriptionModal = (product: Product) => {
        setSelectedProduct(product);
        setIsDescriptionModalOpen(true);
    };

    const goToProductDetail = (product: Product) => {
        router.push(`/dashboard/categories/${categoryId}/products/${product.id}/detail`);
    };

    return (
        <div>
            <div>

                <div className="p-5 bg-white/70 backdrop-blur border border-gray-200 rounded-2xl shadow-lg mb-5">
                    <div className="flex items-center justify-between">

                        {/* Title */}
                        <h2 className="lg:text-3xl text-xl font-bold px-5 text-gray-900 tracking-tight">
                            {category?.name} - Products
                        </h2>

                        {/* Buttons */}
                        <div className="flex gap-3">

                            {/* Back Button */}
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="flex items-center gap-2 px-4 py-2 
                bg-gray-100 hover:bg-gray-200 
                text-gray-700 rounded-xl shadow-sm 
                hover:shadow-md transition-all duration-200"
                            >
                                <FaArrowLeft className="text-lg" />
                                <span className="font-medium">Back</span>
                            </button>

                            {/* Create Value Button */}
                            <button
                                onClick={addProduct}
                                className="flex items-center gap-2 px-6 py-3 
                bg-gradient-to-r from-orange-400 to-yellow-400 
                hover:from-orange-500 hover:to-yellow-500 
                rounded-xl shadow-md text-white font-semibold 
                hover:shadow-lg transition-all duration-200"
                            >
                                + Add Products
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-100 sm:p-6">
                    <div className="overflow-x-auto scrollbar rounded-2xl shadow border border-gray-300/30 bg-transparent">
                        <table className="w-full min-w-[800px] text-sm text-left">

                            {/* Table Header */}
                            <thead className="uppercase text-xs font-semibold text-gray-700 bg-white/40 backdrop-blur">
                                <tr>
                                    <th className="px-6 py-4">S.No.</th>
                                    <th className="px-6 py-4">Image</th>
                                    <th className="px-6 py-4">Name</th>
                                    <th className="px-6 py-4">Item Code</th>
                                    <th className="px-6 py-4">Description</th>
                                    <th className="px-6 py-4">Actions</th>
                                    <th className="px-6 py-4">Status</th>
                                </tr>
                            </thead>

                            {/* Table Body */}
                            <tbody className="divide-y divide-gray-300/30 text-gray-700">
                                {products.length ? (
                                    products.map((product, index) => (
                                        <tr
                                            key={product.id}
                                            className="bg-white/5 hover:bg-white/10 transition"
                                        >
                                            <td className="px-6 py-4">{index + 1}</td>

                                            {/* Image */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-300/40 shadow-sm">
                                                        <img
                                                            src={
                                                                product.image_url
                                                                    ? `${basePath}${product.image_url}`
                                                                    : "/placeholder.svg"
                                                            }
                                                            className="object-cover w-full h-full"
                                                            alt={product.name}
                                                        />
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Name */}
                                            <td className="px-6 py-4 font-medium">{product.name}</td>

                                            {/* Item Code */}
                                            <td className="px-6 py-4">{product.item_code}</td>

                                            {/* Description Button */}
                                            <td className="px-6 py-4">
                                                <button
                                                    className="px-3 py-2 text-xs rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 font-semibold transition"
                                                    onClick={() => openDescriptionModal(product)}
                                                >
                                                    View Description
                                                </button>
                                            </td>

                                            {/* Status */}
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`px-3 py-2 rounded-md text-xs font-medium ${product.status
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-red-100 text-red-700"
                                                        }`}
                                                >
                                                    {product.status ? "Active" : "Inactive"}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-6 py-4">
                                                <button
                                                    title="View Product Details"
                                                    onClick={() => goToProductDetail(product)}
                                                    className="size-10 bg-gc-300/30 hover:bg-orange-400 flex justify-center items-center rounded-full"
                                                >
                                                    <TiInfoLargeOutline className="h-4 w-4" />
                                                </button>
                                            </td>

                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="text-center text-zinc-400 py-8 italic"
                                        >
                                            No Products Found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            {/* Description Modal */}
            <Modal
                isOpen={isDescriptionModalOpen}
                onClose={() => {
                    setIsDescriptionModalOpen(false);
                    setSelectedProduct(null);
                }}
                title="Product Description"
            >
                <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        {selectedProduct?.name}
                    </h3>
                    <div
                        className="text-gray-700"
                        dangerouslySetInnerHTML={{
                            __html:
                                selectedProduct?.description || "<p>No Description</p>",
                        }}
                    />
                </div>
            </Modal>
        </div>
    );
}
