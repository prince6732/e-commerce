"use client";

import { useState, useEffect } from 'react';
import ProtectedRoute from "@/components/(sheared)/ProtectedRoute";
import { 
  Users, ShoppingBag, Package, TrendingUp, TrendingDown, 
  DollarSign, Clock, CheckCircle, Truck, XCircle, 
  AlertTriangle, Mail, Loader2, Eye, Calendar 
} from 'lucide-react';
import { DashboardStatistics, getDashboardStatistics } from '../../../../utils/dashboardApi';
import { useLoader } from '@/context/LoaderContext';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStatistics['data'] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { showLoader, hideLoader } = useLoader();

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    showLoader();
    try {
      const response = await getDashboardStatistics();
      setStats(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load statistics');
    } finally {
      hideLoader();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      processing: 'bg-blue-100 text-blue-800 border-blue-200',
      shipped: 'bg-purple-100 text-purple-800 border-purple-200',
      delivered: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };


  if (error || !stats) {
    return (
      <ProtectedRoute role="Admin">
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800">
            {error || 'Failed to load dashboard'}
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute role="Admin">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back! Here's what's happening today.</p>
          </div>
          <button
            onClick={fetchStatistics}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Monthly Revenue */}
          <div className="bg-gradient-to-br from-orange-500 to-yellow-500 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-lg">
                <DollarSign className="w-6 h-6" />
              </div>
              {stats.overview.revenue_growth >= 0 ? (
                <span className="flex items-center gap-1 text-sm font-medium bg-white/20 px-2 py-1 rounded-full">
                  <TrendingUp className="w-4 h-4" />
                  +{stats.overview.revenue_growth.toFixed(1)}%
                </span>
              ) : (
                <span className="flex items-center gap-1 text-sm font-medium bg-white/20 px-2 py-1 rounded-full">
                  <TrendingDown className="w-4 h-4" />
                  {stats.overview.revenue_growth.toFixed(1)}%
                </span>
              )}
            </div>
            <h3 className="text-sm font-medium text-white/80 mb-1">Monthly Revenue</h3>
            <p className="text-3xl font-bold">{formatCurrency(stats.overview.monthly_revenue)}</p>
            <p className="text-xs text-white/70 mt-2">Today: {formatCurrency(stats.overview.today_revenue)}</p>
          </div>

          {/* Total Orders */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <ShoppingBag className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Total Orders</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.overview.total_orders}</p>
            <p className="text-xs text-gray-500 mt-2">Avg: {formatCurrency(stats.overview.average_order_value)}</p>
          </div>

          {/* Total Users */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Total Users</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.overview.total_users}</p>
            <p className="text-xs text-gray-500 mt-2">New: +{stats.overview.new_users_this_month} this month</p>
          </div>

          {/* Total Products */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Package className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Total Products</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.overview.total_products}</p>
            <div className="flex gap-2 mt-2 text-xs">
              {stats.inventory.low_stock > 0 && (
                <span className="text-orange-600">Low: {stats.inventory.low_stock}</span>
              )}
              {stats.inventory.out_of_stock > 0 && (
                <span className="text-red-600">Out: {stats.inventory.out_of_stock}</span>
              )}
            </div>
          </div>
        </div>

        {/* Order Status Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-yellow-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.orders.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 border border-blue-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Processing</p>
                <p className="text-2xl font-bold text-blue-600">{stats.orders.processing}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 border border-purple-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Truck className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Shipped</p>
                <p className="text-2xl font-bold text-purple-600">{stats.orders.shipped}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 border border-green-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Delivered</p>
                <p className="text-2xl font-bold text-green-600">{stats.orders.delivered}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 border border-red-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Cancelled</p>
                <p className="text-2xl font-bold text-red-600">{stats.orders.cancelled}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Latest Orders */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Latest Orders</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {stats.latest_orders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-gray-900">{order.order_id}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{order.customer_name}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-orange-600">{formatCurrency(Number(order.total_amount))}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Top Selling Products</h2>
              <p className="text-sm text-gray-600">Last 30 days</p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {stats.charts.top_products.map((product, index) => (
                  <div key={product.id} className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-lg flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 truncate">{product.name}</p>
                      <p className="text-sm text-gray-600">{product.total_sold} sold</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">{formatCurrency(product.total_revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Alerts & Recent Users */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Alerts */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Alerts & Notifications</h2>
            </div>
            <div className="p-6 space-y-3">
              {stats.inventory.low_stock > 0 && (
                <div className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-orange-900">{stats.inventory.low_stock} Low Stock Products</p>
                    <p className="text-sm text-orange-700">Products running low on inventory</p>
                  </div>
                </div>
              )}
              {stats.inventory.out_of_stock > 0 && (
                <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-900">{stats.inventory.out_of_stock} Out of Stock</p>
                    <p className="text-sm text-red-700">Products need restocking</p>
                  </div>
                </div>
              )}
              {stats.messages.unread > 0 && (
                <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <Mail className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-blue-900">{stats.messages.unread} Unread Messages</p>
                    <p className="text-sm text-blue-700">New customer inquiries awaiting response</p>
                  </div>
                </div>
              )}
              {stats.orders.pending > 0 && (
                <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-yellow-900">{stats.orders.pending} Pending Orders</p>
                    <p className="text-sm text-yellow-700">Orders awaiting processing</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recent Users */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Recent Users</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {stats.recent_users.map((user) => (
                  <div key={user.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-full flex items-center justify-center text-white font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                    <p className="text-xs text-gray-500">{formatDate(user.created_at)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Revenue Overview</h2>
            <p className="text-sm text-gray-600">Last 6 months</p>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {stats.charts.revenue_by_month.reverse().map((item) => {
                const maxRevenue = Math.max(...stats.charts.revenue_by_month.map(i => i.revenue));
                const percentage = (item.revenue / maxRevenue) * 100;
                return (
                  <div key={item.month}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">{item.month}</span>
                      <div className="text-right">
                        <span className="text-sm font-bold text-gray-900">{formatCurrency(item.revenue)}</span>
                        <span className="text-xs text-gray-500 ml-2">({item.orders} orders)</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-orange-500 to-yellow-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
