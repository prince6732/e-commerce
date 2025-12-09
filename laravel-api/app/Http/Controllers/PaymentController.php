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
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    private $appId;
    private $secretKey;
    private $apiVersion;
    private $baseUrl;

    public function __construct()
    {
        $this->appId = env('CASHFREE_APP_ID');
        $this->secretKey = env('CASHFREE_SECRET_KEY');
        $this->apiVersion = env('CASHFREE_API_VERSION', '2023-08-01');
        $this->baseUrl = env('CASHFREE_BASE_URL', 'https://api.cashfree.com/pg');
    }

    public function initiatePayment(Request $request)
    {
        $request->validate([
            'shipping_address' => 'required|string',
            'billing_address' => 'nullable|string',
            'notes' => 'nullable|string',
            'cart_items' => 'sometimes|array',
            'cart_items.*' => 'integer|exists:carts,id',
            'product_id' => 'sometimes|integer|exists:products,id',
            'variant_id' => 'sometimes|integer|exists:variants,id',
            'quantity' => 'sometimes|integer|min:1',
            'selected_attributes' => 'nullable|array',
        ]);

        try {
            DB::beginTransaction();

            $userId = Auth::id();
            $user = Auth::user();
            $cartItems = collect();
            $isSingleItem = false;

            if ($request->has('product_id') && $request->has('variant_id')) {
                $isSingleItem = true;
                $product = Product::findOrFail($request->product_id);
                $variant = Variant::findOrFail($request->variant_id);

                if ($variant->product_id !== $product->id) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Invalid variant for the selected product',
                    ], 400);
                }

                if ($variant->stock < $request->quantity) {
                    return response()->json([
                        'success' => false,
                        'message' => "Insufficient stock. Only {$variant->stock} items available",
                    ], 400);
                }

                $itemTotal = $variant->sp * $request->quantity;

                // Create a mock object that behaves like a Cart model
                $cartItems->push((object)[
                    'product_id' => $product->id,
                    'variant_id' => $variant->id,
                    'quantity' => $request->quantity,
                    'price' => $variant->sp,
                    'total' => $itemTotal,
                    'selected_attributes' => $request->selected_attributes,
                    'product' => $product,
                    'variant' => $variant,
                ]);
            } else {
                $cartQuery = Cart::with(['product', 'variant'])
                    ->where('user_id', $userId);

                if ($request->has('cart_items') && !empty($request->cart_items)) {
                    $cartQuery->whereIn('id', $request->cart_items);
                }

                $cartItems = $cartQuery->get();

                if ($cartItems->isEmpty()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'No items in cart to order',
                    ], 400);
                }

                foreach ($cartItems as $item) {
                    if ($item->variant->stock < $item->quantity) {
                        return response()->json([
                            'success' => false,
                            'message' => "Insufficient stock for {$item->product->name} - {$item->variant->title}",
                        ], 400);
                    }
                }
            }

            $subtotal = $cartItems->sum('total');
            $shippingFee = 0;
            $tax = 0;
            $total = $subtotal + $shippingFee + $tax;

            $orderNumber = Order::generateOrderNumber();

            $order = Order::create([
                'order_number' => $orderNumber,
                'user_id' => $userId,
                'status' => 'pending',
                'payment_method' => 'online',
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

                // Reserve stock? Or wait until payment success?
                // Usually, we reserve stock to prevent overselling during payment.
                // If payment fails, we should release it.
                // For simplicity, let's decrement now and handle rollback if needed (or cron job to clean up pending orders).
                $cartItem->variant->decrement('stock', $cartItem->quantity);
            }

            $order->addTracking('pending', 'Order initiated, waiting for payment', 'Online Store');

            // Call Cashfree API
            Log::info('Cashfree Payment Request', [
                'app_id' => $this->appId,
                'base_url' => $this->baseUrl,
                'api_version' => $this->apiVersion,
            ]);

            // Determine return URL based on environment
            $origin = $request->header('Origin') ?? env('FRONTEND_URL', 'http://localhost:3000');
            
            // For production API, ensure HTTPS. For sandbox, HTTP is allowed.
            if (str_contains($this->baseUrl, 'sandbox')) {
                // Sandbox mode - HTTP allowed
                $returnUrl = $origin . "/checkout?order_id={order_id}";
            } else {
                // Production mode - force HTTPS or use a placeholder
                if (str_starts_with($origin, 'http://localhost') || str_starts_with($origin, 'http://127.0.0.1')) {
                    // Development environment with production keys - use placeholder
                    $returnUrl = "https://yourdomain.com/checkout?order_id={order_id}";
                    Log::warning('Using placeholder HTTPS URL for development with production Cashfree keys');
                } else {
                    $returnUrl = str_replace('http://', 'https://', $origin) . "/checkout?order_id={order_id}";
                }
            }

            $response = Http::withoutVerifying()->withHeaders([
                'x-client-id' => $this->appId,
                'x-client-secret' => $this->secretKey,
                'x-api-version' => $this->apiVersion,
                'Content-Type' => 'application/json',
            ])->post($this->baseUrl . '/orders', [
                'order_id' => $orderNumber,
                'order_amount' => (float)$total,
                'order_currency' => 'INR',
                'customer_details' => [
                    'customer_id' => (string)$userId,
                    'customer_email' => $user->email,
                    'customer_phone' => $user->phone_number ?? '9999999999', // Fallback if phone is missing
                    'customer_name' => $user->name,
                ],
                'order_meta' => [
                    'return_url' => $returnUrl,
                ]
            ]);

            Log::info('Cashfree Response Status: ' . $response->status());
            Log::info('Cashfree Response Body: ' . $response->body());

            if ($response->successful()) {
                $paymentData = $response->json();

                // Do NOT clear cart here. Wait for payment success.

                DB::commit();

                return response()->json([
                    'success' => true,
                    'payment_session_id' => $paymentData['payment_session_id'],
                    'order_id' => $order->id,
                    'order_number' => $orderNumber,
                ]);
            } else {
                DB::rollback();
                Log::error('Cashfree Order Creation Failed', ['response' => $response->body()]);
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to initiate payment gateway',
                    'error' => $response->json(),
                ], 500);
            }
        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'success' => false,
                'message' => 'Failed to initiate order',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function verifyPayment(Request $request)
    {
        $request->validate([
            'order_id' => 'required|string', // This is the Cashfree order_id (my order_number)
        ]);

        $orderNumber = $request->order_id;

        try {
            $response = Http::withoutVerifying()->withHeaders([
                'x-client-id' => $this->appId,
                'x-client-secret' => $this->secretKey,
                'x-api-version' => $this->apiVersion,
            ])->get($this->baseUrl . "/orders/{$orderNumber}");

            if ($response->successful()) {
                $orderData = $response->json();
                $orderStatus = $orderData['order_status'];

                $order = Order::where('order_number', $orderNumber)->firstOrFail();

                if ($orderStatus === 'PAID') {
                    if ($order->payment_status !== 'paid') {
                        $order->update([
                            'payment_status' => 'paid',
                            'status' => 'confirmed', // Or processing
                            'transaction_id' => $orderData['cf_order_id'] ?? null, // Or payment reference
                        ]);
                        $order->addTracking('confirmed', 'Payment successful', 'Online Store');

                        // Clear cart for the user
                        Cart::where('user_id', $order->user_id)->delete();
                    }
                } else {
                    // Handle failed/pending
                    // If failed, maybe restore stock?
                }

                return response()->json([
                    'success' => true,
                    'status' => $orderStatus,
                    'data' => $order,
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to verify payment',
                    'error' => $response->json(),
                ], 500);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error verifying payment',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Test Cashfree credentials
     */
    public function testCredentials()
    {
        try {
            return response()->json([
                'app_id' => $this->appId,
                'secret_key_preview' => substr($this->secretKey, 0, 10) . '...',
                'api_version' => $this->apiVersion,
                'base_url' => $this->baseUrl,
                'credentials_loaded' => !empty($this->appId) && !empty($this->secretKey),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
