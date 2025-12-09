"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Script from 'next/script';
import axios from "../../../../utils/axios";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, MapPin, CreditCard, CheckCircle2, Package, X, Loader2 } from "lucide-react";
import Image from "next/image";
import { placeOrderFromCart } from "../../../../utils/orderApi";
import imgPlaceholder from "@/public/imagePlaceholder.png";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Modal from "@/components/(sheared)/Modal";

const basePath = process.env.NEXT_PUBLIC_UPLOAD_BASE || "https://api.zelton.co.in";

interface ShippingFormData {
    fullName: string;
    phoneNumber: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
}

// Yup validation schema
const shippingSchema = yup.object({
    fullName: yup
        .string()
        .required("Full name is required")
        .min(2, "Full name must be at least 2 characters")
        .max(50, "Full name must be less than 50 characters")
        .matches(/^[a-zA-Z\s]+$/, "Full name can only contain letters and spaces"),
    phoneNumber: yup
        .string()
        .required("Phone number is required")
        .matches(/^[0-9]{10}$/, "Please enter a valid 10-digit phone number"),
    addressLine1: yup
        .string()
        .required("Address is required")
        .min(5, "Address must be at least 5 characters")
        .max(100, "Address must be less than 100 characters"),
    addressLine2: yup
        .string()
        .default("")
        .max(100, "Address line 2 must be less than 100 characters"),
    city: yup
        .string()
        .required("City is required")
        .min(2, "City must be at least 2 characters")
        .max(50, "City must be less than 50 characters")
        .matches(/^[a-zA-Z\s]+$/, "City can only contain letters and spaces"),
    state: yup
        .string()
        .required("State is required")
        .min(2, "State must be at least 2 characters")
        .max(50, "State must be less than 50 characters")
        .matches(/^[a-zA-Z\s]+$/, "State can only contain letters and spaces"),
    postalCode: yup
        .string()
        .required("Postal code is required")
        .matches(/^[0-9]{6}$/, "Please enter a valid 6-digit postal code"),
    country: yup
        .string()
        .required("Country is required"),
}).required();

function CheckoutPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, loading: authLoading } = useAuth();
    const { items, total, count, loading: cartLoading, clearCart } = useCart();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('cod');

    // Payment Verification State
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
    const [paymentMessage, setPaymentMessage] = useState("Verifying payment...");

    // Toast notification state
    const [showToast, setShowToast] = useState(false);
    const [toastType, setToastType] = useState<"success" | "error" | "info" | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // React Hook Form with Yup validation
    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        getValues,
        formState: { errors },
    } = useForm<ShippingFormData>({
        resolver: yupResolver(shippingSchema),
        defaultValues: {
            fullName: "",
            phoneNumber: "",
            addressLine1: "",
            addressLine2: "",
            city: "",
            state: "",
            postalCode: "",
            country: "India",
        },
    });

    // Toast notification helper
    const showToastMessage = (message: string, type: "success" | "error" | "info") => {
        setToastMessage(message);
        setToastType(type);
        setShowToast(true);
    };

    // Auto-hide toast after 4 seconds
    useEffect(() => {
        if (showToast) {
            const timer = setTimeout(() => {
                setShowToast(false);
                setToastMessage(null);
                setToastType(null);
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [showToast]);

    useEffect(() => {
        // Wait for auth to finish loading before making redirect decisions
        if (authLoading) return;

        if (!user) {
            router.push('/login');
            return;
        }

        // Wait for cart to load before checking if it's empty
        if (cartLoading) return;

        if (items.length === 0) {
            router.push('/cart');
        }
    }, [user, authLoading, items, cartLoading, router]);

    // Check for payment return
    useEffect(() => {
        const orderId = searchParams.get("order_id");
        if (orderId) {
            verifyPayment(orderId);
        }
    }, [searchParams]);

    const verifyPayment = async (orderId: string) => {
        setShowPaymentModal(true);
        setPaymentStatus('verifying');
        setPaymentMessage("Verifying your payment...");

        try {
            const response = await axios.post(`/api/payment/verify`, {
                order_id: orderId
            });

            if (response.data.success && response.data.status === 'PAID') {
                setPaymentStatus('success');
                setPaymentMessage("Payment successful! Redirecting to orders...");
                
                // Clear cart locally as well to be safe
                await clearCart();

                setTimeout(() => {
                    router.push('/orders');
                }, 3000);
            } else {
                setPaymentStatus('failed');
                setPaymentMessage("Payment failed or pending. Please try again.");
                setTimeout(() => {
                    setShowPaymentModal(false);
                    // Remove query params
                    router.replace('/checkout');
                }, 3000);
            }
        } catch (error) {
            console.error("Payment verification failed:", error);
            setPaymentStatus('failed');
            setPaymentMessage("Failed to verify payment.");
            setTimeout(() => {
                setShowPaymentModal(false);
                router.replace('/checkout');
            }, 3000);
        }
    };

    // Update form data when user changes
    useEffect(() => {
        if (user) {
            setValue("fullName", user.name || "");
            setValue("phoneNumber", user.phone_number || "");
        }
    }, [user, setValue]);

    const handleNextStep = handleSubmit(() => {
        if (currentStep === 1) {
            setCurrentStep(2);
        } else if (currentStep === 2) {
            setCurrentStep(3);
        }
    });

    const handlePreviousStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handlePlaceOrder = handleSubmit(async (data: ShippingFormData) => {
        setLoading(true);
        try {
            const shippingAddress = `${data.fullName}\n${data.phoneNumber}\n${data.addressLine1}\n${data.addressLine2 ? data.addressLine2 + '\n' : ''}${data.city}, ${data.state} ${data.postalCode}\n${data.country}`;

            const orderData = {
                shipping_address: shippingAddress,
                billing_address: shippingAddress,
                notes: "Order placed via checkout"
            };

            if (paymentMethod === 'online') {
                try {
                    const response = await axios.post(`/api/payment/initiate`, orderData);

                    if (response.data.success) {
                        const { payment_session_id } = response.data;
                        
                        const cashfree = new (window as any).Cashfree({
                            mode: "sandbox"
                        });

                        cashfree.checkout({
                            paymentSessionId: payment_session_id,
                            redirectTarget: "_self"
                        });
                    } else {
                        showToastMessage(response.data.message || "Failed to initiate payment", "error");
                        setLoading(false);
                    }
                } catch (error: any) {
                    console.error("Payment initiation failed:", error);
                    showToastMessage(error.response?.data?.message || "Failed to initiate payment", "error");
                    setLoading(false);
                }
                return; // Stop here, let Cashfree handle the rest
            }

            const response = await placeOrderFromCart(orderData);

            if (response.success) {
                try {
                    // Clear the cart after successful order placement
                    const cartCleared = await clearCart();
                    if (!cartCleared) {
                        console.warn("Order placed successfully but failed to clear cart");
                        showToastMessage("Order placed successfully, but cart clearing failed. Page will refresh to update cart.", "info");
                        // Force refresh cart to ensure it's updated after a delay
                        setTimeout(() => {
                            window.location.reload();
                        }, 2000);
                        return;
                    }

                    // Show success message
                    showToastMessage(`🎉 Order placed successfully! Order Number: ${response.data?.order_number || 'N/A'}`, "success");

                    // Navigate to orders page after a brief delay
                    setTimeout(() => {
                        router.push(`/orders`);
                    }, 2000);
                } catch (error) {
                    console.error("Error clearing cart after order placement:", error);
                    // Still navigate even if cart clearing fails
                    showToastMessage(`🎉 Order placed successfully! Order Number: ${response.data?.order_number || 'N/A'}`, "success");
                    setTimeout(() => {
                        router.push(`/orders`);
                    }, 2000);
                }
            } else {
                showToastMessage(response.message || "❌ Failed to place order. Please try again.", "error");
            }
        } catch (error) {
            console.error("Order placement failed:", error);
            showToastMessage("❌ Failed to place order. Please check your connection and try again.", "error");
        } finally {
            if (paymentMethod !== 'online') {
                setLoading(false);
            }
        }
    });

    const subtotal = total;
    const taxRate = 0; // 0% tax
    const tax = Math.round(subtotal * taxRate);
    const shipping = subtotal > 500 ? 0 : 50; // Free shipping above ₹500
    const finalTotal = subtotal + tax + shipping;

    // Get current form values for display
    const currentFormData = getValues();

    if (cartLoading || authLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
                <div className="container mx-auto px-4 py-16">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading For Checkout...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
                    <div className="flex items-center gap-4 mb-6">
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
                            <p className="text-gray-600">Complete your purchase</p>
                        </div>
                    </div>

                    {/* Progress Steps */}
                    <div className="flex items-center justify-center gap-8 mb-8">
                        {[
                            { step: 1, label: "Shipping", icon: MapPin },
                            { step: 2, label: "Payment", icon: CreditCard },
                            { step: 3, label: "Review", icon: CheckCircle2 },
                        ].map(({ step, label, icon: Icon }) => (
                            <div key={step} className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${currentStep >= step
                                    ? "bg-orange-500 text-white"
                                    : "bg-gray-200 text-gray-500"
                                    }`}>
                                    {step}
                                </div>
                                <span className={`font-medium ${currentStep >= step ? "text-orange-500" : "text-gray-500"
                                    }`}>
                                    {label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        {/* Step 1: Shipping Address */}
                        {currentStep === 1 && (
                            <div className="bg-white rounded-2xl p-6 shadow-sm">
                                <div className="flex items-center gap-3 mb-6">
                                    <MapPin className="w-6 h-6 text-orange-500" />
                                    <h2 className="text-xl font-bold text-gray-900">Shipping Address</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Full Name *
                                        </label>
                                        <input
                                            type="text"
                                            {...register('fullName')}
                                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${errors.fullName ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="Enter your full name"
                                        />
                                        {errors.fullName && (
                                            <p className="text-red-500 text-sm mt-1">{errors.fullName.message}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Phone Number *
                                        </label>
                                        <input
                                            type="tel"
                                            {...register('phoneNumber')}
                                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="Enter your phone number"
                                        />
                                        {errors.phoneNumber && (
                                            <p className="text-red-500 text-sm mt-1">{errors.phoneNumber.message}</p>
                                        )}
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Address Line 1 *
                                        </label>
                                        <input
                                            type="text"
                                            {...register('addressLine1')}
                                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${errors.addressLine1 ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="House/Flat number, Street name"
                                        />
                                        {errors.addressLine1 && (
                                            <p className="text-red-500 text-sm mt-1">{errors.addressLine1.message}</p>
                                        )}
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Address Line 2 (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            {...register('addressLine2')}
                                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${errors.addressLine2 ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="Apartment, suite, unit, building, floor, etc."
                                        />
                                        {errors.addressLine2 && (
                                            <p className="text-red-500 text-sm mt-1">{errors.addressLine2.message}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            City *
                                        </label>
                                        <input
                                            type="text"
                                            {...register('city')}
                                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${errors.city ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="Enter your city"
                                        />
                                        {errors.city && (
                                            <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            State *
                                        </label>
                                        <input
                                            type="text"
                                            {...register('state')}
                                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${errors.state ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="Enter your state"
                                        />
                                        {errors.state && (
                                            <p className="text-red-500 text-sm mt-1">{errors.state.message}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Postal Code *
                                        </label>
                                        <input
                                            type="text"
                                            {...register('postalCode')}
                                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${errors.postalCode ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="Enter postal code"
                                        />
                                        {errors.postalCode && (
                                            <p className="text-red-500 text-sm mt-1">{errors.postalCode.message}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Country *
                                        </label>
                                        <select
                                            {...register('country')}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        >
                                            <option value="India">India</option>
                                            <option value="United States">United States</option>
                                            <option value="United Kingdom">United Kingdom</option>
                                            <option value="Canada">Canada</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Payment Method */}
                        {currentStep === 2 && (
                            <div className="bg-white rounded-2xl p-6 shadow-sm">
                                <div className="flex items-center gap-3 mb-6">
                                    <CreditCard className="w-6 h-6 text-orange-500" />
                                    <h2 className="text-xl font-bold text-gray-900">Payment Method</h2>
                                </div>

                                <div className="space-y-4">
                                    <div className={`border rounded-lg p-4 ${paymentMethod === 'cod' ? 'border-orange-300 bg-orange-50' : 'border-gray-200 bg-white'}`}>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="radio"
                                                id="cod"
                                                name="payment"
                                                value="cod"
                                                checked={paymentMethod === 'cod'}
                                                onChange={() => setPaymentMethod('cod')}
                                                className="w-4 h-4 text-orange-500 focus:ring-orange-500"
                                            />
                                            <label htmlFor="cod" className="flex-1 cursor-pointer">
                                                <div className="font-semibold text-gray-900">Cash on Delivery</div>
                                                <div className="text-sm text-gray-600">Pay when your order is delivered</div>
                                            </label>
                                        </div>
                                    </div>

                                    <div className={`border rounded-lg p-4 ${paymentMethod === 'online' ? 'border-orange-300 bg-orange-50' : 'border-gray-200 bg-white'}`}>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="radio"
                                                id="online"
                                                name="payment"
                                                value="online"
                                                checked={paymentMethod === 'online'}
                                                onChange={() => setPaymentMethod('online')}
                                                className="w-4 h-4 text-orange-500 focus:ring-orange-500"
                                            />
                                            <label htmlFor="online" className="flex-1 cursor-pointer">
                                                <div className="font-semibold text-gray-900">Online Payment</div>
                                                <div className="text-sm text-gray-600">Credit/Debit Card, UPI, Net Banking</div>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Review Order */}
                        {currentStep === 3 && (
                            <div className="bg-white rounded-2xl p-6 shadow-sm">
                                <div className="flex items-center gap-3 mb-6">
                                    <CheckCircle2 className="w-6 h-6 text-orange-500" />
                                    <h2 className="text-xl font-bold text-gray-900">Review Your Order</h2>
                                </div>

                                {/* Shipping Address Review */}
                                <div className="mb-6 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                                <MapPin className="w-4 h-4 text-white" />
                                            </div>
                                            <h3 className="font-semibold text-gray-900 text-lg">Shipping Address</h3>
                                        </div>
                                        <button
                                            onClick={() => setCurrentStep(1)}
                                            className="px-4 py-2 bg-white border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 text-sm font-medium shadow-sm"
                                        >
                                            Edit Address
                                        </button>
                                    </div>
                                    <div className="bg-white rounded-lg p-4 border border-blue-100">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Full Name</p>
                                                <p className="text-gray-900 font-medium">{currentFormData.fullName}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Phone Number</p>
                                                <p className="text-gray-900 font-medium">{currentFormData.phoneNumber}</p>
                                            </div>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-gray-100">
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Delivery Address</p>
                                            <div className="text-gray-700 leading-relaxed">
                                                <p className="font-medium">{currentFormData.addressLine1}</p>
                                                {currentFormData.addressLine2 && <p>{currentFormData.addressLine2}</p>}
                                                <p>{currentFormData.city}, {currentFormData.state} {currentFormData.postalCode}</p>
                                                <p className="text-gray-600">{currentFormData.country}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Method Review */}
                                <div className="mb-6 p-6 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-xl shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                                <CreditCard className="w-4 h-4 text-white" />
                                            </div>
                                            <h3 className="font-semibold text-gray-900 text-lg">Payment Method</h3>
                                        </div>
                                        <button
                                            onClick={() => setCurrentStep(2)}
                                            className="px-4 py-2 bg-white border border-green-200 text-green-600 rounded-lg hover:bg-green-50 hover:border-green-300 transition-all duration-200 text-sm font-medium shadow-sm"
                                        >
                                            Change Method
                                        </button>
                                    </div>
                                    <div className="bg-white rounded-lg p-4 border border-green-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                                                <Package className="w-5 h-5 text-amber-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    {paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    {paymentMethod === 'cod' 
                                                        ? 'Pay when your order is delivered to your doorstep' 
                                                        : 'Pay securely via Credit/Debit Card, UPI, or Net Banking'}
                                                </p>
                                            </div>
                                        </div>
                                        {paymentMethod === 'cod' && (
                                            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                                <p className="text-xs text-amber-700">
                                                    <span className="font-medium">💡 Note:</span> Please keep exact change ready for smooth delivery
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Order Items */}
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-gray-900 text-lg mb-4">Order Items</h3>
                                    {items.map((item) => {
                                        const itemSubtotal = item.price * item.quantity;
                                        const itemTaxRate = 0;
                                        const itemTax = Math.round(itemSubtotal * itemTaxRate);
                                        const itemTotalWithTax = itemSubtotal + itemTax;

                                        return (
                                            <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                                {/* Product Header */}
                                                <div className="flex items-start gap-4 p-4 bg-white">
                                                    <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                                                        <Image
                                                            src={`${basePath}${item.variant.image_url || item.product.image_url || imgPlaceholder.src}`}
                                                            alt={item.product.name}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-semibold text-gray-900 text-base mb-1">{item.product.name}</h4>
                                                        <p className="text-sm text-gray-600 mb-2">{item.variant.title}</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {item.product.brand && (
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                                    Brand: {item.product.brand}
                                                                </span>
                                                            )}
                                                            {item.product.category_name && (
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                    {item.product.category_name}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-lg font-bold text-gray-900">₹{item.total}</p>
                                                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                                                    </div>
                                                </div>

                                                {/* Product Details Table */}
                                                <div className="bg-gray-50 border-t border-gray-200">
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-gray-200">
                                                        {/* SKU / Item Code */}
                                                        <div className="bg-white p-3">
                                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">SKU / Item Code</p>
                                                            <p className="text-sm font-semibold text-gray-900 font-mono">{item.variant.sku}</p>
                                                        </div>

                                                        {/* Selling Price */}
                                                        <div className="bg-white p-3">
                                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Selling Price (SP)</p>
                                                            <p className="text-sm font-semibold text-green-600">₹{item.price}</p>
                                                        </div>

                                                        {/* Base Price */}
                                                        {item.variant.bs && (
                                                            <div className="bg-white p-3">
                                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Base Price (BS)</p>
                                                                <p className="text-sm font-semibold text-gray-900">₹{item.variant.bs}</p>
                                                            </div>
                                                        )}

                                                        {/* MRP */}
                                                        {item.variant.mrp && (
                                                            <div className="bg-white p-3">
                                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">MRP</p>
                                                                <p className="text-sm font-semibold text-gray-900">
                                                                    <span className="line-through text-gray-400">₹{item.variant.mrp}</span>
                                                                    {item.variant.mrp > item.price && (
                                                                        <span className="ml-2 text-xs text-green-600 font-medium">
                                                                            {Math.round(((item.variant.mrp - item.price) / item.variant.mrp) * 100)}% OFF
                                                                        </span>
                                                                    )}
                                                                </p>
                                                            </div>
                                                        )}

                                                        {/* Quantity */}
                                                        <div className="bg-white p-3">
                                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Quantity</p>
                                                            <p className="text-sm font-semibold text-gray-900">{item.quantity} {item.quantity > 1 ? 'units' : 'unit'}</p>
                                                        </div>

                                                        {/* Subtotal */}
                                                        <div className="bg-white p-3">
                                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Subtotal</p>
                                                            <p className="text-sm font-semibold text-gray-900">₹{itemSubtotal}</p>
                                                        </div>

                                                        {/* Tax */}
                                                        <div className="bg-white p-3">
                                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Tax (GST 0%)</p>
                                                            <p className="text-sm font-semibold text-orange-600">₹{itemTax}</p>
                                                        </div>

                                                        {/* Item Total */}
                                                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-3 border-2 border-orange-200">
                                                            <p className="text-xs font-medium text-orange-700 uppercase tracking-wide mb-1">Item Total</p>
                                                            <p className="text-base font-bold text-orange-900">₹{itemTotalWithTax}</p>
                                                        </div>
                                                    </div>

                                                    {/* Stock Status */}
                                                    {item.variant.stock > 0 && (
                                                        <div className="bg-green-50 border-t border-green-100 px-4 py-2">
                                                            <p className="text-xs text-green-700">
                                                                ✓ In Stock - {item.variant.stock} units available
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="mt-6 flex gap-4">
                            {currentStep > 1 && (
                                <button
                                    onClick={handlePreviousStep}
                                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                >
                                    Previous
                                </button>
                            )}
                            {currentStep < 3 ? (
                                <button
                                    onClick={handleNextStep}
                                    className="flex-1 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-semibold"
                                >
                                    Continue to {currentStep === 1 ? 'Payment' : 'Review'}
                                </button>
                            ) : (
                                <button
                                    onClick={handlePlaceOrder}
                                    disabled={loading}
                                    className="flex-1 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors font-semibold flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Placing Order...
                                        </>
                                    ) : (
                                        <>
                                            <Package className="w-5 h-5" />
                                            Place Order
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Order Summary Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-8">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

                            {/* All Product Details */}
                            <div className="space-y-3 mb-6 max-h-80 overflow-y-auto">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-semibold text-gray-700">Items in your cart</h3>
                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                        {count} item{count !== 1 ? 's' : ''}
                                    </span>
                                </div>
                                {items.map((item, index) => (
                                    <div key={item.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                        <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 border-white shadow-sm">
                                            <Image
                                                src={`${basePath}${item.variant.image_url || item.product.image_url || imgPlaceholder.src}`}
                                                alt={item.product.name}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                                                {item.product.name}
                                            </h4>
                                            <div className="flex items-center gap-1 mb-1">
                                                <span className="text-xs text-gray-600 bg-blue-100 px-2 py-0.5 rounded-full">
                                                    {item.variant.title}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 mb-2 font-mono">
                                                SKU: {item.variant.sku}
                                            </p>
                                            <div className="flex items-center justify-between">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-medium text-gray-600 bg-orange-100 px-2 py-0.5 rounded">
                                                            Qty: {item.quantity}
                                                        </span>
                                                        <span className="text-xs text-gray-600">
                                                            @ ₹{item.price}
                                                        </span>
                                                    </div>
                                                    {item.variant.stock > 0 && (
                                                        <span className="text-xs text-green-600">
                                                            {item.variant.stock} in stock
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm font-bold text-gray-900">
                                                        ₹{item.total}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pricing Breakdown */}
                            <div className="space-y-3 border-t border-gray-200 pt-4">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal ({count} items)</span>
                                    <span>₹{subtotal}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Tax</span>
                                    <span>₹{tax}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Shipping</span>
                                    <span className={shipping === 0 ? "text-green-600" : ""}>
                                        {shipping === 0 ? "FREE" : `₹${shipping}`}
                                    </span>
                                </div>
                                {shipping === 0 && subtotal > 500 && (
                                    <div className="flex items-center gap-1 text-xs text-green-600">
                                        <span>🎉</span>
                                        <span>Free shipping on orders above ₹500</span>
                                    </div>
                                )}
                                <hr className="border-gray-200" />
                                <div className="flex justify-between text-lg font-bold text-gray-900">
                                    <span>Total</span>
                                    <span>₹{finalTotal}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Toast Notification */}
            {showToast && toastMessage && (
                <div className={`fixed top-6 right-6 z-[9999] px-6 py-4 rounded-lg shadow-xl border-l-4 transition-all duration-300 transform ${showToast ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
                    } ${toastType === 'success'
                        ? 'bg-green-50 border-green-500 text-green-800'
                        : toastType === 'error'
                            ? 'bg-red-50 border-red-500 text-red-800'
                            : 'bg-blue-50 border-blue-500 text-blue-800'
                    } max-w-md`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${toastType === 'success'
                                ? 'bg-green-100'
                                : toastType === 'error'
                                    ? 'bg-red-100'
                                    : 'bg-blue-100'
                                }`}>
                                {toastType === 'success' && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                                {toastType === 'error' && <X className="w-4 h-4 text-red-600" />}
                                {toastType === 'info' && <Package className="w-4 h-4 text-blue-600" />}
                            </div>
                            <p className="font-medium">{toastMessage}</p>
                        </div>
                        <button
                            onClick={() => setShowToast(false)}
                            className={`ml-4 ${toastType === 'success'
                                ? 'text-green-600 hover:text-green-800'
                                : toastType === 'error'
                                    ? 'text-red-600 hover:text-red-800'
                                    : 'text-blue-600 hover:text-blue-800'
                                } transition-colors`}
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
            {/* Cashfree SDK */}
            <Script
                src="https://sdk.cashfree.com/js/v3/cashfree.js"
                strategy="lazyOnload"
            />

            {/* Payment Status Modal */}
            <Modal
                isOpen={showPaymentModal}
                onClose={() => {}} // Prevent closing manually while verifying
                title={paymentStatus === 'verifying' ? "Verifying Payment" : paymentStatus === 'success' ? "Payment Successful" : "Payment Failed"}
                width="max-w-md"
            >
                <div className="flex flex-col items-center justify-center p-6 text-center">
                    {paymentStatus === 'verifying' && (
                        <>
                            <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
                            <p className="text-gray-600">{paymentMessage}</p>
                        </>
                    )}
                    {paymentStatus === 'success' && (
                        <>
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle2 className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Order Confirmed!</h3>
                            <p className="text-gray-600">{paymentMessage}</p>
                        </>
                    )}
                    {paymentStatus === 'failed' && (
                        <>
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                <X className="w-8 h-8 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Payment Failed</h3>
                            <p className="text-gray-600">{paymentMessage}</p>
                        </>
                    )}
                </div>
            </Modal>
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading checkout...</p>
                </div>
            </div>
        }>
            <CheckoutPageContent />
        </Suspense>
    );
}