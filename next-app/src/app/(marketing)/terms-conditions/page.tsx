'use client';

import { FileText, ShoppingCart, CreditCard, Package, RefreshCw, AlertTriangle } from 'lucide-react';

export default function TermsConditionsPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
            {/* Hero Section */}
            <section className="relative bg-gradient-to-r from-orange-500 to-yellow-500 text-white py-20 overflow-hidden">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-6">
                            <FileText className="w-10 h-10" />
                        </div>
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">Terms & Conditions</h1>
                        <p className="text-lg sm:text-xl text-white/90 max-w-3xl mx-auto">
                            Please read these terms carefully before using our services.
                        </p>
                        <p className="text-sm text-white/75 mt-4">Last updated: December 2025</p>
                    </div>
                </div>
            </section>

            {/* Content */}
            <section className="py-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 space-y-8">
                        {/* Introduction */}
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Introduction</h2>
                            <p className="text-gray-600 leading-relaxed">
                                Welcome to Zelton. These Terms and Conditions govern your use of our website and services. 
                                By accessing or using our platform, you agree to be bound by these terms. If you disagree 
                                with any part of these terms, you may not access our service.
                            </p>
                        </div>

                        {/* Account Terms */}
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Account Terms</h2>
                            <ul className="space-y-3 text-gray-600">
                                <li className="flex items-start gap-2">
                                    <span className="text-orange-500 mt-1">•</span>
                                    <span>You must be at least 18 years old to use this service</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-orange-500 mt-1">•</span>
                                    <span>You must provide accurate and complete information during registration</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-orange-500 mt-1">•</span>
                                    <span>You are responsible for maintaining the security of your account</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-orange-500 mt-1">•</span>
                                    <span>You are responsible for all activities that occur under your account</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-orange-500 mt-1">•</span>
                                    <span>You must notify us immediately of any unauthorized use of your account</span>
                                </li>
                            </ul>
                        </div>

                        {/* Orders & Payments */}
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                    <ShoppingCart className="w-5 h-5 text-orange-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">Orders & Payments</h2>
                            </div>
                            <div className="space-y-4 text-gray-600">
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">Placing Orders:</h3>
                                    <ul className="list-disc list-inside space-y-1 ml-4">
                                        <li>All orders are subject to acceptance and availability</li>
                                        <li>We reserve the right to refuse or cancel any order</li>
                                        <li>Order confirmation does not constitute acceptance of your order</li>
                                        <li>Prices are subject to change without notice</li>
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">Payment Terms:</h3>
                                    <ul className="list-disc list-inside space-y-1 ml-4">
                                        <li>Payment must be received before order processing</li>
                                        <li>We accept all major credit/debit cards, UPI, and COD</li>
                                        <li>All prices are in INR (Indian Rupees)</li>
                                        <li>Payment failures may result in order cancellation</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Shipping & Delivery */}
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                                    <Package className="w-5 h-5 text-yellow-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">Shipping & Delivery</h2>
                            </div>
                            <ul className="space-y-3 text-gray-600">
                                <li className="flex items-start gap-2">
                                    <span className="text-orange-500 mt-1">•</span>
                                    <span>Delivery times are estimates and not guaranteed</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-orange-500 mt-1">•</span>
                                    <span>Shipping charges are calculated based on weight and location</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-orange-500 mt-1">•</span>
                                    <span>Risk of loss passes to you upon delivery to the carrier</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-orange-500 mt-1">•</span>
                                    <span>You must provide accurate shipping information</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-orange-500 mt-1">•</span>
                                    <span>We are not responsible for delays caused by shipping carriers</span>
                                </li>
                            </ul>
                        </div>

                        {/* Returns & Refunds */}
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                    <RefreshCw className="w-5 h-5 text-orange-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">Returns & Refunds</h2>
                            </div>
                            <div className="space-y-4 text-gray-600">
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">Return Policy:</h3>
                                    <ul className="list-disc list-inside space-y-1 ml-4">
                                        <li>Returns must be initiated within 7 days of delivery</li>
                                        <li>Products must be in original condition with tags attached</li>
                                        <li>Some products may not be eligible for return (e.g., personal care items)</li>
                                        <li>Return shipping costs may be borne by the customer</li>
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">Refund Policy:</h3>
                                    <ul className="list-disc list-inside space-y-1 ml-4">
                                        <li>Refunds will be processed within 7-10 business days after return approval</li>
                                        <li>Refunds will be issued to the original payment method</li>
                                        <li>Shipping charges are non-refundable unless the product is defective</li>
                                        <li>Partial refunds may be granted for damaged or used items</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Product Information */}
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Information</h2>
                            <ul className="space-y-3 text-gray-600">
                                <li className="flex items-start gap-2">
                                    <span className="text-orange-500 mt-1">•</span>
                                    <span>We strive to provide accurate product descriptions and images</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-orange-500 mt-1">•</span>
                                    <span>Colors may vary slightly due to screen settings</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-orange-500 mt-1">•</span>
                                    <span>We do not guarantee availability of all products</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-orange-500 mt-1">•</span>
                                    <span>Product specifications are subject to change without notice</span>
                                </li>
                            </ul>
                        </div>

                        {/* User Conduct */}
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">User Conduct</h2>
                            <p className="text-gray-600 leading-relaxed mb-4">You agree not to:</p>
                            <ul className="space-y-2 text-gray-600">
                                <li className="flex items-start gap-2">
                                    <span className="text-orange-500 mt-1">•</span>
                                    <span>Use the service for any illegal purpose</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-orange-500 mt-1">•</span>
                                    <span>Violate any laws in your jurisdiction</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-orange-500 mt-1">•</span>
                                    <span>Infringe upon intellectual property rights</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-orange-500 mt-1">•</span>
                                    <span>Transmit harmful or malicious code</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-orange-500 mt-1">•</span>
                                    <span>Attempt to gain unauthorized access to our systems</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-orange-500 mt-1">•</span>
                                    <span>Harass, abuse, or harm other users</span>
                                </li>
                            </ul>
                        </div>

                        {/* Intellectual Property */}
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Intellectual Property</h2>
                            <p className="text-gray-600 leading-relaxed">
                                All content on this website, including text, graphics, logos, images, and software, is the 
                                property of Zelton and is protected by copyright and trademark laws. You may not reproduce, 
                                distribute, or create derivative works without our express written permission.
                            </p>
                        </div>

                        {/* Limitation of Liability */}
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Limitation of Liability</h2>
                            <p className="text-gray-600 leading-relaxed">
                                To the maximum extent permitted by law, Zelton shall not be liable for any indirect, 
                                incidental, special, consequential, or punitive damages arising from your use of our service. 
                                Our total liability shall not exceed the amount paid by you for the products in question.
                            </p>
                        </div>

                        {/* Governing Law */}
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Governing Law</h2>
                            <p className="text-gray-600 leading-relaxed">
                                These terms shall be governed by and construed in accordance with the laws of India. Any 
                                disputes shall be subject to the exclusive jurisdiction of the courts in India.
                            </p>
                        </div>

                        {/* Changes to Terms */}
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes to Terms</h2>
                            <p className="text-gray-600 leading-relaxed">
                                We reserve the right to modify these terms at any time. Changes will be effective immediately 
                                upon posting to the website. Your continued use of the service after changes constitutes 
                                acceptance of the modified terms.
                            </p>
                        </div>

                        {/* Contact */}
                        <div className="bg-orange-50 rounded-xl p-6 border border-orange-100">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">Questions About These Terms?</h3>
                                    <p className="text-gray-600 text-sm mb-3">
                                        If you have any questions about these terms and conditions, please contact us:
                                    </p>
                                    <div className="space-y-1 text-sm text-gray-600">
                                        <p>Email: <a href="mailto:legal@zelton.co.in" className="text-orange-600 hover:underline">legal@zelton.co.in</a></p>
                                        <p>Phone: +91 95925 75105</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
