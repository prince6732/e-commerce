<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ImageController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\SubCategoryController;
use App\Http\Controllers\SliderController;
use App\Http\Controllers\AttributeController;
use App\Http\Controllers\AttributeValueController;
use App\Http\Controllers\BrandController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\VariantAttributeValueController;
use App\Http\Controllers\VariantController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\ContactMessageController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\LikeController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\ThemesController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\DelhiveryController;

// ==========================================
// PUBLIC ROUTES (No Authentication Required)
// ==========================================

// Auth routes
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/verify-email-code', [AuthController::class, 'verify']);
Route::post('/verify-otp', [AuthController::class, 'verifyOTP']);
Route::post('/resend-otp', [AuthController::class, 'resendOTP']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);
Route::post('/auth/google', [AuthController::class, 'googleLogin']);

// Public product routes
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products-paginated', [ProductController::class, 'getAllProductsPaginated']);
Route::get('/products/{id}', [ProductController::class, 'show']);
Route::get('/get-product/{product}', [ProductController::class, 'getProductById']);
Route::get('/search-products', [ProductController::class, 'search']);
Route::get('/get-products-by-category/{categoryId}', [ProductController::class, 'getSubcategoryProduct']);
Route::get('/get-similar-products/{productId}', [ProductController::class, 'getSimilarProducts']);

// Public category routes (for navigation)
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/get-category/{category}', [CategoryController::class, 'show']);
Route::get('/get-category-for-product/{category}', [CategoryController::class, 'getCategoryByIdForProduct']);

// Analytics routes
Route::get('/most-ordered-products', [ProductController::class, 'getMostOrderedProducts']);
Route::get('/top-selling-products', [ProductController::class, 'getTopSellingProducts']);
Route::get('/debug-order-data', [ProductController::class, 'debugOrderData']);
Route::get('/subcategories-with-products', [CategoryController::class, 'getSubcategoriesWithProductCounts']);

// Public subcategory routes
Route::get('/subcategories', [SubCategoryController::class, 'index']);
Route::get('/get-subcategory/{subcategory}', [SubCategoryController::class, 'show']);

// Public brand routes (for filtering)
Route::get('/brands', [BrandController::class, 'index']);
Route::get('/brands/{brand}', [BrandController::class, 'show']);
Route::get('/brands/{brand}/products', [BrandController::class, 'getProducts']);
Route::get('/get-brand/{brand}', [BrandController::class, 'show']);

// Public attribute routes (for product filtering)
Route::get('/attributes', [AttributeController::class, 'index']);
Route::get('/get-attribute/{attribute}', [AttributeController::class, 'show']);
Route::get('/attribute-values', [AttributeValueController::class, 'index']);
Route::get('/get-attribute-value/{attributeValue}', [AttributeValueController::class, 'show']);

// Public slider routes (for homepage)
Route::get('/sliders', [SliderController::class, 'index']);
Route::get('/get-sliders/{id}', [SliderController::class, 'show']);

// Public settings routes (for app configuration)
Route::get('/settings', [SettingController::class, 'index']);

// Public variant routes (for product details)
Route::get('/variants', [VariantController::class, 'index']);
Route::get('/get-variant/{variant}', [VariantController::class, 'show']);
Route::get('/variant/{variant}/attribute-values', [VariantAttributeValueController::class, 'index']);

// Public review routes (for viewing reviews)
Route::get('/products/{productId}/reviews', [ReviewController::class, 'index']);
Route::get('/reviews/{reviewId}', [ReviewController::class, 'show']);

Route::get('/themes', [ThemesController::class, 'index']);

// Delivery confirmation (public - accessed via email link)
Route::get('/confirm-delivery/{token}', [OrderController::class, 'getOrderByToken']);
Route::post('/confirm-delivery/{token}', [OrderController::class, 'confirmDelivery']);

// Delhivery Webhook (public - called by Delhivery servers)
Route::post('/delhivery/webhook', [\App\Http\Controllers\DelhiveryWebhookController::class, 'handleWebhook']);

// Test Cashfree credentials (for debugging - remove in production)
Route::get('/test-cashfree', [PaymentController::class, 'testCredentials']);

// Contact us route (public)
Route::post('/contact-us', [ContactMessageController::class, 'store']);

// ==========================================
// PROTECTED ROUTES (Authentication Required)
// ==========================================

Route::middleware(['auth:sanctum', 'check.user.status'])->group(function () {

    // ========== USER MANAGEMENT ==========
    Route::get('/user', [AuthController::class, 'me']);
    Route::get('/all_users', [AuthController::class, 'allUser']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // ========== ADMIN ONLY ROUTES ==========
    Route::middleware('role:Admin')->group(function () {
        // Dashboard Statistics
        Route::get('/admin/dashboard/statistics', [DashboardController::class, 'getStatistics']);

        // User Management
        Route::get('/admin/users', [UserController::class, 'index']);
        Route::get('/admin/users/statistics', [UserController::class, 'getStatistics']);
        Route::get('/admin/users/{id}', [UserController::class, 'show']);
        Route::post('/admin/users/{id}/block', [UserController::class, 'blockUser']);
        Route::post('/admin/users/{id}/unblock', [UserController::class, 'unblockUser']);
        Route::post('/admin/users/{id}/toggle-status', [UserController::class, 'toggleStatus']);

        // Contact Messages
        Route::get('/admin/contact-messages', [ContactMessageController::class, 'index']);
        Route::get('/admin/contact-messages/{id}', [ContactMessageController::class, 'show']);
        Route::patch('/admin/contact-messages/{id}/mark-read', [ContactMessageController::class, 'markAsRead']);
        Route::delete('/admin/contact-messages/{id}', [ContactMessageController::class, 'destroy']);

        // Order Management
        Route::get('/admin/orders', [OrderController::class, 'adminIndex']);
        Route::get('/admin/orders/stats', [OrderController::class, 'getOrderStats']);
        Route::get('/admin/orders/completed', [OrderController::class, 'getCompletedOrders']);
        Route::get('/admin/orders/completed/{id}', [OrderController::class, 'getCompletedOrderDetails']);
        Route::get('/admin/orders/{id}', [OrderController::class, 'adminShow']);
        Route::patch('/admin/orders/{id}/status', [OrderController::class, 'adminUpdateStatus']);

        // Image Management
        Route::get('/images/get-files/{directory}', [ImageController::class, 'getFiles']);
        Route::post('/images/upload', [ImageController::class, 'upload']);
        Route::delete('/images', [ImageController::class, 'delete']);

        // Delhivery Management
        Route::post('/delhivery/orders/{orderId}/create-shipment', [DelhiveryController::class, 'createShipment']);
        Route::post('/delhivery/orders/{orderId}/cancel-shipment', [DelhiveryController::class, 'cancelShipment']);
        Route::get('/delhivery/orders/{orderId}/sync-tracking', [DelhiveryController::class, 'syncTracking']);
        Route::get('/delhivery/warehouses', [DelhiveryController::class, 'getWarehouses']);
    });

    // ========== DELHIVERY PUBLIC ENDPOINTS ==========
    Route::post('/delhivery/check-serviceability', [DelhiveryController::class, 'checkServiceability']);
    Route::post('/delhivery/track-waybill', [DelhiveryController::class, 'trackByWaybill']);

    // ========== USER PROFILE ==========
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::put('/change-password', [ProfileController::class, 'changePassword']);
    Route::post('/profile/upload-picture', [ProfileController::class, 'uploadProfilePicture']);
    Route::delete('/profile/delete-picture', [ProfileController::class, 'deleteProfilePicture']);

    // ========== ADMIN: CATEGORY MANAGEMENT ==========
    Route::post('/create-categories', [CategoryController::class, 'store']);
    Route::put('/update-category/{category}', [CategoryController::class, 'update']);
    Route::delete('/delete-category/{category}', [CategoryController::class, 'destroy']);

    // ========== ADMIN: SUBCATEGORY MANAGEMENT ==========
    Route::post('/create-subcategory', [SubCategoryController::class, 'store']);
    Route::put('/update-subcategory/{subcategory}', [SubCategoryController::class, 'update']);
    Route::delete('/delete-subcategory/{subcategory}', [SubCategoryController::class, 'destroy']);

    // ========== ADMIN: ATTRIBUTE MANAGEMENT ==========
    Route::post('/create-attribute', [AttributeController::class, 'store']);
    Route::put('/update-attribute/{attribute}', [AttributeController::class, 'update']);
    Route::delete('/delete-attribute/{attribute}', [AttributeController::class, 'destroy']);
    Route::post('/create-attribute-value', [AttributeValueController::class, 'store']);
    Route::put('/update-attribute-value/{attributeValue}', [AttributeValueController::class, 'update']);
    Route::delete('/delete-attribute-value/{attributeValue}', [AttributeValueController::class, 'destroy']);

    // ========== ADMIN: BRAND MANAGEMENT ==========
    Route::post('/create-brand', [BrandController::class, 'store']);
    Route::put('/update-brand/{brand}', [BrandController::class, 'update']);
    Route::delete('/delete-brand/{brand}', [BrandController::class, 'destroy']);

    // ========== ADMIN: PRODUCT MANAGEMENT ==========
    Route::get('/admin-products', [ProductController::class, 'getAdminProducts']);
    Route::get('/admin-product-details/{product}', [ProductController::class, 'getProductDetails']);
    Route::post('/create-product', [ProductController::class, 'store']);
    Route::put('/update-product/{product}', [ProductController::class, 'update']);
    Route::delete('/delete-product/{product}', [ProductController::class, 'destroy']);
    Route::get('/admin-search-products', [ProductController::class, 'search']);

    // ========== ADMIN: VARIANT MANAGEMENT ==========
    Route::delete('/delete-variant/{variant}', [ProductController::class, 'deleteVariant']);
    Route::post('/create-variant', [VariantController::class, 'store']);
    Route::put('/update-variant/{variant}', [VariantController::class, 'update']);
    Route::delete('/delete-variant/{variant}', [VariantController::class, 'destroy']);
    Route::post('/variant/{variant}/attach-attribute-values', [VariantAttributeValueController::class, 'store']);
    Route::delete('/variant/{variant}/detach-attribute-value/{attributeValue}', [VariantAttributeValueController::class, 'destroy']);

    // ========== ADMIN: SLIDER MANAGEMENT ==========
    Route::post('/create-sliders', [SliderController::class, 'store']);
    Route::put('/update-sliders/{slider}', [SliderController::class, 'update']);
    Route::delete('/delete-sliders/{slider}', [SliderController::class, 'destroy']);
    Route::patch('/sliders/{id}/status', [SliderController::class, 'changeStatus']);
    Route::post('/order', [SliderController::class, 'updateOrder']);

    // ========== ADMIN: SETTINGS MANAGEMENT ==========
    Route::put('/update-settings/{setting}', [SettingController::class, 'update']);

    // ========== USER: CART MANAGEMENT ==========
    Route::get('/cart', [CartController::class, 'index']);
    Route::post('/cart/add', [CartController::class, 'store']);
    Route::put('/cart/{id}', [CartController::class, 'update']);
    Route::delete('/cart/{id}', [CartController::class, 'destroy']);
    Route::delete('/cart', [CartController::class, 'clear']);
    Route::get('/cart/count', [CartController::class, 'getCartCount']);

    // ========== USER: LIKE/WISHLIST MANAGEMENT ==========
    Route::post('/likes/toggle', [LikeController::class, 'toggle']);
    Route::get('/likes', [LikeController::class, 'getUserLikes']);
    Route::post('/likes/check', [LikeController::class, 'checkLikeStatus']);
    Route::post('/likes/bulk-check', [LikeController::class, 'getProductsLikesStatus']);

    Route::post('/create-themes', [ThemesController::class, 'store']);
    Route::get('/themes/{id}', [ThemesController::class, 'show']);
    Route::put('/themes/{id}', [ThemesController::class, 'update']);
    Route::delete('/themes/{id}', [ThemesController::class, 'destroy']);

    // ========== USER: REVIEW MANAGEMENT ==========
    Route::post('/reviews', [ReviewController::class, 'store']);
    Route::put('/reviews/{reviewId}', [ReviewController::class, 'update']);
    Route::delete('/reviews/{reviewId}', [ReviewController::class, 'destroy']);
    Route::post('/reviews/{reviewId}/helpful', [ReviewController::class, 'toggleHelpful']);
    Route::get('/products/{productId}/my-review', [ReviewController::class, 'getUserReview']);

    // ========== USER: ORDER MANAGEMENT ==========
    Route::get('/orders', [OrderController::class, 'index']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);
    Route::post('/orders/place-from-cart', [OrderController::class, 'placeOrderFromCart']);
    Route::post('/orders/place-single-item', [OrderController::class, 'placeSingleItemOrder']);
    Route::patch('/orders/{id}/cancel', [OrderController::class, 'cancelOrder']);
    Route::get('/orders/{id}/tracking', [OrderController::class, 'getTracking']);
    Route::get('/orders/{orderId}/delhivery-tracking', [DelhiveryController::class, 'trackByOrder']);

    // ========== USER: PAYMENT MANAGEMENT ==========
    Route::post('/payment/initiate', [PaymentController::class, 'initiatePayment']);
    Route::post('/payment/verify', [PaymentController::class, 'verifyPayment']);
});
