"use client";

import { Category, Product } from "@/common/interface";
import Modal from "@/components/(sheared)/Modal";
import { useLoader } from "@/context/LoaderContext";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { FaArrowLeft, FaPlus } from "react-icons/fa";
import { getCategoryById } from "../../../../../../../utils/category";
import { getAdminProducts, deleteProduct } from "../../../../../../../utils/product";
import { TiInfoLargeOutline } from "react-icons/ti";
import { Pencil, Trash2 } from "lucide-react";

const basePath: string =
    `${process.env.NEXT_PUBLIC_UPLOAD_BASE}` || "https://api.zelton.co.in";

export default function Products() {
    const [category, setCategory] = useState<Category | null>(null);
    const [products, setProducts] = useState<any[]>([]);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
    const [pagination, setPagination] = useState<any>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const { showLoader, hideLoader } = useLoader();
    const params = useParams();
    const categoryId = Number(params.id);
    const router = useRouter();

    useEffect(() => {
        if (!categoryId) return;
        fetchCategory();
        fetchProducts(currentPage);
    }, [categoryId, currentPage]);

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

    const fetchProducts = async (page: number) => {
        if (!categoryId) return;
        showLoader();
        try {
            const response = await getAdminProducts(page, 20, { category_id: categoryId });
            if (response.success && response.result) {
                setProducts(response.result.products || []);
                setPagination(response.result.pagination);
            }
        } catch (err) {
            console.error(err);
            setErrorMessage("Failed to load products");
        } finally {
            hideLoader();
        }
    };

    const handleDeleteProduct = async () => {
        if (!selectedProduct) return;
        showLoader();
        try {
            await deleteProduct(selectedProduct.id);
            setSuccessMessage("Product deleted successfully");
            setIsDeleteModalOpen(false);
            setSelectedProduct(null);
            fetchProducts(currentPage);
        } catch (err) {
            console.error(err);
            setErrorMessage("Failed to delete product");
        } finally {
            hideLoader();
        }
    };

    const openDeleteModal = (product: any) => {
        setSelectedProduct(product);
        setIsDeleteModalOpen(true);
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

    const openDescriptionModal = (product: any) => {
        setSelectedProduct(product);
        setIsDescriptionModalOpen(true);
    };

    const goToProductDetail = (product: any) => {
        router.push(`/dashboard/categories/${categoryId}/products/${product.id}/detail`);
    };

    const editProduct = (product: any) => {
        if (category?.attributes && category?.attributes?.length > 0) {
            if (category?.attributes?.length === 1) {
                router.push(`/dashboard/categories/${categoryId}/products/add-single-attribute-product?productId=${product.id}`);
            } else {
                router.push(`/dashboard/categories/${categoryId}/products/add-multi-variant?productId=${product.id}`);
            }
        } else {
            router.push(`/dashboard/categories/${categoryId}/products/add-single-variant?productId=${product.id}`);
        }
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

                <div className=" border-gray-100">
                    <div className="overflow-x-auto scrollbar rounded-2xl shadow border border-gc-300/30 bg-transparent">
                        <table className="w-full min-w-[800px] text-sm text-left">

                            {/* Table Header */}
                            <thead className="uppercase text-xs font-semibold text-gray-700">
                                <tr>
                                    <th className="px-6 py-4">S.No.</th>
                                    <th className="px-6 py-4">Image</th>
                                    <th className="px-6 py-4">Name</th>
                                    <th className="px-6 py-4">Item Code</th>
                                    <th className="px-6 py-4">Stock</th>
                                    <th className="px-6 py-4">Price Range</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-end">Actions</th>
                                </tr>
                            </thead>

                            {/* Table Body */}
                            <tbody className="divide-y divide-gray-200 text-gray-700">
                                {products.length ? (
                                    products.map((product, index) => (
                                        <tr
                                            key={product.id}
                                            className="bg-white/5 hover:bg-white/10 transition"
                                        >
                                            {/* Index */}
                                            <td className="px-6 py-4">{(currentPage - 1) * 20 + index + 1}</td>

                                            {/* Image */}
                                            <td className="px-6 py-4">
                                                {product.image_url ? (
                                                    <img
                                                        src={`${basePath}${product.image_url}`}
                                                        alt={product.name}
                                                        className="w-16 h-16 object-cover rounded-xl border border-gray-200 shadow-sm"
                                                    />
                                                ) : (
                                                    <span className="text-xs text-zinc-400 italic">No Image</span>
                                                )}
                                            </td>

                                            {/* Name */}
                                            <td className="px-6 py-4 font-medium">
                                                {product.name}
                                            </td>

                                            {/* Item Code */}
                                            <td className="px-6 py-4">
                                                {product.item_code || '-'}
                                            </td>

                                            {/* Stock */}
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                    product.total_stock > 10 
                                                        ? "bg-green-100 text-green-700" 
                                                        : product.total_stock > 0 
                                                        ? "bg-yellow-100 text-yellow-700"
                                                        : "bg-red-100 text-red-700"
                                                }`}>
                                                    {product.total_stock || 0} units
                                                </span>
                                            </td>

                                            {/* Price Range */}
                                            <td className="px-6 py-4">
                                                {product.min_price === product.max_price 
                                                    ? `₹${product.min_price}`
                                                    : `₹${product.min_price} - ₹${product.max_price}`
                                                }
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
                                            <td className="px-6 py-4 text-right flex gap-2 justify-end">
                                                <button
                                                    title="View Product Details"
                                                    onClick={() => goToProductDetail(product)}
                                                    className="size-10 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full
                  flex items-center justify-center transition"
                                                >
                                                    <TiInfoLargeOutline className="h-4 w-4" />
                                                </button>
                                                <button
                                                    title="Edit Product"
                                                    onClick={() => editProduct(product)}
                                                    className="size-10 bg-gc-300/30 hover:bg-orange-400 rounded-full flex items-center justify-center"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button
                                                    title="Delete Product"
                                                    onClick={() => openDeleteModal(product)}
                                                    className="size-10 bg-red-100 hover:bg-red-200 text-red-600 rounded-full
                  flex items-center justify-center transition"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </td>

                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="text-center text-zinc-400 py-8 italic">
                                            No Products Found
                                        </td>
                                    </tr>
                                )}
                            </tbody>

                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination && pagination.last_page > 1 && (
                        <div className="flex items-center justify-between mt-4 px-4">
                            <div className="text-sm text-gray-600">
                                Showing {pagination.from} to {pagination.to} of {pagination.total} products
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                >
                                    Previous
                                </button>
                                <span className="px-4 py-2 bg-orange-100 text-orange-600 rounded-lg font-medium">
                                    {currentPage} / {pagination.last_page}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(pagination.last_page, prev + 1))}
                                    disabled={currentPage === pagination.last_page}
                                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
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

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setSelectedProduct(null);
                }}
                title="Delete Product"
            >
                <div className="p-4">
                    <p className="text-gray-700 mb-4">
                        Are you sure you want to delete <strong>{selectedProduct?.name}</strong>? This action cannot be undone.
                    </p>
                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={() => {
                                setIsDeleteModalOpen(false);
                                setSelectedProduct(null);
                            }}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDeleteProduct}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
