"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Search, Eye, Edit, Truck, CheckCircle, Clock, X, Package, Download, Calendar, Send } from "lucide-react";
import imgPlaceholder from "@/public/imagePlaceholder.png";
import axios from "../../../../../utils/axios";
import Modal from "@/components/(sheared)/Modal";
import OrderTimelineModal from "@/components/OrderTimelineModal";
import CreateShipmentModal from "@/components/CreateShipmentModal";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { getCompletedOrders, getCompletedOrderDetails } from "../../../../../utils/orderApi";
import { useLoader } from "@/context/LoaderContext";

const basePath = process.env.NEXT_PUBLIC_UPLOAD_BASE || "https://api.zelton.co.in";

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

type User = {
    id: number;
    name: string;
    email: string;
    phone_number: string | null;
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
    delivered_at: string | null;
    delivery_confirmed_at: string | null;
    delhivery_waybill?: string | null;
    delhivery_status?: string | null;
    courier_name?: string | null;
    user: User;
    order_items: OrderItem[];
    tracking_records: TrackingRecord[];
};

type OrderStats = {
    total_orders: number;
    pending_orders: number;
    confirmed_orders: number;
    processing_orders: number;
    shipped_orders: number;
    delivered_orders: number;
    completed_orders: number;
    cancelled_orders: number;
    total_revenue: number;
    todays_orders: number;
    this_month_orders: number;
};

const OrdersPage = () => {
    const [activeTab, setActiveTab] = useState<'all' | 'completed'>('all');
    const [orders, setOrders] = useState<Order[]>([]);
    const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
    const [stats, setStats] = useState<OrderStats | null>(null);
    const [filter, setFilter] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState({ from: '', to: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [showOrderDetails, setShowOrderDetails] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastType, setToastType] = useState<"success" | "error" | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const [showCompletedOrderModal, setShowCompletedOrderModal] = useState(false);
    const [completedOrderDetails, setCompletedOrderDetails] = useState<any>(null);
    const [loadingOrderDetails, setLoadingOrderDetails] = useState(false);
    const [showCreateShipment, setShowCreateShipment] = useState(false);
    const [shipmentOrderId, setShipmentOrderId] = useState<number | null>(null);
    const [shipmentOrderNumber, setShipmentOrderNumber] = useState<string>('');
    const { showLoader, hideLoader } = useLoader();

    useEffect(() => {
        if (activeTab === 'all') {
            fetchOrders();
        } else {
            fetchCompletedOrders();
        }
        fetchOrderStats();
    }, [activeTab, filter, currentPage, searchTerm, dateFilter]);

    useEffect(() => {
        if (showToast) {
            const timer = setTimeout(() => {
                setShowToast(false);
                setToastMessage(null);
                setToastType(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [showToast]);

    const showToastMessage = (message: string, type: "success" | "error") => {
        setToastMessage(message);
        setToastType(type);
        setShowToast(true);
    };

    type StatusOption = {
        value: string;
        label: string;
        icon: any;
        color: string;
        completed?: boolean;
        disabled?: boolean;
    };

    const getStatusOptions = (): StatusOption[] => {
        const allStatuses: StatusOption[] = [
            { value: 'pending', label: 'Order Placed', icon: Clock, color: 'text-yellow-500' },
            { value: 'confirmed', label: 'Order Confirmed', icon: CheckCircle, color: 'text-blue-500' },
            { value: 'processing', label: 'Order Processing', icon: Package, color: 'text-purple-500' },
            { value: 'shipped', label: 'Order Shipped', icon: Truck, color: 'text-orange-500' },
            { value: 'delivered', label: 'Order Delivered', icon: CheckCircle, color: 'text-green-500' },
        ];

        if (!selectedOrder) {
            return allStatuses.map(status => ({
                ...status,
                completed: false,
                disabled: false,
            }));
        }

        const currentStatusIndex = allStatuses.findIndex(status => status.value === selectedOrder.status);

        return allStatuses.map((status, index) => ({
            ...status,
            completed: index <= currentStatusIndex,
            disabled: index <= currentStatusIndex || index > currentStatusIndex + 1,
        }));
    };

    const fetchOrders = async () => {
        showLoader();
        try {
            const params = new URLSearchParams();

            if (filter) params.append('status', filter);
            if (searchTerm) params.append('search', searchTerm);
            if (dateFilter.from) params.append('from_date', dateFilter.from);
            if (dateFilter.to) params.append('to_date', dateFilter.to);
            params.append('page', currentPage.toString());
            params.append('per_page', '20');

            const response = await axios.get(`/api/admin/orders?${params.toString()}`);

            if (response.data.success) {
                setOrders(response.data.data.data);
                setTotalPages(response.data.data.last_page);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            hideLoader();
        }
    };

    const fetchCompletedOrders = async () => {
        showLoader();
        try {
            const response = await getCompletedOrders({
                search: searchTerm,
                from_date: dateFilter.from,
                to_date: dateFilter.to,
                page: currentPage,
                per_page: 20,
            });

            if (response.success) {
                setCompletedOrders(response.data.data);
                setTotalPages(response.data.last_page);
            }
        } catch (error) {
            console.error('Error fetching completed orders:', error);
            showToastMessage('Failed to fetch completed orders', 'error');
        } finally {
            hideLoader();
        }
    };

    const fetchOrderStats = async () => {
        try {
            const response = await axios.get('/api/admin/orders/stats');
            if (response.data.success) {
                setStats(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching order stats:', error);
        }
    };

    const handleViewCompletedOrder = async (orderId: number) => {
        showLoader();
        try {
            setLoadingOrderDetails(true);
            setShowCompletedOrderModal(true);

            const response = await getCompletedOrderDetails(orderId);

            if (response.success) {
                setCompletedOrderDetails(response.data);
            } else {
                showToastMessage('Failed to load order details', 'error');
                setShowCompletedOrderModal(false);
            }
        } catch (error) {
            console.error('Error fetching completed order details:', error);
            showToastMessage('Failed to load order details', 'error');
            setShowCompletedOrderModal(false);
        } finally {
            setLoadingOrderDetails(false);
            hideLoader();
        }
    };

    const handleConfirmOrder = async (orderId: number) => {
        showLoader();
        try {
            const response = await axios.patch(`/api/admin/orders/${orderId}/status`, {
                status: 'confirmed',
                description: 'Order confirmed by admin',
                location: 'Warehouse'
            });

            if (response.data.success) {
                showToastMessage('Order confirmed successfully', 'success');
                fetchOrders();
                fetchOrderStats();
            }
        } catch (error: any) {
            console.error('Error confirming order:', error);
            showToastMessage(error.response?.data?.message || 'Failed to confirm order', 'error');
        } finally {
            hideLoader();
        }
    };



    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending':
                return <Clock className="w-4 h-4 text-yellow-500" />;
            case 'confirmed':
                return <CheckCircle className="w-4 h-4 text-blue-500" />;
            case 'processing':
                return <Package className="w-4 h-4 text-purple-500" />;
            case 'shipped':
                return <Truck className="w-4 h-4 text-orange-500" />;
            case 'delivered':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'completed':
                return <CheckCircle className="w-4 h-4 text-emerald-600" />;
            case 'cancelled':
                return <X className="w-4 h-4 text-red-500" />;
            default:
                return <Clock className="w-4 h-4 text-gray-500" />;
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
            case 'completed':
                return 'bg-emerald-100 text-emerald-800 border-emerald-200';
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

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    };

    const displayOrders = activeTab === 'all' ? orders : completedOrders;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
                    <p className="text-gray-600">Manage and track all orders</p>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                    <div className="bg-white rounded-lg p-6 shadow-sm border">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.total_orders}</p>
                            </div>
                            <Package className="w-8 h-8 text-blue-500" />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg p-6 shadow-sm border">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Today's Orders</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.todays_orders}</p>
                            </div>
                            <Calendar className="w-8 h-8 text-green-500" />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg p-6 shadow-sm border">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.pending_orders}</p>
                            </div>
                            <Clock className="w-8 h-8 text-yellow-500" />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg p-6 shadow-sm border">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Completed</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.completed_orders || 0}</p>
                            </div>
                            <CheckCircle className="w-8 h-8 text-emerald-500" />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg p-6 shadow-sm border">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.total_revenue)}</p>
                            </div>
                            <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="mb-6">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => {
                                setActiveTab('all');
                                setCurrentPage(1);
                                setFilter('');
                            }}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'all'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <Package className="w-5 h-5" />
                                <span>All Orders</span>
                            </div>
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab('completed');
                                setCurrentPage(1);
                            }}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'completed'
                                ? 'border-emerald-500 text-emerald-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5" />
                                <span>Completed Orders</span>
                                {stats && stats.completed_orders > 0 && (
                                    <span className="bg-emerald-100 text-emerald-600 text-xs font-bold px-2 py-0.5 rounded-full">
                                        {stats.completed_orders}
                                    </span>
                                )}
                            </div>
                        </button>
                    </nav>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg p-6 shadow-sm border mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Order number or customer..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {activeTab === 'all' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    )}

                    <div className={activeTab === 'completed' ? 'md:col-start-2' : ''}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                        <input
                            type="date"
                            value={dateFilter.from}
                            onChange={(e) => setDateFilter(prev => ({ ...prev, from: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                        <input
                            type="date"
                            value={dateFilter.to}
                            onChange={(e) => setDateFilter(prev => ({ ...prev, to: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-lg shadow-sm border">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center">
                                        <div className="flex items-center justify-center">
                                            <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
                                            <span className="ml-2 text-gray-500">Loading orders...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : displayOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                        No orders found
                                    </td>
                                </tr>
                            ) : (
                                displayOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{order.order_number}</div>
                                                <div className="text-sm text-gray-500">{order.order_items.length} items</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{order.user.name}</div>
                                                <div className="text-sm text-gray-500">{order.user.email}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {formatDate(activeTab === 'completed' && order.delivery_confirmed_at
                                                ? order.delivery_confirmed_at
                                                : order.created_at)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                                                {getStatusIcon(order.status)}
                                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {order.payment_method === 'cash_on_delivery' ? 'Cash on Delivery' : 'Online Payment'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${order.payment_status === 'paid'
                                                    ? 'bg-green-100 text-green-800'
                                                    : order.payment_status === 'failed'
                                                        ? 'bg-red-100 text-red-800'
                                                        : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {formatCurrency(order.total)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center gap-2">
                                                {activeTab === 'completed' ? (
                                                    <button
                                                        onClick={() => handleViewCompletedOrder(order.id)}
                                                        className="text-emerald-600 hover:text-emerald-900 flex items-center gap-1"
                                                        title="View complete order details"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                        <span className="text-xs">View Details</span>
                                                    </button>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedOrder(order);
                                                                setShowOrderDetails(true);
                                                            }}
                                                            className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 font-semibold rounded-lg shadow-sm border border-blue-200 hover:bg-blue-600 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                            <span className="text-xs">View Details</span>
                                                        </button>
                                                        {order.status === 'pending' && (
                                                            <button
                                                                onClick={() => handleConfirmOrder(order.id)}
                                                                className="inline-flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 font-semibold rounded-lg shadow-sm border border-green-200 hover:bg-green-600 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2"
                                                                title="Confirm this order"
                                                            >
                                                                <CheckCircle className="w-4 h-4" />
                                                                <span className="text-xs">Confirm Order</span>
                                                            </button>
                                                        )}
                                                        {!order.delhivery_waybill && ['confirmed', 'processing'].includes(order.status) && (
                                                            <button
                                                                onClick={() => {
                                                                    setShipmentOrderId(order.id);
                                                                    setShipmentOrderNumber(order.order_number);
                                                                    setShowCreateShipment(true);
                                                                }}
                                                                className="inline-flex items-center gap-2 px-3 py-2 bg-purple-50 text-purple-700 font-semibold rounded-lg shadow-sm border border-purple-200 hover:bg-purple-600 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2"
                                                                title="Create Delhivery Shipment"
                                                            >
                                                                <Send className="w-4 h-4" />
                                                                <span className="text-xs">Create Shipment</span>
                                                            </button>
                                                        )}
                                                        {order.delhivery_waybill && (
                                                            <a
                                                                href={`/dashboard/orders/${order.id}/track`}
                                                                className="inline-flex items-center gap-2 px-3 py-2 bg-orange-50 text-orange-700 font-semibold rounded-lg shadow-sm border border-orange-200 hover:bg-orange-600 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2"
                                                                title="Track Delhivery Shipment"
                                                            >
                                                                <Truck className="w-4 h-4" />
                                                                <span className="text-xs">Track</span>
                                                            </a>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                                Page {currentPage} of {totalPages}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <Modal
                isOpen={showOrderDetails}
                onClose={() => setShowOrderDetails(false)}
                title="Order Details"
                width="max-w-4xl"
            >
                {selectedOrder && (
                    <div>
                        {/* Order Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h3 className="font-semibold text-gray-900 mb-3">Order Information</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Order Number:</span>
                                        <span className="font-medium text-gray-700">{selectedOrder.order_number}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Date:</span>
                                        <span className="font-medium text-gray-700">{formatDate(selectedOrder.created_at)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Status:</span>
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                                            {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Payment:</span>
                                        <span className="font-medium text-gray-700">{selectedOrder.payment_method === 'cash_on_delivery' ? 'Cash on Delivery' : 'Online Payment'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4">
                                <h3 className="font-semibold text-gray-900 mb-3">Customer Information</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Name:</span>
                                        <span className="font-medium text-gray-700">{selectedOrder.user.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Email:</span>
                                        <span className="font-medium text-gray-700">{selectedOrder.user.email}</span>
                                    </div>
                                    {selectedOrder.user.phone_number && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Phone:</span>
                                            <span className="font-medium text-gray-700">{selectedOrder.user.phone_number}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Order Items */}
                        <div className="mb-6">
                            <h3 className="font-semibold text-gray-900 mb-3">Order Items</h3>
                            <div className="space-y-3">
                                {selectedOrder.order_items.map((item) => (
                                    <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                                        <div className="relative w-12 h-12 rounded-lg overflow-hidden">
                                            <Image
                                                src={`${basePath}${item.variant.image_url || item.product.image_url || imgPlaceholder.src}`}
                                                alt={item.product.name}
                                                fill
                                                className="object-cover"
                                                unoptimized
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-900">{item.product.name}</h4>
                                            <p className="text-sm text-gray-600">{item.variant.title}</p>
                                            <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium text-gray-900">{formatCurrency(item.total)}</p>
                                            <p className="text-sm text-gray-500">{formatCurrency(item.price)} each</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Shipping Address */}
                        <div className="mb-6">
                            <h3 className="font-semibold text-gray-900 mb-2">Shipping Address</h3>
                            <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedOrder.shipping_address}</p>
                        </div>

                        {/* Order Summary */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between text-gray-700">
                                    <span>Subtotal:</span>
                                    <span>{formatCurrency(selectedOrder.subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-gray-700">
                                    <span>Shipping:</span>
                                    <span>{formatCurrency(selectedOrder.shipping_fee)}</span>
                                </div>
                                <div className="flex justify-between text-gray-700">
                                    <span>Tax:</span>
                                    <span>{formatCurrency(selectedOrder.tax)}</span>
                                </div>
                                <div className="flex justify-between font-semibold text-lg text-gray-700 border-t pt-2">
                                    <span>Total:</span>
                                    <span>{formatCurrency(selectedOrder.total)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>



            {/* Create Delhivery Shipment Modal */}
            {shipmentOrderId && (
                <CreateShipmentModal
                    isOpen={showCreateShipment}
                    onClose={() => {
                        setShowCreateShipment(false);
                        setShipmentOrderId(null);
                        setShipmentOrderNumber('');
                    }}
                    orderId={shipmentOrderId}
                    orderNumber={shipmentOrderNumber}
                    onSuccess={() => {
                        fetchOrders();
                        fetchOrderStats();
                        showToastMessage('Shipment created successfully!', 'success');
                    }}
                />
            )}

            {/* Completed Order Timeline Modal */}
            <OrderTimelineModal
                isOpen={showCompletedOrderModal}
                onClose={() => {
                    setShowCompletedOrderModal(false);
                    setCompletedOrderDetails(null);
                }}
                orderDetails={completedOrderDetails}
                loading={loadingOrderDetails}
            />

            {/* Toast Notification */}
            {showToast && toastMessage && (
                <div className={`fixed top-6 right-6 z-[9999] px-6 py-4 rounded-lg shadow-lg font-semibold transition-all border ${toastType === 'success'
                    ? 'bg-green-100 text-green-800 border-green-200'
                    : 'bg-red-100 text-red-800 border-red-200'
                    }`}>
                    {toastMessage}
                </div>
            )}
        </div>
    );
};

export default OrdersPage;
