"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "../../../../../utils/axios";
import { CheckCircle, Package, Truck, XCircle, Clock, MapPin } from "lucide-react";
import Modal from "@/components/(sheared)/Modal";

type OrderItem = {
    id: number;
    quantity: number;
    price: number;
    total: number;
    product: {
        id: number;
        name: string;
        image_url: string | null;
    };
    variant: {
        id: number;
        title: string;
    };
};

type Order = {
    id: number;
    order_number: string;
    status: string;
    total: number;
    created_at: string;
    delivered_at: string | null;
    delivery_confirmed_at: string | null;
    user: {
        name: string;
        email: string;
    };
    order_items: OrderItem[];
    shipping_address: string;
};

const ConfirmDeliveryPage = () => {
    const params = useParams();
    const router = useRouter();
    const token = params.token as string;

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [confirming, setConfirming] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    useEffect(() => {
        fetchOrderDetails();
    }, [token]);

    const fetchOrderDetails = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/confirm-delivery/${token}`);

            if (response.data.success) {
                setOrder(response.data.data);
            }
        } catch (error: any) {
            setError(error.response?.data?.message || "Failed to load order details");
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmDelivery = async () => {
        try {
            setConfirming(true);
            setShowConfirmModal(false);
            const response = await axios.post(`/api/confirm-delivery/${token}`);

            if (response.data.success) {
                setSuccess(true);
                setOrder(response.data.data);

                // Redirect to success page after 3 seconds
                setTimeout(() => {
                    router.push('/');
                }, 5000);
            }
        } catch (error: any) {
            setError(error.response?.data?.message || "Failed to confirm delivery");
        } finally {
            setConfirming(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading order details...</p>
                </div>
            </div>
        );
    }

    if (error && !order) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-6">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Link</h1>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={() => router.push('/')}
                        className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                        Go to Homepage
                    </button>
                </div>
            </div>
        );
    }

    if (success || order?.delivery_confirmed_at) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 p-6">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-12 h-12 text-green-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-3">Delivery Confirmed!</h1>
                    <p className="text-gray-600 mb-2">Thank you for confirming your order delivery.</p>
                    <p className="text-sm text-gray-500 mb-6">
                        Order #{order?.order_number} has been marked as completed.
                    </p>
                    {order?.delivery_confirmed_at && (
                        <p className="text-xs text-gray-400 mb-6">
                            Confirmed on: {formatDate(order.delivery_confirmed_at)}
                        </p>
                    )}
                    <div className="space-y-3">
                        <button
                            onClick={() => router.push('/')}
                            className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                        >
                            Continue Shopping
                        </button>
                        <button
                            onClick={() => router.push('/dashboard/orders')}
                            className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                        >
                            View My Orders
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-t-2xl shadow-lg p-8 border-b-4 border-blue-500">
                    <div className="flex items-center justify-center mb-4">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                            <Package className="w-8 h-8 text-blue-500" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
                        Confirm Your Delivery
                    </h1>
                    <p className="text-center text-gray-600">
                        Please review your order details and confirm delivery
                    </p>
                </div>

                {/* Order Details */}
                <div className="bg-white shadow-lg p-8">
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Information</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Order Number</p>
                                <p className="font-semibold text-gray-900">{order?.order_number}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Order Total</p>
                                <p className="font-semibold text-gray-900">{formatCurrency(order?.total || 0)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Order Date</p>
                                <p className="font-medium text-gray-700">{order?.created_at && formatDate(order.created_at)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Delivered On</p>
                                <p className="font-medium text-gray-700">{order?.delivered_at && formatDate(order.delivered_at)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-start gap-2">
                            <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-gray-700 mb-1">Shipping Address</p>
                                <p className="text-sm text-gray-600">{order?.shipping_address}</p>
                            </div>
                        </div>
                    </div>

                    {/* Order Items */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Items in this Order</h3>
                        <div className="space-y-3">
                            {order?.order_items.map((item) => (
                                <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                                    <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                                        {item.product.image_url && (
                                            <img
                                                src={`${process.env.NEXT_PUBLIC_UPLOAD_BASE || 'https://api.zelton.co.in'}${item.product.image_url}`}
                                                alt={item.product.name}
                                                className="w-full h-full object-cover"
                                            />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-medium text-gray-900">{item.product.name}</h4>
                                        <p className="text-sm text-gray-600">{item.variant.title}</p>
                                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-gray-900">{formatCurrency(item.total)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Warning Box */}
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-yellow-700">
                                    <strong>Important:</strong> By confirming delivery, you acknowledge that you have received all items in good condition.
                                    If there are any issues with your order, please contact customer support before confirming.
                                </p>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <button
                            onClick={() => router.push('/')}
                            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => setShowConfirmModal(true)}
                            disabled={confirming}
                            className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {confirming ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Confirming...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-5 h-5" />
                                    Confirm Delivery
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 rounded-b-2xl shadow-lg p-6 text-center">
                    <p className="text-sm text-gray-600">
                        Need help? Contact us at <a href="mailto:support@yourstore.com" className="text-blue-500 hover:underline">support@yourstore.com</a>
                    </p>
                </div>
            </div>

            {/* Confirmation Modal */}
            <Modal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                title="Confirm Delivery"
                width="max-w-md"
            >
                <div className="space-y-4">
                    {/* Modal Header Icon */}
                    <div className="flex items-center justify-center mb-4">
                        <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-10 h-10 text-white" />
                        </div>
                    </div>

                    {/* Confirmation Message */}
                    <p className="text-gray-700 text-center">
                        Are you sure you want to confirm that you have received this order in good condition?
                    </p>

                    {/* Warning Box */}
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                        <div className="flex items-start">
                            <svg className="w-5 h-5 text-yellow-400 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <div className="text-sm text-yellow-700">
                                <p className="font-semibold mb-1">Important:</p>
                                <p>By confirming, you acknowledge that all items have been received and are in good condition. This action cannot be undone.</p>
                            </div>
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-3">Order Summary:</h3>
                        <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex justify-between">
                                <span>Order Number:</span>
                                <span className="font-medium text-gray-900">{order?.order_number}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Total Amount:</span>
                                <span className="font-medium text-gray-900">{formatCurrency(order?.total || 0)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Items:</span>
                                <span className="font-medium text-gray-900">{order?.order_items.length} item(s)</span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={() => setShowConfirmModal(false)}
                            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                            disabled={confirming}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirmDelivery}
                            disabled={confirming}
                            className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {confirming ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Confirming...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-5 h-5" />
                                    Yes, Confirm
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ConfirmDeliveryPage;
