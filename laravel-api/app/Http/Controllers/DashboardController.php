<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\User;
use App\Models\Product;
use App\Models\Variant;
use App\Models\ContactMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function getStatistics(Request $request)
    {
        try {
            // Date range (default: current month)
            $startDate = $request->get('start_date', Carbon::now()->startOfMonth());
            $endDate = $request->get('end_date', Carbon::now()->endOfMonth());

            // Total counts
            $totalUsers = User::count();
            $totalProducts = Product::count();
            $totalOrders = Order::count();

            // Monthly revenue (current month)
            $monthlyRevenue = Order::whereMonth('created_at', Carbon::now()->month)
                ->whereYear('created_at', Carbon::now()->year)
                ->whereIn('status', ['delivered', 'shipped', 'processing', 'completed'])
                ->sum('total');

            // Today's revenue
            $todayRevenue = Order::whereDate('created_at', Carbon::today())
                ->whereIn('status', ['delivered', 'shipped', 'processing', 'completed'])
                ->sum('total');

            // Order statistics
            $pendingOrders = Order::where('status', 'pending')->count();
            $processingOrders = Order::where('status', 'processing')->count();
            $shippedOrders = Order::where('status', 'shipped')->count();
            $deliveredOrders = Order::where('status', 'delivered')->count();
            $cancelledOrders = Order::where('status', 'cancelled')->count();

            // New users this month
            $newUsersThisMonth = User::whereMonth('created_at', Carbon::now()->month)
                ->whereYear('created_at', Carbon::now()->year)
                ->count();

            // Revenue by month (last 6 months)
            $revenueByMonth = Order::select(
                DB::raw('DATE_FORMAT(created_at, "%Y-%m") as month'),
                DB::raw('SUM(total) as revenue'),
                DB::raw('COUNT(*) as orders')
            )
                ->where('created_at', '>=', Carbon::now()->subMonths(6))
                ->whereIn('status', ['delivered', 'shipped', 'processing', 'completed'])
                ->groupBy('month')
                ->orderBy('month', 'desc')
                ->get();

            // Top selling products (last 30 days)
            $topProducts = DB::table('order_items')
                ->join('orders', 'order_items.order_id', '=', 'orders.id')
                ->join('products', 'order_items.product_id', '=', 'products.id')
                ->select(
                    'products.id',
                    'products.name',
                    DB::raw('SUM(order_items.quantity) as total_sold'),
                    DB::raw('SUM(order_items.quantity * order_items.price) as total_revenue')
                )
                ->where('orders.created_at', '>=', Carbon::now()->subDays(30))
                ->whereIn('orders.status', ['delivered', 'shipped', 'processing', 'completed'])
                ->groupBy('products.id', 'products.name')
                ->orderBy('total_sold', 'desc')
                ->limit(5)
                ->get();

            // Latest orders
            $latestOrders = Order::with(['user:id,name,email'])
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get()
                ->map(function ($order) {
                    return [
                        'id' => $order->id,
                        'order_number' => $order->order_number,
                        'customer_name' => $order->user->name ?? 'Guest',
                        'customer_email' => $order->user->email ?? '',
                        'total' => $order->total,
                        'status' => $order->status,
                        'created_at' => $order->created_at->format('Y-m-d H:i:s'),
                    ];
                });

            // Unread contact messages
            $unreadMessages = ContactMessage::where('is_read', false)->count();

            // Low stock variants (stock < 10)
            $lowStockProducts = Variant::where('stock', '<', 10)
                ->where('stock', '>', 0)
                ->where('status', 1)
                ->whereNull('deleted_at')
                ->count();

            // Out of stock variants
            $outOfStockProducts = Variant::where('stock', 0)
                ->where('status', 1)
                ->whereNull('deleted_at')
                ->count();

            // Average order value
            $averageOrderValue = Order::whereIn('status', ['delivered', 'shipped', 'processing', 'completed'])
                ->avg('total');

            // Sales growth (compare this month with last month)
            $lastMonthRevenue = Order::whereMonth('created_at', Carbon::now()->subMonth()->month)
                ->whereYear('created_at', Carbon::now()->subMonth()->year)
                ->whereIn('status', ['delivered', 'shipped', 'processing', 'completed'])
                ->sum('total');

            $revenueGrowth = $lastMonthRevenue > 0 
                ? (($monthlyRevenue - $lastMonthRevenue) / $lastMonthRevenue) * 100 
                : 0;

            // Order status distribution
            $orderStatusDistribution = Order::select('status', DB::raw('COUNT(*) as count'))
                ->groupBy('status')
                ->get()
                ->pluck('count', 'status');

            // Recent user registrations
            $recentUsers = User::orderBy('created_at', 'desc')
                ->limit(5)
                ->get(['id', 'name', 'email', 'created_at']);

            return response()->json([
                'success' => true,
                'data' => [
                    'overview' => [
                        'total_users' => $totalUsers,
                        'total_products' => $totalProducts,
                        'total_orders' => $totalOrders,
                        'monthly_revenue' => round($monthlyRevenue, 2),
                        'today_revenue' => round($todayRevenue, 2),
                        'average_order_value' => round($averageOrderValue, 2),
                        'revenue_growth' => round($revenueGrowth, 2),
                        'new_users_this_month' => $newUsersThisMonth,
                    ],
                    'orders' => [
                        'pending' => $pendingOrders,
                        'processing' => $processingOrders,
                        'shipped' => $shippedOrders,
                        'delivered' => $deliveredOrders,
                        'cancelled' => $cancelledOrders,
                        'status_distribution' => $orderStatusDistribution,
                    ],
                    'inventory' => [
                        'low_stock' => $lowStockProducts,
                        'out_of_stock' => $outOfStockProducts,
                    ],
                    'messages' => [
                        'unread' => $unreadMessages,
                    ],
                    'charts' => [
                        'revenue_by_month' => $revenueByMonth,
                        'top_products' => $topProducts,
                    ],
                    'latest_orders' => $latestOrders,
                    'recent_users' => $recentUsers,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
