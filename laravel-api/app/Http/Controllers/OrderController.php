<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Cart;
use App\Models\Product;
use App\Models\Variant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use App\Mail\DeliveryConfirmationMail;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = Order::with(['orderItems.product', 'orderItems.variant', 'trackingRecords'])
                ->where('user_id', Auth::id())
                ->orderBy('created_at', 'desc');

            if ($request->has('status') && $request->status) {
                $query->where('status', $request->status);
            }

            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where('order_number', 'like', "%{$search}%");
            }

            $orders = $query->paginate($request->get('per_page', 10));

            return response()->json([
                'success' => true,
                'data' => $orders,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch orders',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $order = Order::with(['orderItems.product', 'orderItems.variant', 'trackingRecords', 'user'])
                ->where('user_id', Auth::id())
                ->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $order,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found',
                'error' => $e->getMessage(),
            ], 404);
        }
    }

    public function placeOrderFromCart(Request $request)
    {
        $request->validate([
            'shipping_address' => 'required|string',
            'billing_address' => 'nullable|string',
            'notes' => 'nullable|string',
            'cart_items' => 'sometimes|array',
            'cart_items.*' => 'integer|exists:carts,id',
        ]);

        try {
            DB::beginTransaction();

            $userId = Auth::id();

            $cartQuery = Cart::with(['product', 'variant'])
                ->where('user_id', $userId);

            if ($request->has('cart_items') && !empty($request->cart_items)) {
                $cartQuery->whereIn('id', $request->cart_items);
            }

            $cartItems = $cartQuery->get();

            if ($cartItems->isEmpty()) {
                DB::rollback();
                return response()->json([
                    'success' => false,
                    'message' => 'Your cart is empty. Please add items to your cart before placing an order.',
                ], 400);
            }

            // Validate all items before creating order
            foreach ($cartItems as $item) {
                if (!$item->variant) {
                    DB::rollback();
                    Log::error('Cart item has no variant', [
                        'user_id' => $userId,
                        'cart_item_id' => $item->id,
                        'product_id' => $item->product_id,
                    ]);
                    return response()->json([
                        'success' => false,
                        'message' => 'Product variant not found. Please refresh your cart and try again.',
                    ], 400);
                }

                if ($item->variant->stock < $item->quantity) {
                    DB::rollback();
                    Log::warning('Insufficient stock during cart order', [
                        'user_id' => $userId,
                        'product_id' => $item->product_id,
                        'variant_id' => $item->variant_id,
                        'requested' => $item->quantity,
                        'available' => $item->variant->stock,
                    ]);
                    return response()->json([
                        'success' => false,
                        'message' => "Sorry! Only {$item->variant->stock} items are currently available for {$item->product->name}.",
                    ], 400);
                }
            }

            $subtotal = $cartItems->sum('total');
            $shippingFee = 0;
            $tax = 0;
            $total = $subtotal + $shippingFee + $tax;

            $order = Order::create([
                'order_number' => Order::generateOrderNumber(),
                'user_id' => $userId,
                'status' => 'pending',
                'payment_method' => 'cash_on_delivery',
                'payment_status' => 'pending',
                'subtotal' => $subtotal,
                'shipping_fee' => $shippingFee,
                'tax' => $tax,
                'total' => $total,
                'shipping_address' => $request->shipping_address,
                'billing_address' => $request->billing_address ?? $request->shipping_address,
                'notes' => $request->notes,
            ]);

            foreach ($cartItems as $cartItem) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $cartItem->product_id,
                    'variant_id' => $cartItem->variant_id,
                    'quantity' => $cartItem->quantity,
                    'price' => $cartItem->price,
                    'total' => $cartItem->total,
                    'selected_attributes' => $cartItem->selected_attributes,
                ]);

                $cartItem->variant->decrement('stock', $cartItem->quantity);
            }

            $order->addTracking('pending', 'Order placed successfully', 'Online Store');

            if ($request->has('cart_items') && !empty($request->cart_items)) {
                Cart::whereIn('id', $request->cart_items)->delete();
            } else {
                Cart::where('user_id', $userId)->delete();
            }

            DB::commit();

            $order->load(['orderItems.product', 'orderItems.variant', 'trackingRecords']);

            Log::info('Order placed successfully', [
                'user_id' => $userId,
                'order_id' => $order->id,
                'order_number' => $order->order_number,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Order placed successfully',
                'data' => $order,
            ]);
        } catch (\Exception $e) {
            DB::rollback();
            Log::error('Order placement failed', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to place order. Please try again.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function placeSingleItemOrder(Request $request)
    {
        $request->validate([
            'product_id' => 'required|integer|exists:products,id',
            'variant_id' => 'required|integer|exists:variants,id',
            'quantity' => 'required|integer|min:1',
            'selected_attributes' => 'nullable|array',
            'shipping_address' => 'required|string',
            'billing_address' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        try {
            DB::beginTransaction();

            $userId = Auth::id();
            $product = Product::findOrFail($request->product_id);
            $variant = Variant::findOrFail($request->variant_id);

            if ($variant->product_id !== $product->id) {
                DB::rollback();
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid variant for the selected product',
                ], 400);
            }

            if ($variant->stock < $request->quantity) {
                DB::rollback();
                Log::warning('Insufficient stock during single item order', [
                    'user_id' => $userId,
                    'product_id' => $request->product_id,
                    'variant_id' => $request->variant_id,
                    'requested' => $request->quantity,
                    'available' => $variant->stock,
                ]);
                return response()->json([
                    'success' => false,
                    'message' => "Sorry! Only {$variant->stock} items are currently available for this product.",
                ], 400);
            }

            $itemTotal = $variant->sp * $request->quantity;
            $subtotal = $itemTotal;
            $shippingFee = 0;
            $tax = 0;
            $total = $subtotal + $shippingFee + $tax;

            $order = Order::create([
                'order_number' => Order::generateOrderNumber(),
                'user_id' => $userId,
                'status' => 'pending',
                'payment_method' => 'cash_on_delivery',
                'payment_status' => 'pending',
                'subtotal' => $subtotal,
                'shipping_fee' => $shippingFee,
                'tax' => $tax,
                'total' => $total,
                'shipping_address' => $request->shipping_address,
                'billing_address' => $request->billing_address ?? $request->shipping_address,
                'notes' => $request->notes,
            ]);

            OrderItem::create([
                'order_id' => $order->id,
                'product_id' => $request->product_id,
                'variant_id' => $request->variant_id,
                'quantity' => $request->quantity,
                'price' => $variant->sp,
                'total' => $itemTotal,
                'selected_attributes' => $request->selected_attributes,
            ]);

            $variant->decrement('stock', $request->quantity);

            $order->addTracking('pending', 'Order placed successfully', 'Online Store');

            DB::commit();

            $order->load(['orderItems.product', 'orderItems.variant', 'trackingRecords']);

            Log::info('Single item order placed successfully', [
                'user_id' => $userId,
                'order_id' => $order->id,
                'order_number' => $order->order_number,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Order placed successfully',
                'data' => $order,
            ]);
        } catch (\Exception $e) {
            DB::rollback();
            Log::error('Single item order placement failed', [
                'user_id' => Auth::id(),
                'product_id' => $request->product_id ?? null,
                'variant_id' => $request->variant_id ?? null,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to place order. Please try again.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function cancelOrder($id)
    {
        try {
            DB::beginTransaction();

            $order = Order::where('user_id', Auth::id())
                ->where('id', $id)
                ->firstOrFail();

            if (!in_array($order->status, ['pending', 'confirmed'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Order cannot be cancelled',
                ], 400);
            }

            foreach ($order->orderItems as $item) {
                $item->variant->increment('stock', $item->quantity);
            }

            $order->updateStatus('cancelled', 'Order cancelled by customer');

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Order cancelled successfully',
                'data' => $order,
            ]);
        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'success' => false,
                'message' => 'Failed to cancel order',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function getTracking($id)
    {
        try {
            $order = Order::with([
                'trackingRecords' => function ($query) {
                    $query->orderBy('tracked_at', 'desc');
                },
                'orderItems.product',
                'orderItems.variant'
            ])
                ->where('user_id', Auth::id())
                ->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => [
                    'order' => $order,
                    'tracking_records' => $order->trackingRecords,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found',
                'error' => $e->getMessage(),
            ], 404);
        }
    }

    public function adminIndex(Request $request)
    {
        try {
            $query = Order::with(['orderItems.product', 'orderItems.variant', 'user', 'trackingRecords'])
                ->where('status', '!=', 'completed')
                ->orderBy('created_at', 'desc');

            if ($request->has('status') && $request->status) {
                $query->where('status', $request->status);
            }

            if ($request->has('from_date') && $request->from_date) {
                $query->whereDate('created_at', '>=', $request->from_date);
            }
            if ($request->has('to_date') && $request->to_date) {
                $query->whereDate('created_at', '<=', $request->to_date);
            }

            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('order_number', 'like', "%{$search}%")
                        ->orWhereHas('user', function ($userQuery) use ($search) {
                            $userQuery->where('name', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%");
                        });
                });
            }

            $orders = $query->paginate($request->get('per_page', 20));

            return response()->json([
                'success' => true,
                'data' => $orders,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch orders',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function adminShow($id)
    {
        try {
            $order = Order::with(['orderItems.product', 'orderItems.variant', 'trackingRecords', 'user'])
                ->findOrFail($id);

            return response()->json([
                'success' => true,
                'order' => $order,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found',
                'error' => $e->getMessage(),
            ], 404);
        }
    }

    public function adminUpdateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:pending,confirmed,processing,shipped,delivered,cancelled',
            'description' => 'required|string',
            'location' => 'nullable|string',
        ]);

        try {
            DB::beginTransaction();

            $order = Order::with(['orderItems.variant', 'user'])->findOrFail($id);

            if ($request->status === 'cancelled' && $order->status !== 'cancelled') {
                foreach ($order->orderItems as $item) {
                    $item->variant->increment('stock', $item->quantity);
                }
            }

            $order->updateStatus($request->status, $request->description, $request->location);

            if ($request->status === 'delivered' && !$order->delivery_confirmation_sent_at) {
                $order->load(['orderItems.product', 'orderItems.variant']);

                $token = $order->generateDeliveryConfirmationToken();
                $frontendUrl = env('FRONTEND_URL', 'http://localhost:3000');
                $confirmationUrl = $frontendUrl . '/confirm-delivery/' . $token;

                try {
                    Mail::to($order->user->email)->send(new DeliveryConfirmationMail($order, $confirmationUrl));
                    Log::info('Delivery confirmation email sent successfully to: ' . $order->user->email);
                } catch (\Exception $mailError) {
                    Log::error('Failed to send delivery confirmation email: ' . $mailError->getMessage());
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Order status updated successfully',
                'data' => $order->load(['trackingRecords']),
            ]);
        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'success' => false,
                'message' => 'Failed to update order status',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function getOrderStats()
    {
        try {
            $stats = [
                'total_orders' => Order::count(),
                'pending_orders' => Order::where('status', 'pending')->count(),
                'confirmed_orders' => Order::where('status', 'confirmed')->count(),
                'processing_orders' => Order::where('status', 'processing')->count(),
                'shipped_orders' => Order::where('status', 'shipped')->count(),
                'delivered_orders' => Order::where('status', 'delivered')->count(),
                'cancelled_orders' => Order::where('status', 'cancelled')->count(),
                'completed_orders' => Order::where('status', 'completed')->count(),
                'total_revenue' => Order::whereIn('status', ['delivered', 'completed'])->sum('total'),
                'todays_orders' => Order::whereDate('created_at', today())->count(),
                'this_month_orders' => Order::whereMonth('created_at', now()->month)->count(),
            ];

            return response()->json([
                'success' => true,
                'data' => $stats,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch order statistics',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function confirmDelivery($token)
    {
        try {
            $order = Order::where('delivery_confirmation_token', $token)
                ->with(['user', 'orderItems.product'])
                ->first();

            if (!$order) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid or expired confirmation link',
                ], 404);
            }

            if ($order->delivery_confirmed_at) {
                return response()->json([
                    'success' => false,
                    'message' => 'This order has already been confirmed',
                    'data' => [
                        'order' => $order,
                        'confirmed_at' => $order->delivery_confirmed_at,
                    ],
                ], 400);
            }

            if ($order->status !== 'delivered') {
                return response()->json([
                    'success' => false,
                    'message' => 'This order is not in delivered status',
                ], 400);
            }

            $order->confirmDelivery();

            return response()->json([
                'success' => true,
                'message' => 'Thank you! Your order has been confirmed and marked as completed.',
                'data' => $order->load('trackingRecords'),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to confirm delivery',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function getOrderByToken($token)
    {
        try {
            $order = Order::where('delivery_confirmation_token', $token)
                ->with(['user', 'orderItems.product', 'orderItems.variant', 'trackingRecords'])
                ->first();

            if (!$order) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid confirmation link',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $order,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch order details',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function getCompletedOrders(Request $request)
    {
        try {
            $query = Order::with([
                'orderItems.product',
                'orderItems.variant',
                'user',
                'trackingRecords' => function ($q) {
                    $q->orderBy('tracked_at', 'asc');
                }
            ])
                ->where('status', 'completed')
                ->orderBy('delivery_confirmed_at', 'desc');

            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('order_number', 'like', "%{$search}%")
                        ->orWhereHas('user', function ($userQuery) use ($search) {
                            $userQuery->where('name', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%");
                        });
                });
            }

            if ($request->has('from_date') && $request->from_date) {
                $query->whereDate('delivery_confirmed_at', '>=', $request->from_date);
            }
            if ($request->has('to_date') && $request->to_date) {
                $query->whereDate('delivery_confirmed_at', '<=', $request->to_date);
            }

            $orders = $query->paginate($request->get('per_page', 20));

            return response()->json([
                'success' => true,
                'data' => $orders,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch completed orders',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function getCompletedOrderDetails($id)
    {
        try {
            $order = Order::with([
                'orderItems.product',
                'orderItems.variant',
                'user',
                'trackingRecords' => function ($q) {
                    $q->orderBy('tracked_at', 'asc');
                }
            ])
                ->where('status', 'completed')
                ->findOrFail($id);

            $orderPlacedAt = $order->created_at;
            $orderCompletedAt = $order->delivery_confirmed_at;
            $durationInDays = $orderPlacedAt->diffInDays($orderCompletedAt);
            $durationInHours = $orderPlacedAt->diffInHours($orderCompletedAt);

            $timeline = $order->trackingRecords->map(function ($record) {
                return [
                    'id' => $record->id,
                    'status' => $record->status,
                    'description' => $record->description,
                    'location' => $record->location,
                    'tracked_at' => $record->tracked_at,
                    'formatted_date' => $record->tracked_at->format('M d, Y h:i A'),
                ];
            });

            $statusDurations = [];
            $trackingRecords = $order->trackingRecords->toArray();
            for ($i = 0; $i < count($trackingRecords) - 1; $i++) {
                $current = $trackingRecords[$i];
                $next = $trackingRecords[$i + 1];
                $duration = \Carbon\Carbon::parse($current['tracked_at'])
                    ->diffForHumans(\Carbon\Carbon::parse($next['tracked_at']), true);
                $statusDurations[$current['status']] = $duration;
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'order' => $order,
                    'timeline' => $timeline,
                    'duration' => [
                        'days' => $durationInDays,
                        'hours' => $durationInHours,
                        'formatted' => $durationInDays > 0
                            ? "{$durationInDays} days"
                            : "{$durationInHours} hours"
                    ],
                    'status_durations' => $statusDurations,
                    'order_placed_at' => $order->created_at->format('M d, Y h:i A'),
                    'order_completed_at' => $order->delivery_confirmed_at->format('M d, Y h:i A'),
                    'shipped_at' => $order->shipped_at ? $order->shipped_at->format('M d, Y h:i A') : null,
                    'delivered_at' => $order->delivered_at ? $order->delivered_at->format('M d, Y h:i A') : null,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch order details',
                'error' => $e->getMessage(),
            ], 404);
        }
    }
}
