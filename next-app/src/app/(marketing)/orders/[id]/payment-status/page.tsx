"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import axios from "../../../../../../utils/axios";

const basePath = process.env.NEXT_PUBLIC_UPLOAD_BASE || "http://localhost:8000";

export default function PaymentStatusPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const params = useParams();
    const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
    const [message, setMessage] = useState("Verifying payment...");

    useEffect(() => {
        const verifyPayment = async () => {
            const orderId = searchParams.get("order_id");

            if (!orderId) {
                setStatus('failed');
                setMessage("Invalid payment response");
                return;
            }

            try {
                const response = await axios.post(`${basePath}/api/payment/verify`, {
                    order_id: orderId
                }, {
                    withCredentials: true
                });

                if (response.data.success && response.data.status === 'PAID') {
                    setStatus('success');
                    setMessage("Payment successful! Your order has been confirmed.");
                } else {
                    setStatus('failed');
                    setMessage("Payment failed or pending. Please check your order status.");
                }
            } catch (error) {
                console.error("Payment verification failed:", error);
                setStatus('failed');
                setMessage("Failed to verify payment. Please contact support if amount was deducted.");
            }
        };

        verifyPayment();
    }, [searchParams]);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-8 shadow-sm max-w-md w-full text-center">
                {status === 'loading' && (
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
                        <h2 className="text-xl font-bold text-gray-900">Verifying Payment</h2>
                        <p className="text-gray-600">Please wait while we confirm your payment...</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-8 h-8 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Payment Successful!</h2>
                        <p className="text-gray-600">{message}</p>
                        <div className="flex gap-3 w-full mt-4">
                            <Link
                                // href={`/orders/${params.id}`}
                                href={`/orders`}
                                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
                            >
                                View Order
                            </Link>
                            <Link
                                href="/products"
                                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                            >
                                Continue Shopping
                            </Link>
                        </div>
                    </div>
                )}

                {status === 'failed' && (
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                            <XCircle className="w-8 h-8 text-red-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Payment Failed</h2>
                        <p className="text-gray-600">{message}</p>
                        <div className="flex gap-3 w-full mt-4">
                            <Link
                                href="/checkout"
                                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
                            >
                                Try Again
                            </Link>
                            <Link
                                href="/orders"
                                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                            >
                                My Orders
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
