"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, Package, Truck, CheckCircle, Clock, X, Search, Calendar, Filter, AlertTriangle } from "lucide-react";
import imgPlaceholder from "@/public/imagePlaceholder.png";
import { fetchThemes } from "../../../../utils/theme";
import axios from "../../../../utils/axios";
import Modal from "@/components/(sheared)/Modal";
import ErrorMessage from "@/components/(sheared)/ErrorMessage";
import SuccessMessage from "@/components/(sheared)/SuccessMessage";
import { useLoader } from "@/context/LoaderContext";

const basePath = process.env.NEXT_PUBLIC_UPLOAD_BASE || "https://api.zelton.co.in";

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

const OrdersPage = () => {
    const [themes, setThemes] = useState<Themes | null>(null);
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    const [orders, setOrders] = useState<Order[]>([]);
    const [filter, setFilter] = useState<string>('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [showOrderDetails, setShowOrderDetails] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
    const [cancelLoading, setCancelLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const { showLoader, hideLoader } = useLoader();

    useEffect(() => {
        loadTheme();
        if (user) {
            fetchOrders();
        }
    }, [user, filter, currentPage]);

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

    const fetchOrders = async () => {
        showLoader();
        try {
            const params = new URLSearchParams();

            if (filter) params.append('status', filter);
            if (searchTerm) params.append('search', searchTerm);
            params.append('page', currentPage.toString());
            params.append('per_page', '10');

            const response = await axios.get(`/api/orders?${params.toString()}`);

            if (response.data.success) {
                setOrders(response.data.data.data);
                setTotalPages(response.data.data.last_page);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
            setErrorMessage("Failed to load orders. Please try again.");
        } finally {
            hideLoader();
        }
    };

    const handleSearch = () => {
        setCurrentPage(1);
        fetchOrders();
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending':
                return <Clock className="w-5 h-5 text-yellow-500" />;
            case 'confirmed':
                return <CheckCircle className="w-5 h-5 text-blue-500" />;
            case 'processing':
                return <Package className="w-5 h-5 text-purple-500" />;
            case 'shipped':
                return <Truck className="w-5 h-5 text-orange-500" />;
            case 'delivered':
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'cancelled':
                return <X className="w-5 h-5 text-red-500" />;
            default:
                return <Clock className="w-5 h-5 text-gray-500" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'confirmed':
                return 'bg-blue-100 text-blue-800';
            case 'processing':
                return 'bg-purple-100 text-purple-800';
            case 'shipped':
                return 'bg-orange-100 text-orange-800';
            case 'delivered':
                return 'bg-green-100 text-green-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
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

    const handleViewOrder = (order: Order) => {
        setSelectedOrder(order);
        setShowOrderDetails(true);
    };

    const handleCancelOrderClick = (order: Order) => {
        setOrderToCancel(order);
        setShowCancelModal(true);
    };

    const handleConfirmCancel = async () => {
        if (!orderToCancel) return;

        setCancelLoading(true);
        showLoader();
        try {
            const response = await axios.patch(`/api/orders/${orderToCancel.id}/cancel`);
            if (response.data.success) {
                fetchOrders(); // Refresh orders
                if (selectedOrder && selectedOrder.id === orderToCancel.id) {
                    setSelectedOrder(response.data.data);
                }
                setSuccessMessage(`Order #${orderToCancel.order_number} cancelled successfully!`);
                setShowCancelModal(false);
                setOrderToCancel(null);
            }
        } catch (error) {
            console.error('Error cancelling order:', error);
            setErrorMessage("Failed to cancel order. Please try again.");
        } finally {
            setCancelLoading(false);
            hideLoader();
        }
    };
        } catch (error: any) {
            console.error('Error cancelling order:', error);
            alert(error.response?.data?.message || 'Failed to cancel order');
        } finally {
            setCancelLoading(false);
        }
    };

    const handleCancelModalClose = () => {
        setShowCancelModal(false);
        setOrderToCancel(null);
    };

    // Show loading spinner while auth is loading
    if (authLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
                <div className="container mx-auto px-4 py-16">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading your orders...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Show login prompt only after auth loading is complete and user is not authenticated
    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Please Login</h1>
                    <p className="text-gray-600 mb-6">You need to be logged in to view your orders</p>
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
                            <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
                            <p className="text-gray-600">Track and manage your orders</p>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <Filter className="w-4 h-4" />
                        Filters
                    </button>
                </div>

                {/* Filters */}
                {showFilters && (
                    <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Search Orders</label>
                                <div className="relative">
                                    <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Order number..."
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Status Filter</label>
                                <select
                                    value={filter}
                                    onChange={(e) => setFilter(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                >
                                    <option value="">All Orders</option>
                                    <option value="pending">Pending</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="processing">Processing</option>
                                    <option value="shipped">Shipped</option>
                                    <option value="delivered">Delivered</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>

                            <div className="flex items-end">
                                <button
                                    onClick={handleSearch}
                                    style={{
                                        background: themes
                                            ? `linear-gradient(${themes.gradient_direction}, ${themes.gradient_start || themes.primary_color}, ${themes.gradient_end || themes.primary_color})`
                                            : "linear-gradient(to right, #f97316, #facc15)",
                                        color: themes?.text_color || "#fff",
                                    }}
                                    className="px-6 py-2 font-semibold rounded-lg hover:shadow-lg transition-all duration-300"
                                >
                                    Apply Filters
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Orders List */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading your orders...</p>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-12">
                        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Orders Found</h3>
                        <p className="text-gray-600 mb-6">You haven't placed any orders yet</p>
                        <button
                            onClick={() => router.push('/')}
                            style={{
                                background: themes
                                    ? `linear-gradient(${themes.gradient_direction}, ${themes.gradient_start || themes.primary_color}, ${themes.gradient_end || themes.primary_color})`
                                    : "linear-gradient(to right, #f97316, #facc15)",
                                color: themes?.text_color || "#fff",
                            }}
                            className="px-8 py-3 font-semibold rounded-full hover:shadow-lg transition-all duration-300"
                        >
                            Start Shopping
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {orders.map((order) => (
                            <div key={order.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                                {/* Order Header */}
                                <div className="p-6 border-b border-gray-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">{order.order_number}</h3>
                                            <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                            </span>
                                            {getStatusIcon(order.status)}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-500">Items:</span>
                                            <p className="font-medium">{order.order_items?.length || 0}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Total:</span>
                                            <p className="font-medium">₹{order.total}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Payment:</span>
                                            <p className="font-medium">Cash on Delivery</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Status:</span>
                                            <p className="font-medium capitalize">{order.payment_status}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Order Items Preview */}
                                <div className="p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        {order.order_items && order.order_items.length > 0 ? (
                                            <>
                                                {order.order_items.slice(0, 3).map((item) => (
                                                    <div key={item.id} className="relative w-12 h-12 rounded-lg overflow-hidden">
                                                        <Image
                                                            src={`${basePath}${item.variant.image_url || item.product.image_url || imgPlaceholder.src}`}
                                                            alt={item.product.name}
                                                            fill
                                                            unoptimized
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                ))}
                                                {order.order_items.length > 3 && (
                                                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-600 font-medium">
                                                        +{order.order_items.length - 3}
                                                    </div>
                                                )}
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {order.order_items[0]?.product?.name || 'Unknown Product'}
                                                        {order.order_items.length > 1 && ` and ${order.order_items.length - 1} more item${order.order_items.length > 2 ? 's' : ''}`}
                                                    </p>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex-1">
                                                <p className="text-sm text-gray-500">No items found</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="p-6 border-t border-gray-100">
                                    <div className="flex flex-wrap gap-3">
                                        <button
                                            onClick={() => handleViewOrder(order)}
                                            style={{
                                                background: themes
                                                    ? `linear-gradient(${themes.gradient_direction}, ${themes.gradient_start || themes.primary_color}, ${themes.gradient_end || themes.primary_color})`
                                                    : "linear-gradient(to right, #f97316, #facc15)",
                                                color: themes?.text_color || "#fff",
                                            }}
                                            className="px-4 py-2 font-semibold text-sm rounded-lg hover:shadow-lg transition-all duration-300"
                                        >
                                            View Details
                                        </button>

                                        <button
                                            onClick={() => router.push(`/orders/${order.id}/tracking`)}
                                            className="px-4 py-2 bg-blue-500 text-white font-semibold text-sm rounded-lg hover:bg-blue-600 transition-colors"
                                        >
                                            Track Order
                                        </button>

                                        {(order.status === 'pending' || order.status === 'confirmed') && (
                                            <button
                                                onClick={() => handleCancelOrderClick(order)}
                                                className="px-4 py-2 bg-red-500 text-white font-semibold text-sm rounded-lg hover:bg-red-600 transition-colors"
                                            >
                                                Cancel Order
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 mt-8">
                                <button
                                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>

                                <span className="px-4 py-2 text-gray-600">
                                    Page {currentPage} of {totalPages}
                                </span>

                                <button
                                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Order Details Modal */}
                <Modal
                    isOpen={showOrderDetails}
                    onClose={() => setShowOrderDetails(false)}
                    title="Order Details"
                    width="max-w-4xl"
                >
                    {selectedOrder && (
                        <div>
                            <p className="text-sm text-gray-500 mb-6">{selectedOrder.order_number}</p>
                            {/* Order Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h3 className="font-semibold text-gray-900 mb-3">Order Information</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Order Date:</span>
                                            <span className="font-medium text-gray-700">{formatDate(selectedOrder.created_at)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Status:</span>
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                                                {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Payment Method:</span>
                                            <span className="font-medium text-gray-700">Cash on Delivery</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Payment Status:</span>
                                            <span className="font-medium capitalize text-gray-700">{selectedOrder.payment_status}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h3 className="font-semibold text-gray-900 mb-3">Shipping Address</h3>
                                    <p className="text-sm text-gray-700">{selectedOrder.shipping_address}</p>
                                    {selectedOrder.notes && (
                                        <div className="mt-3 pt-3 border-t border-gray-200">
                                            <h4 className="font-medium text-gray-900 mb-1">Notes:</h4>
                                            <p className="text-sm text-gray-600">{selectedOrder.notes}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Order Items */}
                            <div className="mb-8">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items ({selectedOrder.order_items?.length || 0})</h3>
                                <div className="space-y-6">
                                    {selectedOrder.order_items && selectedOrder.order_items.length > 0 ? selectedOrder.order_items.map((item, index) => (
                                        <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                                            <div className="flex gap-6">
                                                {/* Product Image */}
                                                <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 border-2 border-gray-100">
                                                    <Image
                                                        src={`${basePath}${item.variant.image_url || item.product.image_url || imgPlaceholder.src}`}
                                                        alt={item.product.name}
                                                        fill
                                                        unoptimized
                                                        className="object-cover"
                                                    />
                                                    <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                                                        #{index + 1}
                                                    </div>
                                                </div>

                                                {/* Product Details */}
                                                <div className="flex-1">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div>
                                                            <h4 className="text-lg font-semibold text-gray-900 mb-1">{item.product.name}</h4>
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                                                                    {item.variant.title}
                                                                </span>
                                                                <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 text-sm font-mono rounded-full">
                                                                    SKU: {item.variant.sku}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-2xl font-bold text-gray-900">₹{item.total.toLocaleString()}</p>
                                                            <p className="text-sm text-gray-500">₹{item.price.toLocaleString()} × {item.quantity} item{item.quantity > 1 ? 's' : ''}</p>
                                                        </div>
                                                    </div>

                                                    {/* Item Details Grid */}
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                                        <div className="bg-gray-50 rounded-lg p-3">
                                                            <h5 className="text-sm font-semibold text-gray-700 mb-1">Quantity</h5>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-lg font-bold text-orange-600">{item.quantity}</span>
                                                                <span className="text-sm text-gray-500">piece{item.quantity > 1 ? 's' : ''}</span>
                                                            </div>
                                                        </div>

                                                        <div className="bg-gray-50 rounded-lg p-3">
                                                            <h5 className="text-sm font-semibold text-gray-700 mb-1">Unit Price</h5>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-lg font-bold text-green-600">₹{item.price.toLocaleString()}</span>
                                                                <span className="text-sm text-gray-500">each</span>
                                                            </div>
                                                        </div>

                                                        <div className="bg-gray-50 rounded-lg p-3">
                                                            <h5 className="text-sm font-semibold text-gray-700 mb-1">Item Total</h5>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-lg font-bold text-blue-600">₹{item.total.toLocaleString()}</span>
                                                                <span className="text-sm text-gray-500">total</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Selected Attributes */}
                                                    {item.selected_attributes && Object.keys(item.selected_attributes).length > 0 && (
                                                        <div className="mb-4">
                                                            <h5 className="text-sm font-semibold text-gray-700 mb-2">Selected Options</h5>
                                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                                {Object.entries(item.selected_attributes).map(([key, value]) => (
                                                                    <div key={key} className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                                                                        <div className="text-xs font-medium text-orange-700 uppercase tracking-wide mb-1">
                                                                            {key.replace(/([A-Z])/g, ' $1').trim()}
                                                                        </div>
                                                                        <div className="text-sm font-semibold text-orange-900">{value}</div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-center py-12 bg-gray-50 rounded-xl">
                                            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                            <h4 className="text-lg font-semibold text-gray-900 mb-2">No Items Found</h4>
                                            <p className="text-gray-500">This order doesn't contain any items.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Order Summary */}
                            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <span>Order Summary</span>
                                    <span className="text-sm font-normal text-gray-500">({selectedOrder.order_items?.length || 0} items)</span>
                                </h3>

                                <div className="space-y-4">
                                    {/* Items Summary */}
                                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                                        <h4 className="font-medium text-gray-900 mb-3">Items Breakdown</h4>
                                        {selectedOrder.order_items && selectedOrder.order_items.length > 0 && (
                                            <div className="space-y-2 mb-3">
                                                {selectedOrder.order_items.map((item, index) => (
                                                    <div key={item.id} className="flex items-center justify-between text-sm">
                                                        <div className="flex-1">
                                                            <span className="text-gray-600">
                                                                {item.product.name.length > 30 ?
                                                                    `${item.product.name.substring(0, 30)}...` :
                                                                    item.product.name
                                                                }
                                                            </span>
                                                            <span className="text-gray-400 ml-2">({item.variant.title})</span>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="font-medium">₹{item.total.toLocaleString()}</span>
                                                            <div className="text-xs text-gray-500">
                                                                ₹{item.price.toLocaleString()} × {item.quantity}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <div className="border-t border-gray-200 pt-3">
                                            <div className="flex justify-between text-sm font-medium">
                                                <span className="text-gray-600">Items Subtotal:</span>
                                                <span className="text-gray-900">₹{selectedOrder.subtotal.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Charges Breakdown */}
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between py-2">
                                            <span className="text-gray-600 flex items-center gap-2">
                                                <Package className="w-4 h-4" />
                                                Subtotal ({selectedOrder.order_items?.length || 0} items):
                                            </span>
                                            <span className="font-medium text-gray-700">₹{selectedOrder.subtotal.toLocaleString()}</span>
                                        </div>

                                        <div className="flex justify-between py-2">
                                            <span className="text-gray-600 flex items-center gap-2">
                                                <Truck className="w-4 h-4" />
                                                Shipping Fee:
                                            </span>
                                            <span className={`font-medium text-gray-700 ${selectedOrder.shipping_fee === 0 ? 'text-green-600' : ''}`}>
                                                {selectedOrder.shipping_fee === 0 ? 'FREE' : `₹${selectedOrder.shipping_fee.toLocaleString()}`}
                                            </span>
                                        </div>

                                        <div className="flex justify-between py-2">
                                            <span className="text-gray-600">Tax & Fees:</span>
                                            <span className="font-medium text-gray-700">₹{selectedOrder.tax.toLocaleString()}</span>
                                        </div>

                                        {selectedOrder.shipping_fee === 0 && selectedOrder.subtotal > 500 && (
                                            <div className="flex items-center justify-center py-2 text-green-600 text-xs bg-green-50 rounded-lg">
                                                <span>🎉 Free shipping on orders above ₹500</span>
                                            </div>
                                        )}
                                    </div>

                                    <hr className="border-gray-300" />

                                    {/* Total */}
                                    <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                                        <div className="flex justify-between items-center">
                                            <span className="text-lg font-semibold text-gray-900">Order Total:</span>
                                            <span className="text-2xl font-bold text-orange-600">₹{selectedOrder.total.toLocaleString()}</span>
                                        </div>
                                        <div className="text-sm text-gray-600 mt-1">
                                            Payment Method: <span className="font-medium">Cash on Delivery</span>
                                        </div>
                                    </div>

                                    {/* Payment Status */}
                                    <div className="text-center">
                                        <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${selectedOrder.payment_status === 'paid'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            Payment Status: {selectedOrder.payment_status.charAt(0).toUpperCase() + selectedOrder.payment_status.slice(1)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </Modal>

                {/* Cancel Order Confirmation Modal */}
                <Modal
                    isOpen={showCancelModal}
                    onClose={handleCancelModalClose}
                    title="Cancel Order"
                    width="max-w-md"
                >
                    <div className="text-center">
                        <div className="mx-auto flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                            <AlertTriangle className="w-8 h-8 text-red-600" />
                        </div>

                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Are you sure you want to cancel this order?
                        </h3>

                        {orderToCancel && (
                            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                                <div className="text-sm text-gray-600 mb-2">
                                    <span className="font-medium">Order:</span> {orderToCancel.order_number}
                                </div>
                                <div className="text-sm text-gray-600 mb-2">
                                    <span className="font-medium">Total:</span> ₹{orderToCancel.total.toLocaleString()}
                                </div>
                                <div className="text-sm text-gray-600">
                                    <span className="font-medium">Items:</span> {orderToCancel.order_items?.length || 0} item{(orderToCancel.order_items?.length || 0) > 1 ? 's' : ''}
                                </div>
                            </div>
                        )}

                        <p className="text-sm text-gray-600 mb-6">
                            This action cannot be undone. The order will be cancelled and you will need to place a new order if you change your mind.
                        </p>

                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={handleCancelModalClose}
                                disabled={cancelLoading}
                                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                            >
                                Keep Order
                            </button>
                            <button
                                onClick={handleConfirmCancel}
                                disabled={cancelLoading}
                                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {cancelLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Cancelling...
                                    </>
                                ) : (
                                    'Yes, Cancel Order'
                                )}
                            </button>
                        </div>
                    </div>
                </Modal>
            </div>
        </div>
    );
};

export default OrdersPage;