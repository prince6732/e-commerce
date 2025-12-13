<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class UserController extends Controller
{
    /**
     * Get all users with basic info (for admin dashboard list)
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $perPage   = $request->get('per_page', 15);
            $search    = $request->get('search');
            $status    = $request->get('status'); // 'active', 'blocked', 'all'
            $sortBy    = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');

            $query = User::with('roles')
                ->withCount(['orders', 'reviews', 'likes'])

                // 🚫 Exclude Admin users
                ->whereDoesntHave('roles', function ($q) {
                    $q->where('name', 'Admin');
                });

            // 🔍 Search filter
            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone_number', 'like', "%{$search}%");
                });
            }

            // 📌 Status filter
            if ($status === 'active') {
                $query->where('status', true);
            } elseif ($status === 'blocked') {
                $query->where('status', false);
            }

            // ↕ Sorting
            $query->orderBy($sortBy, $sortOrder);

            $users = $query->paginate($perPage);

            return response()->json([
                'res'     => 'success',
                'users'   => $users,
                'message' => 'Users fetched successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'res'     => 'error',
                'message' => 'Failed to fetch users',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }


    /**
     * Get detailed user information by ID (for admin dashboard detail view)
     */
    public function show($id): JsonResponse
    {
        try {
            $user = User::with(['roles'])
                ->withCount(['orders', 'reviews', 'likes'])
                ->findOrFail($id);

            // Get user's orders with details
            $orders = $user->orders()
                ->with(['orderItems.product:id,name,image_url'])
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get()
                ->map(function ($order) {
                    return [
                        'id' => $order->id,
                        'order_number' => $order->order_number,
                        'total_amount' => $order->total,
                        'status' => $order->status,
                        'payment_status' => $order->payment_status,
                        'items_count' => $order->orderItems->count(),
                        'items' => $order->orderItems->map(function ($item) {
                            return [
                                'id' => $item->id,
                                'product_name' => $item->product->name ?? 'Unknown Product',
                                'product_image' => $item->product->image_url ?? null,
                                'quantity' => $item->quantity,
                                'price' => $item->price,
                                'total' => $item->total,
                            ];
                        }),
                        'created_at' => $order->created_at,
                        'formatted_date' => $order->created_at->format('M d, Y'),
                    ];
                });

            // Get user's reviews with product details
            $reviews = $user->reviews()
                ->with(['product:id,name,image_url'])
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get()
                ->map(function ($review) {
                    return [
                        'id' => $review->id,
                        'product_id' => $review->product_id,
                        'product_name' => $review->product->name ?? 'Unknown',
                        'product_image' => $review->product->image_url ?? null,
                        'rating' => $review->rating,
                        'title' => $review->title,
                        'review_text' => $review->review_text,
                        'is_approved' => $review->is_approved,
                        'helpful_count' => $review->helpful_count,
                        'created_at' => $review->created_at,
                        'formatted_date' => $review->created_at->format('M d, Y'),
                    ];
                });

            // Get user's liked products
            $likedProducts = $user->likedProducts()
                ->select('products.id', 'products.name', 'products.image_url')
                ->with('variants:id,product_id,sp')
                ->limit(10)
                ->get()
                ->map(function ($product) {
                    return [
                        'id' => $product->id,
                        'name' => $product->name,
                        'image_url' => $product->image_url,
                        'price' => $product->variants->first()->sp ?? 0,
                    ];
                });

            // Calculate user statistics
            $totalSpent = $user->orders()
                ->where('payment_status', 'paid')
                ->sum('total');

            $stats = [
                'total_orders' => $user->orders_count,
                'total_reviews' => $user->reviews_count,
                'total_likes' => $user->likes_count,
                'total_spent' => (float) $totalSpent,
                'average_order_value' => $user->orders_count > 0 ? (float) ($totalSpent / $user->orders_count) : 0,
                'account_status' => $user->status ? 'active' : 'blocked',
                'is_verified' => $user->is_verified,
                'member_since' => $user->created_at->format('M d, Y'),
            ];

            return response()->json([
                'res' => 'success',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone_number' => $user->phone_number,
                    'address' => $user->address,
                    'profile_picture' => $user->profile_picture,
                    'status' => $user->status,
                    'is_verified' => $user->is_verified,
                    'email_verified_at' => $user->email_verified_at,
                    'created_at' => $user->created_at,
                    'updated_at' => $user->updated_at,
                    'roles' => $user->roles->pluck('name'),
                ],
                'stats' => $stats,
                'recent_orders' => $orders,
                'recent_reviews' => $reviews,
                'liked_products' => $likedProducts,
                'message' => 'User details fetched successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'res' => 'error',
                'message' => 'Failed to fetch user details',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Block a user (set status to false)
     */
    public function blockUser($id): JsonResponse
    {
        try {
            $user = User::findOrFail($id);

            // Prevent blocking admin users
            if ($user->hasRole('Admin')) {
                return response()->json([
                    'res' => 'error',
                    'message' => 'Cannot block admin users'
                ], 403);
            }

            $user->update(['status' => false]);

            // Revoke all user's tokens to log them out
            $user->tokens()->delete();

            return response()->json([
                'res' => 'success',
                'message' => 'User has been blocked successfully',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'status' => $user->status
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'res' => 'error',
                'message' => 'Failed to block user',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Unblock a user (set status to true)
     */
    public function unblockUser($id): JsonResponse
    {
        try {
            $user = User::findOrFail($id);

            $user->update(['status' => true]);

            return response()->json([
                'res' => 'success',
                'message' => 'User has been unblocked successfully',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'status' => $user->status
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'res' => 'error',
                'message' => 'Failed to unblock user',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Toggle user status (block/unblock)
     */
    public function toggleStatus($id): JsonResponse
    {
        try {
            $user = User::findOrFail($id);

            // Prevent blocking admin users
            if ($user->hasRole('Admin') && $user->status) {
                return response()->json([
                    'res' => 'error',
                    'message' => 'Cannot block admin users'
                ], 403);
            }

            $newStatus = !$user->status;
            $user->update(['status' => $newStatus]);

            // If blocking, revoke all tokens
            if (!$newStatus) {
                $user->tokens()->delete();
            }

            return response()->json([
                'res' => 'success',
                'message' => $newStatus ? 'User unblocked successfully' : 'User blocked successfully',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'status' => $user->status
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'res' => 'error',
                'message' => 'Failed to toggle user status',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get user statistics summary for dashboard
     */
    public function getStatistics(): JsonResponse
    {
        try {
            $totalUsers = User::count();
            $activeUsers = User::where('status', true)->count();
            $blockedUsers = User::where('status', false)->count();
            $verifiedUsers = User::where('is_verified', true)->count();
            $newUsersThisMonth = User::whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->count();

            return response()->json([
                'res' => 'success',
                'statistics' => [
                    'total_users' => $totalUsers,
                    'active_users' => $activeUsers,
                    'blocked_users' => $blockedUsers,
                    'verified_users' => $verifiedUsers,
                    'new_users_this_month' => $newUsersThisMonth,
                    'verification_rate' => $totalUsers > 0 ? round(($verifiedUsers / $totalUsers) * 100, 1) : 0,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'res' => 'error',
                'message' => 'Failed to fetch statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
