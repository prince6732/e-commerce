"use client";

import { Category, Product } from "@/common/interface";
import Modal from "@/components/(sheared)/Modal";
import { useLoader } from "@/context/LoaderContext";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { FaArrowLeft, FaPlus } from "react-icons/fa";
import { getCategoryById } from "../../../../../../../utils/category";
import { getSubcategoryProducts } from "../../../../../../../utils/product";

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
            <div className="rounded-2xl border border-gray-200 bg-white shadow-lg mb-4">
                <div className="flex justify-between items-center px-6 py-5">
                    <h3 className="text-xl font-semibold text-gray-800">
                        {category?.name} - Products
                    </h3>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full shadow transition"
                        >
                            <FaArrowLeft className="w-5 h-5" />
                            Back
                        </button>
                        <button
                            onClick={addProduct}
                            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-full shadow transition"
                        >
                            <FaPlus className="w-5 h-5" />
                            Add Product
                        </button>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-100 sm:p-6">
                    <div className="overflow-x-auto rounded-2xl shadow-lg border border-gray-200 bg-white">
                        <table className="w-full min-w-[700px] text-sm text-left">
                            <thead className="bg-gradient-to-r from-blue-50 to-white sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="px-6 py-5 font-bold text-gray-700 uppercase tracking-wide">
                                        S.No.
                                    </th>
                                    <th className="px-6 py-5 font-bold text-gray-700 uppercase tracking-wide rounded-tl-2xl">
                                        Image
                                    </th>
                                    <th className="px-6 py-5 font-bold text-gray-700 uppercase tracking-wide">
                                        Name
                                    </th>
                                    <th className="px-6 py-5 font-bold text-gray-700 uppercase tracking-wide">
                                        Item Code
                                    </th>
                                    <th className="px-6 py-5 font-bold text-gray-700 uppercase tracking-wide">
                                        Description
                                    </th>
                                    <th className="px-6 py-5 font-bold text-gray-700 uppercase tracking-wide">
                                        Actions
                                    </th>
                                    <th className="px-6 py-5 font-bold text-gray-700 uppercase tracking-wide rounded-tr-2xl">
                                        Status
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-100 text-gray-800">
                                {products.length ? (
                                    products.map((product, index) => (
                                        <React.Fragment key={product.id}>
                                            {/* Product Row */}
                                            <tr
                                                className="bg-white hover:bg-blue-50 transition-all duration-200"
                                                style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.03)" }}
                                            >
                                                <td className="px-6 py-5">{index + 1}</td>
                                                <td className="px-6 py-5 rounded-l-2xl">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 overflow-hidden border border-gray-200 shadow">
                                                            <img
                                                                width={48}
                                                                height={48}
                                                                src={
                                                                    product.image_url
                                                                        ? `${basePath}${product.image_url}`
                                                                        : "/placeholder.svg"
                                                                }
                                                                alt={product.name}
                                                                className="object-cover w-full h-full"
                                                            />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 font-medium">
                                                    {product.name}
                                                </td>
                                                <td className="px-6 py-5">{product.item_code}</td>
                                                <td className="px-6 py-5">
                                                    <button
                                                        className="px-4 py-2 text-xs rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 font-semibold shadow transition"
                                                        onClick={() => openDescriptionModal(product)}
                                                    >
                                                        View Description
                                                    </button>
                                                </td>
                                                <td className="px-6 py-5 flex gap-2 items-center">
                                                    <button
                                                        className="px-4 py-2 text-xs rounded-full bg-green-100 text-green-700 hover:bg-green-200 font-semibold shadow transition"
                                                        onClick={() => goToProductDetail(product)}
                                                    >
                                                        Product Detail
                                                    </button>
                                                </td>
                                                <td className="px-6 py-5 rounded-r-2xl">
                                                    <span
                                                        className={`inline-block rounded-full px-4 py-1 font-semibold text-xs ${product.status
                                                            ? "bg-green-100 text-green-700"
                                                            : "bg-red-100 text-red-700"
                                                            }`}
                                                    >
                                                        {product.status ? "Active" : "Inactive"}
                                                    </span>
                                                </td>
                                            </tr>
                                        </React.Fragment>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="text-center text-gray-400 py-10 italic rounded-b-2xl"
                                        >
                                            No products found.
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
