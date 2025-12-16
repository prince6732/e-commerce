"use client";

import Modal from "@/components/(sheared)/Modal";
import { useLoader } from "@/context/LoaderContext";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { getAdminProducts, deleteProduct } from "../../../../../utils/product";
import { Pencil, Trash2, Eye } from "lucide-react";

const basePath: string =
    `${process.env.NEXT_PUBLIC_UPLOAD_BASE}` || "https://api.zelton.co.in";

export default function AllProducts() {
    const [products, setProducts] = useState<any[]>([]);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
    const [pagination, setPagination] = useState<any>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const { showLoader, hideLoader } = useLoader();
    const router = useRouter();

    useEffect(() => {
        fetchProducts(currentPage, searchQuery);
    }, [currentPage]);

    useEffect(() => {
        if (successMessage || errorMessage) {
            const timer = setTimeout(() => {
                setSuccessMessage(null);
                setErrorMessage(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [successMessage, errorMessage]);

    const fetchProducts = async (page: number, search: string = "") => {
        showLoader();
        try {
            const filters = search ? { search } : {};
            const response = await getAdminProducts(page, 20, filters);
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

    const handleSearch = () => {
        setCurrentPage(1);
        fetchProducts(1, searchQuery);
    };

    const handleDeleteProduct = async () => {
        if (!selectedProduct) return;
        showLoader();
        try {
            await deleteProduct(selectedProduct.id);
            setSuccessMessage("Product deleted successfully");
            setIsDeleteModalOpen(false);
            setSelectedProduct(null);
            fetchProducts(currentPage, searchQuery);
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

    const goToProductDetail = (product: any) => {
        router.push(`/dashboard/products/${product.id}`);
    };

    const editProduct = (product: any) => {
        router.push(`/dashboard/categories/${product.category_id}/products/add-multi-variant?productId=${product.id}`);
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6 rounded-2xl border border-gray-200 bg-white/80 backdrop-blur-xl shadow-md">
                <div className="flex flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between">

                    {/* Heading */}
                    <h2 className="text-xl lg:text-3xl font-extrabold text-gray-900 tracking-tight">
                        All Products
                    </h2>

                    {/* Search Section */}
                    <div className="flex w-full md:w-auto items-center gap-3">
                        {/* Input */}
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                            placeholder="Search products..."
                            className="
                    w-full md:w-80
                    rounded-xl
                    border border-gray-300
                    bg-white
                    px-4 py-2.5
                    text-sm
                    text-gray-900
                    placeholder-gray-400
                    shadow-sm
                    focus:border-orange-400
                    focus:ring-2
                    focus:ring-orange-200
                    transition-all
                "
                        />

                        {/* Search Button */}
                        <button
                            onClick={handleSearch}
                            className="
                    rounded-xl
                    bg-gradient-to-r from-orange-500 to-yellow-400
                    px-5 py-2.5
                    text-sm
                    font-semibold
                    text-white
                    shadow-md
                    hover:shadow-lg
                    hover:from-orange-600 hover:to-yellow-500
                    active:scale-95
                    transition-all
                "
                        >
                            Search
                        </button>

                        {/* Clear Button */}
                        {searchQuery && (
                            <button
                                onClick={() => {
                                    setSearchQuery("");
                                    setCurrentPage(1);
                                    fetchProducts(1, "");
                                }}
                                className="
                        rounded-xl
                        bg-gray-100
                        px-5 py-2.5
                        text-sm
                        font-semibold
                        text-gray-700
                        hover:bg-gray-200
                        active:scale-95
                        transition-all
                    "
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Success/Error Toast */}
            {(successMessage || errorMessage) && (
                <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-lg shadow-lg font-semibold ${successMessage ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}>
                    {successMessage || errorMessage}
                </div>
            )}

            {/* Products Table */}
            <div className="border-gray-100">
                <div className="overflow-x-auto scrollbar rounded-2xl shadow border border-gray-300/30 bg-white">
                    <table className="w-full min-w-[900px] text-sm text-left">
                        <thead className="uppercase text-xs font-semibold text-gray-700 bg-gray-50">
                            <tr>
                                <th className="px-6 py-4">S.No.</th>
                                <th className="px-6 py-4">Image</th>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4">Brand</th>
                                <th className="px-6 py-4">Stock</th>
                                <th className="px-6 py-4">Price Range</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-end">Actions</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-200 text-gray-700">
                            {products.length ? (
                                products.map((product, index) => (
                                    <tr
                                        key={product.id}
                                        className="hover:bg-gray-50 transition"
                                    >
                                        <td className="px-6 py-4">{(currentPage - 1) * 20 + index + 1}</td>

                                        <td className="px-6 py-4">
                                            {product.image_url ? (
                                                <img
                                                    src={`${basePath}${product.image_url}`}
                                                    alt={product.name}
                                                    className="w-16 h-16 object-cover rounded-xl border border-gray-200 shadow-sm"
                                                />
                                            ) : (
                                                <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center">
                                                    <span className="text-xs text-gray-400">No Image</span>
                                                </div>
                                            )}
                                        </td>

                                        <td className="px-6 py-4 font-medium max-w-xs truncate">
                                            {product.name}
                                        </td>

                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs">
                                                {product.category?.name || '-'}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs">
                                                {product.brand?.name || '-'}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${product.total_stock > 10
                                                ? "bg-green-100 text-green-700"
                                                : product.total_stock > 0
                                                    ? "bg-yellow-100 text-yellow-700"
                                                    : "bg-red-100 text-red-700"
                                                }`}>
                                                {product.total_stock || 0}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm font-medium">
                                                {product.min_price === product.max_price
                                                    ? `₹${product.min_price}`
                                                    : `₹${product.min_price} - ₹${product.max_price}`
                                                }
                                            </span>
                                        </td>

                                        <td className="px-6 py-4">
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-medium ${product.status
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-red-100 text-red-700"
                                                    }`}
                                            >
                                                {product.status ? "Active" : "Inactive"}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex gap-2 justify-end">
                                                <button
                                                    title="View Details"
                                                    onClick={() => goToProductDetail(product)}
                                                    className="size-10 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                <button
                                                    title="Edit Product"
                                                    onClick={() => editProduct(product)}
                                                    className="size-10 bg-orange-100 hover:bg-orange-200 text-orange-600 rounded-full flex items-center justify-center transition"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button
                                                    title="Delete Product"
                                                    onClick={() => openDeleteModal(product)}
                                                    className="size-10 bg-red-100 hover:bg-red-200 text-red-600 rounded-full flex items-center justify-center transition"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={9} className="text-center text-gray-400 py-8 italic">
                                        No Products Found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination && pagination.last_page > 1 && (
                    <div className="flex items-center justify-between mt-4 px-4 py-3 bg-white rounded-xl border border-gray-200">
                        <div className="text-sm text-gray-600">
                            Showing <span className="font-semibold">{pagination.from}</span> to{" "}
                            <span className="font-semibold">{pagination.to}</span> of{" "}
                            <span className="font-semibold">{pagination.total}</span> products
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 font-medium"
                            >
                                Previous
                            </button>
                            <span className="px-4 py-2 bg-orange-100 text-orange-600 rounded-lg font-semibold">
                                {currentPage} / {pagination.last_page}
                            </span>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(pagination.last_page, prev + 1))}
                                disabled={currentPage === pagination.last_page}
                                className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 font-medium"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

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
                        Are you sure you want to delete <strong>{selectedProduct?.name}</strong>?
                        This will also delete all variants. This action cannot be undone.
                    </p>
                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={() => {
                                setIsDeleteModalOpen(false);
                                setSelectedProduct(null);
                            }}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDeleteProduct}
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
