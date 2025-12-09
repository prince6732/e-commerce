"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, Package, Truck, CheckCircle, Clock, X, MapPin, Calendar } from "lucide-react";
import imgPlaceholder from "@/public/imagePlaceholder.png";
import { fetchThemes } from "../../../../../../utils/theme";
import axios from "../../../../../../utils/axios";

const basePath = process.env.NEXT_PUBLIC_UPLOAD_BASE || "http://localhost:8000";

type Themes = {
    id: number;
    background_color: string;
    text_color: string;
    primary_color: string;
    gradient_start?: string | null;
    gradient_end?: string | null;
    gradient_direction: string;
};

type OrderItem = {
    id: number;
    quantity: number;
    price: number;
    total: number;
    selected_attributes: Record<string, string> | null;
    product: {
        id: number;
        name: string;
        image_url: string | null;
    };
    variant: {
        id: number;
        title: string;
        sku: string;
        image_url: string | null;
    };
};

type TrackingRecord = {
    id: number;
    status: string;
    description: string;
    location: string | null;
    tracked_at: string;
};

type Order = {
    id: number;
    order_number: string;
    status: string;
    payment_method: string;
    payment_status: string;
    subtotal: number;
    shipping_fee: number;
    tax: number;
    total: number;
    shipping_address: string;
    notes: string | null;
    created_at: string;
    order_items: OrderItem[];
    tracking_records: TrackingRecord[];
};

const OrderTrackingPage = () => {
    const [themes, setThemes] = useState<Themes | null>(null);
    const router = useRouter();
    const params = useParams();
    const { user } = useAuth();

    const [order, setOrder] = useState<Order | null>(null);
    const [trackingRecords, setTrackingRecords] = useState<TrackingRecord[]>([]);
    const [loading, setLoading] = useState(true);

    const orderId = params.id as string;

    useEffect(() => {
        loadTheme();
        if (user && orderId) {
            fetchOrderTracking();
        }
    }, [user, orderId]);

    const loadTheme = async () => {
        try {
            const data = await fetchThemes();
            if (Array.isArray(data) && data.length > 0) {
                const latest = data[data.length - 1];
                setThemes(latest);
            }
        } catch (error) {
            console.error('Error loading themes:', error);
        }
    };

    const fetchOrderTracking = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/orders/${orderId}/tracking`);

            if (response.data.success) {
                setOrder(response.data.data.order);
                setTrackingRecords(response.data.data.tracking_records);
            }
        } catch (error) {
            console.error('Error fetching order tracking:', error);
            alert('Error loading order tracking information');
            router.push('/orders');
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending':
                return <Clock className="w-6 h-6 text-yellow-500" />;
            case 'confirmed':
                return <CheckCircle className="w-6 h-6 text-blue-500" />;
            case 'processing':
                return <Package className="w-6 h-6 text-purple-500" />;
            case 'shipped':
                return <Truck className="w-6 h-6 text-orange-500" />;
            case 'delivered':
                return <CheckCircle className="w-6 h-6 text-green-500" />;
            case 'cancelled':
                return <X className="w-6 h-6 text-red-500" />;
            default:
                return <Clock className="w-6 h-6 text-gray-500" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'confirmed':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'processing':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'shipped':
                return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'delivered':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'cancelled':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusSteps = () => {
        const allSteps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
        const currentStatus = order?.status || 'pending';
        const currentIndex = allSteps.indexOf(currentStatus);

        if (currentStatus === 'cancelled') {
            return allSteps.map((step, index) => ({
                status: step,
                completed: false,
                current: false,
                cancelled: true
            }));
        }

        return allSteps.map((step, index) => ({
            status: step,
            completed: index <= currentIndex,
            current: index === currentIndex,
            cancelled: false
        }));
    };

    const getStepTitle = (status: string) => {
        switch (status) {
            case 'pending':
                return 'Order Placed';
            case 'confirmed':
                return 'Order Confirmed';
            case 'processing':
                return 'Order Processing';
            case 'shipped':
                return 'Order Shipped';
            case 'delivered':
                return 'Order Delivered';
            default:
                return status.charAt(0).toUpperCase() + status.slice(1);
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Please Login</h1>
                    <p className="text-gray-600 mb-6">You need to be logged in to track your orders</p>
                    <button
                        onClick={() => router.push('/login')}
                        className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading order tracking...</p>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
                <div className="text-center">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h1>
                    <p className="text-gray-600 mb-6">The order you're looking for doesn't exist</p>
                    <button
                        onClick={() => router.push('/orders')}
                        className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                    >
                        View All Orders
                    </button>
                </div>
            </div>
        );
    }

    const statusSteps = getStatusSteps();

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-700 hover:text-gray-900 hover:bg-white border border-gray-200 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-medium">Back</span>
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Track Order</h1>
                        <p className="text-gray-600">{order.order_number}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Order Status Steps */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Status Progress */}
                        <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-xl border border-gray-100 p-8 relative overflow-hidden">
                            {/* Background Pattern */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50 to-purple-50 rounded-full blur-3xl opacity-30"></div>
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-full blur-3xl opacity-30"></div>

                            <div className="relative">
                                <div className="flex items-center justify-between mb-2">
                                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                                            <Package className="w-6 h-6 text-white" />
                                        </div>
                                        Order Progress
                                    </h2>
                                    <div className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(order.status)} shadow-sm`}>
                                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                    </div>
                                </div>
                                <p className="text-gray-600 mb-8">Track your order journey from placement to delivery</p>

                                {order.status === 'cancelled' ? (
                                    <div className="text-center py-12 relative">
                                        <div className="absolute inset-0 bg-red-50 rounded-2xl"></div>
                                        <div className="relative">
                                            <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                                                <X className="w-12 h-12 text-red-600" />
                                            </div>
                                            <h3 className="text-2xl font-bold text-red-800 mb-3">Order Cancelled</h3>
                                            <p className="text-red-600 text-lg">This order has been cancelled and cannot be processed further</p>
                                            <div className="mt-6 p-4 bg-red-100 rounded-xl border border-red-200">
                                                <p className="text-sm text-red-700">
                                                    If you have any questions about this cancellation, please contact our support team.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        {/* Enhanced Progress Steps */}
                                        <div className="relative mb-12">
                                            {/* Progress Line */}
                                            <div className="absolute top-8 left-8 right-8 h-1 bg-gray-200 rounded-full">
                                                <div
                                                    className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-1000 ease-out"
                                                    style={{ width: `${(statusSteps.filter(s => s.completed).length - 1) / (statusSteps.length - 1) * 100}%` }}
                                                ></div>
                                            </div>

                                            {/* Step Icons */}
                                            <div className="grid grid-cols-5 gap-4">
                                                {statusSteps.map((step, index) => (
                                                    <div key={step.status} className="flex flex-col items-center relative z-10">
                                                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-3 transition-all duration-500 shadow-lg ${step.completed
                                                            ? 'bg-gradient-to-br from-green-400 to-green-600 text-white transform scale-110'
                                                            : step.current
                                                                ? 'bg-gradient-to-br from-blue-400 to-blue-600 text-white animate-pulse'
                                                                : 'bg-gray-100 border-2 border-gray-300 text-gray-400'
                                                            }`}>
                                                            {step.completed ? (
                                                                <CheckCircle className="w-8 h-8" />
                                                            ) : (
                                                                <div className="w-8 h-8 flex items-center justify-center">
                                                                    {getStatusIcon(step.status)}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="text-center">
                                                            <span className={`text-sm font-semibold block mb-1 ${step.completed || step.current ? 'text-gray-900' : 'text-gray-400'
                                                                }`}>
                                                                {getStepTitle(step.status)}
                                                            </span>
                                                            {step.current && (
                                                                <span className="text-xs text-blue-600 font-medium">Current</span>
                                                            )}
                                                            {step.completed && !step.current && (
                                                                <span className="text-xs text-green-600 font-medium">Completed</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Current Status Card */}
                                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200 shadow-sm">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${order.status === 'delivered' ? 'bg-green-500' : 'bg-blue-500'
                                                    } text-white shadow-lg`}>
                                                    {getStatusIcon(order.status)}
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                                                        {getStepTitle(order.status)}
                                                    </h3>
                                                    <p className="text-gray-600">
                                                        {order.status === 'delivered'
                                                            ? 'Your order has been successfully delivered!'
                                                            : `Your order is currently being ${order.status === 'shipped' ? 'shipped to you' : order.status}`}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm text-gray-500">Last Updated</div>
                                                    <div className="font-semibold text-gray-900">
                                                        {trackingRecords && trackingRecords.length > 0
                                                            ? formatDate(trackingRecords[0].tracked_at)
                                                            : formatDate(order.created_at)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Estimated Delivery */}
                                        {order.status !== 'delivered' && order.status !== 'cancelled' && (
                                            <div className="mt-6 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl p-6 border border-orange-200">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                                                        <Truck className="w-6 h-6 text-white" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-gray-900">Estimated Delivery</h4>
                                                        <p className="text-gray-600 text-sm">
                                                            {order.status === 'shipped' ? '1-2 business days' : '3-5 business days'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Tracking Timeline */}
                        <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-xl border border-gray-100 p-8 relative overflow-hidden">
                            {/* Background Elements */}
                            <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-green-100 to-blue-100 rounded-full blur-2xl opacity-40"></div>

                            <div className="relative">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center">
                                                <Calendar className="w-6 h-6 text-white" />
                                            </div>
                                            Detailed Timeline
                                        </h2>
                                        <p className="text-gray-600">Complete history of your order updates</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm text-gray-500">Total Updates</div>
                                        <div className="text-2xl font-bold text-gray-900">{trackingRecords?.length || 0}</div>
                                    </div>
                                </div>

                                <div className="relative">
                                    {trackingRecords && trackingRecords.length > 0 ? (
                                        <div className="space-y-8">
                                            {trackingRecords.map((record, index) => (
                                                <div key={record.id} className="relative">
                                                    <div className="flex gap-6">
                                                        {/* Timeline Line & Icon */}
                                                        <div className="flex flex-col items-center relative">
                                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg border-2 border-white ${index === 0
                                                                ? 'bg-gradient-to-br from-green-400 to-green-600 text-white'
                                                                : 'bg-gradient-to-br from-blue-400 to-blue-600 text-white'
                                                                }`}>
                                                                {getStatusIcon(record.status)}
                                                            </div>
                                                            {index < trackingRecords.length - 1 && (
                                                                <div className="w-1 bg-gradient-to-b from-blue-200 to-gray-200 mt-4 mb-4 rounded-full" style={{ height: '60px' }} />
                                                            )}
                                                        </div>

                                                        {/* Content Card */}
                                                        <div className="flex-1">
                                                            <div className={`rounded-2xl p-6 border shadow-sm ${index === 0
                                                                ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
                                                                : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
                                                                }`}>
                                                                <div className="flex items-start justify-between mb-3">
                                                                    <div>
                                                                        <h4 className="text-lg font-bold text-gray-900 mb-1">
                                                                            {getStepTitle(record.status)}
                                                                        </h4>
                                                                        {index === 0 && (
                                                                            <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                                                                                Latest Update
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <div className="text-sm font-semibold text-gray-900">
                                                                            {formatDate(record.tracked_at)}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <p className="text-gray-700 mb-4 leading-relaxed">
                                                                    {record.description}
                                                                </p>

                                                                {record.location && (
                                                                    <div className="flex items-center gap-2 p-3 bg-white/60 rounded-xl border border-gray-200">
                                                                        <MapPin className="w-5 h-5 text-gray-500" />
                                                                        <div>
                                                                            <div className="text-sm font-medium text-gray-900">Location</div>
                                                                            <div className="text-sm text-gray-600">{record.location}</div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-16">
                                            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                                <Package className="w-10 h-10 text-gray-400" />
                                            </div>
                                            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Updates Yet</h3>
                                            <p className="text-gray-500 mb-4">Tracking information will appear here as your order progresses</p>
                                            <div className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                                                <Clock className="w-4 h-4 mr-2" />
                                                Check back soon for updates
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Enhanced Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-xl border border-gray-100 p-6 sticky top-8 overflow-hidden">
                            {/* Background Elements */}
                            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full blur-2xl opacity-50"></div>
                            <div className="absolute bottom-0 left-0 w-12 h-12 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full blur-2xl opacity-50"></div>

                            <div className="relative">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                                        <Package className="w-6 h-6 text-white" />
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-900">Order Summary</h2>
                                </div>

                                {/* Enhanced Order Info */}
                                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 mb-6 border border-gray-200">
                                    <div className="space-y-4 text-sm">
                                        <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                                            <span className="text-gray-600 font-medium">Order Number</span>
                                            <span className="font-bold text-gray-900 font-mono">{order.order_number}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-2 rounded-lg">
                                            <span className="text-gray-600 font-medium">Order Date</span>
                                            <span className="font-semibold text-gray-900">{formatDate(order.created_at)}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                                            <span className="text-gray-600 font-medium">Payment Method</span>
                                            <span className="font-semibold text-gray-900">Cash on Delivery</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
                                            <span className="text-green-700 font-bold">Total Amount</span>
                                            <span className="font-bold text-xl text-green-800">₹{order.total.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Order Items */}
                                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 mb-6 border border-gray-200">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-bold text-gray-900">Order Items</h3>
                                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                                            {order.order_items?.length || 0} item{(order.order_items?.length || 0) !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                    <div className="space-y-3 max-h-80 overflow-y-auto">
                                        {order.order_items && order.order_items.length > 0 ? (
                                            order.order_items.map((item, index) => (
                                                <div key={item.id} className="bg-white rounded-lg p-3 border border-gray-200">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200">
                                                            <Image
                                                                src={`${basePath}${item.variant.image_url || item.product.image_url || imgPlaceholder.src}`}
                                                                alt={item.product.name}
                                                                width={48}
                                                                height={48}
                                                                unoptimized
                                                                className="object-cover w-full h-full"
                                                            />
                                                        </div>
                                                        <div className="flex-1">
                                                            <h4 className="font-semibold text-gray-900 text-sm">
                                                                {item.product.name}
                                                            </h4>
                                                            <p className="text-xs text-gray-600">{item.variant.title}</p>
                                                            <div className="flex items-center justify-between mt-1">
                                                                <span className="text-xs text-gray-500">Qty: {item.quantity}</span>
                                                                <span className="font-bold text-gray-900">₹{item.total.toLocaleString()}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-8 text-gray-500">
                                                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                                <p className="text-sm">No items found</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Enhanced Shipping Address */}
                                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 mb-6 border border-gray-200">
                                    <div className="flex items-center gap-2 mb-3">
                                        <MapPin className="w-5 h-5 text-gray-500" />
                                        <h3 className="font-bold text-gray-900">Delivery Address</h3>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                                        <p className="text-sm text-gray-700 leading-relaxed">{order.shipping_address}</p>
                                    </div>
                                </div>

                                {/* Enhanced Action Buttons */}
                                <div className="space-y-3">
                                    <button
                                        onClick={() => router.push('/orders')}
                                        className="w-full px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
                                    >
                                        <ArrowLeft className="w-5 h-5" />
                                        All Orders
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderTrackingPage;