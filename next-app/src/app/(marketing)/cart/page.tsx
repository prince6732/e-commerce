"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import {
    Minus,
    Plus,
    Trash2,
    ShoppingBag,
    ArrowLeft,
    X
} from "lucide-react";
import imgPlaceholder from "@/public/imagePlaceholder.png";
import ErrorMessage from "@/components/(sheared)/ErrorMessage";
import SuccessMessage from "@/components/(sheared)/SuccessMessage";
import { useLoader } from "@/context/LoaderContext";
const basePath = process.env.NEXT_PUBLIC_UPLOAD_BASE || "https://api.zelton.co.in";

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

const CartPage = () => {
    const [themes, setThemes] = useState<Themes | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { items, count, total, loading, updateQuantity, removeFromCart, clearCart } = useCart();
    const { showLoader, hideLoader } = useLoader();
    const [showRemoveModal, setShowRemoveModal] = useState(false);
    const [showClearModal, setShowClearModal] = useState(false);
    const [itemToRemove, setItemToRemove] = useState<number | null>(null);
    const [itemToRemoveName, setItemToRemoveName] = useState<string>("");

    useEffect(() => {
        loadTheme();
    }, []);

    const loadTheme = async () => {
        showLoader();
        try {
            const data = await fetchThemes();
            if (Array.isArray(data) && data.length > 0) {
                // Pick the latest theme
                const latest = data[data.length - 1];
                setThemes(latest);
            } else {
                setErrorMessage("No themes available");
            }
        } catch {
            setErrorMessage("Failed to fetch theme. Please try again.");
        } finally {
            hideLoader();
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
                <div className="container mx-auto px-4 py-16">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading your cart...</p>
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
                        <ShoppingBag className="w-24 h-24 text-gray-400 mx-auto mb-6" />
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">Please Login</h1>
                        <p className="text-gray-600 mb-8">You need to login to view your cart</p>
                        <button
                            onClick={() => router.push('/login')}
                            className="px-8 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-semibold rounded-full hover:shadow-lg transition-all duration-300 transform hover:scale-105"
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
                        <p className="text-gray-600">Loading your cart...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
                <div className="container mx-auto px-4 py-16">
                    <div className="text-center">
                        <ShoppingBag className="w-24 h-24 text-gray-400 mx-auto mb-6" />
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">Your Cart is Empty</h1>
                        <p className="text-gray-600 mb-8">Add some products to get started</p>
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
                            Continue Shopping
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const handleQuantityUpdate = async (cartItemId: number, newQuantity: number) => {
        if (newQuantity < 1) return;
        showLoader();
        try {
            await updateQuantity(cartItemId, newQuantity);
            setSuccessMessage("Cart quantity updated successfully!");
        } catch (error) {
            setErrorMessage("Failed to update cart quantity. Please try again.");
        } finally {
            hideLoader();
        }
    };

    const handleRemoveItemClick = (cartItemId: number, itemName: string) => {
        setItemToRemove(cartItemId);
        setItemToRemoveName(itemName);
        setShowRemoveModal(true);
    };

    const confirmRemoveItem = async () => {
        if (itemToRemove) {
            showLoader();
            try {
                await removeFromCart(itemToRemove);
                setSuccessMessage(`${itemToRemoveName} removed from cart successfully!`);
            } catch (error) {
                setErrorMessage("Failed to remove item from cart. Please try again.");
            } finally {
                hideLoader();
            }
            setShowRemoveModal(false);
            setItemToRemove(null);
            setItemToRemoveName("");
        }
    };

    const handleClearCartClick = () => {
        setShowClearModal(true);
    };

    const confirmClearCart = async () => {
        showLoader();
        try {
            await clearCart();
            setSuccessMessage("Cart cleared successfully!");
        } catch (error) {
            setErrorMessage("Failed to clear cart. Please try again.");
        } finally {
            hideLoader();
        }
        setShowClearModal(false);
    };

    const handleCheckoutClick = () => {
        router.push('/checkout');
    };

    const handleSingleItemCheckout = (item: any) => {
        // Navigate to single item checkout with item details
        router.push(`/checkout/single?cartItemId=${item.id}&productId=${item.product.id}&variantId=${item.variant.id}&quantity=${item.quantity}`);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
            {errorMessage && <ErrorMessage message={errorMessage} onClose={() => setErrorMessage(null)} />}
            {successMessage && <SuccessMessage message={successMessage} onClose={() => setSuccessMessage(null)} />}
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-700 hover:text-gray-900 hover:bg-white border border-gray-200 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span className="font-medium">Back</span>
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
                            <p className="text-gray-600">{count} {count === 1 ? 'item' : 'items'} in your cart</p>
                        </div>
                    </div>

                    {items.length > 0 && (
                        <button
                            onClick={handleClearCartClick}
                            className="px-4 py-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 flex items-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            Clear Cart
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Cart Items */}
                    <div className="lg:col-span-2 space-y-6">
                        {items.map((item) => (
                            <div key={item.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
                                {/* Card Header with Remove Button */}
                                <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                                        <span className="text-sm font-medium text-gray-600">In Stock</span>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveItemClick(item.id, item.product.name)}
                                        disabled={loading}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-200 disabled:opacity-50"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Card Content */}
                                <div className="p-6">
                                    <div className="flex flex-col sm:flex-row gap-6">
                                        {/* Product Image */}
                                        <div className="flex-shrink-0">
                                            <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-xl overflow-hidden shadow-md">
                                                <Image
                                                    src={`${basePath}${item.variant.image_url || item.product.image_url || imgPlaceholder.src}`}
                                                    alt={item.product.name}
                                                    fill
                                                    unoptimized
                                                    className="object-cover hover:scale-105 transition-transform duration-300"
                                                />
                                            </div>
                                        </div>

                                        {/* Product Details */}
                                        <div className="flex-1 min-w-0">
                                            {/* Product Name and Variant */}
                                            <div className="mb-4">
                                                <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                                                    {item.product.name}
                                                </h3>
                                                <div className="flex flex-wrap gap-2 mb-2">
                                                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium">
                                                        {item.variant.title}
                                                    </span>
                                                    <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                                                        SKU: {item.variant.sku}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Selected Attributes */}
                                            {item.selected_attributes && Object.keys(item.selected_attributes).length > 0 && (
                                                <div className="mb-4">
                                                    <p className="text-sm font-medium text-gray-700 mb-2">Selected Options:</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {Object.entries(item.selected_attributes).map(([key, value]) => (
                                                            <span
                                                                key={key}
                                                                className="px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full font-medium"
                                                            >
                                                                {value}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Price and Quantity Section */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end mb-4">
                                                {/* Price Information */}
                                                <div>
                                                    <p className="text-sm text-gray-600 mb-1">Price</p>
                                                    <div className="text-2xl font-bold text-gray-900">₹{item.total}</div>
                                                    <div className="text-sm text-gray-500">₹{item.price} × {item.quantity}</div>
                                                </div>

                                                {/* Quantity Controls */}
                                                <div>
                                                    <p className="text-sm text-gray-600 mb-2">Quantity</p>
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            onClick={() => handleQuantityUpdate(item.id, item.quantity - 1)}
                                                            disabled={item.quantity <= 1 || loading}
                                                            className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 border border-gray-200"
                                                        >
                                                            <Minus className="w-4 h-4" />
                                                        </button>
                                                        <div className="w-16 h-10 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center">
                                                            <span className="font-bold text-lg">{item.quantity}</span>
                                                        </div>
                                                        <button
                                                            onClick={() => handleQuantityUpdate(item.id, item.quantity + 1)}
                                                            disabled={item.quantity >= item.variant.stock || loading}
                                                            className="w-10 h-10 rounded-lg bg-orange-100 hover:bg-orange-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 border border-orange-200"
                                                        >
                                                            <Plus className="w-4 h-4 text-orange-600" />
                                                        </button>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-1">{item.variant.stock} available</p>
                                                </div>
                                            </div>

                                            {/* Individual Product Actions */}
                                            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
                                                <button
                                                    onClick={() => handleSingleItemCheckout(item)}
                                                    disabled={loading}
                                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                                                >
                                                    <ShoppingBag className="w-5 h-5" />
                                                    Buy This Now
                                                </button>

                                                <button
                                                    onClick={() => router.push(`/products/${item.product.id}`)}
                                                    className="px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 transition-all duration-300 flex items-center justify-center gap-2"
                                                >
                                                    View Product
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/50 sticky top-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Summary</h2>

                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal ({count} {count === 1 ? 'item' : 'items'})</span>
                                    <span>₹{total}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Shipping</span>
                                    <span className="text-green-600">Free</span>
                                </div>
                                <hr className="border-gray-200" />
                                <div className="flex justify-between text-xl font-bold text-gray-900">
                                    <span>Total</span>
                                    <span>₹{total}</span>
                                </div>
                            </div>

                            <button
                                onClick={handleCheckoutClick}
                                disabled={loading || items.length === 0}
                                style={{
                                    background: themes
                                        ? `linear-gradient(${themes.gradient_direction}, ${themes.gradient_start || themes.primary_color}, ${themes.gradient_end || themes.primary_color})`
                                        : "linear-gradient(to right, #f97316, #facc15)",
                                    color: themes?.text_color || "#fff",
                                }}
                                className="w-full px-8 py-4  font-bold text-lg rounded-2xl shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 active:scale-95"
                            >
                                Proceed to Checkout
                            </button>

                            <button
                                onClick={() => router.push('/')}
                                className="w-full mt-4 px-8 py-3 bg-gray-100 text-gray-800 font-semibold rounded-2xl hover:bg-gray-200 transition-colors duration-300"
                            >
                                Continue Shopping
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Remove Item Confirmation Modal */}
            {showRemoveModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">

                    <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-900">Remove Item</h3>
                            <button
                                onClick={() => setShowRemoveModal(false)}
                                className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to remove <span className="font-semibold">"{itemToRemoveName}"</span> from your cart?
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowRemoveModal(false)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmRemoveItem}
                                disabled={loading}
                                className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                </div>
            )}

            
            {showClearModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-900">Clear Cart</h3>
                            <button
                                onClick={() => setShowClearModal(false)}
                                className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to clear your entire cart? This action cannot be undone and all {count} items will be removed.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowClearModal(false)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmClearCart}
                                disabled={loading}
                                className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
                            >
                                Clear Cart
                            </button>
                        </div>
                    </div>
                </div>
            )}


        </div>
    );
};

export default CartPage;