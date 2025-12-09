'use client';

import { Shield, Lock, Eye, UserCheck, Database, AlertCircle } from 'lucide-react';

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
            {/* Hero Section */}
            <section className="relative bg-gradient-to-r from-orange-500 to-yellow-500 text-white py-20 overflow-hidden">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-6">
                            <Shield className="w-10 h-10" />
                        </div>
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">Privacy Policy</h1>
                        <p className="text-lg sm:text-xl text-white/90 max-w-3xl mx-auto">
                            Your privacy is important to us. Learn how we collect, use, and protect your information.
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
                                Welcome to Zelton. We respect your privacy and are committed to protecting your personal data. 
                                This privacy policy will inform you about how we look after your personal data when you visit 
                                our website and tell you about your privacy rights and how the law protects you.
                            </p>
                        </div>

                        {/* Information We Collect */}
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                    <Database className="w-5 h-5 text-orange-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">Information We Collect</h2>
                            </div>
                            <div className="space-y-4 text-gray-600">
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">Personal Information:</h3>
                                    <ul className="list-disc list-inside space-y-1 ml-4">
                                        <li>Name, email address, and phone number</li>
                                        <li>Shipping and billing addresses</li>
                                        <li>Payment information (processed securely through payment gateways)</li>
                                        <li>Order history and preferences</li>
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">Automatically Collected Information:</h3>
                                    <ul className="list-disc list-inside space-y-1 ml-4">
                                        <li>IP address and browser type</li>
                                        <li>Device information</li>
                                        <li>Browsing behavior and interactions with our site</li>
                                        <li>Cookies and similar tracking technologies</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* How We Use Your Information */}
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                                    <Eye className="w-5 h-5 text-yellow-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">How We Use Your Information</h2>
                            </div>
                            <ul className="space-y-3 text-gray-600">
                                <li className="flex items-start gap-2">
                                    <span className="text-orange-500 mt-1">•</span>
                                    <span>To process and fulfill your orders</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-orange-500 mt-1">•</span>
                                    <span>To communicate with you about your orders and account</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-orange-500 mt-1">•</span>
                                    <span>To provide customer support and respond to inquiries</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-orange-500 mt-1">•</span>
                                    <span>To send promotional emails and offers (with your consent)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-orange-500 mt-1">•</span>
                                    <span>To improve our website, products, and services</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-orange-500 mt-1">•</span>
                                    <span>To detect and prevent fraud and security threats</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-orange-500 mt-1">•</span>
                                    <span>To comply with legal obligations</span>
                                </li>
                            </ul>
                        </div>

                        {/* Data Security */}
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                    <Lock className="w-5 h-5 text-orange-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">Data Security</h2>
                            </div>
                            <p className="text-gray-600 leading-relaxed">
                                We implement appropriate technical and organizational security measures to protect your personal 
                                data against unauthorized access, alteration, disclosure, or destruction. This includes:
                            </p>
                            <ul className="mt-4 space-y-2 text-gray-600">
                                <li className="flex items-start gap-2">
                                    <span className="text-orange-500 mt-1">•</span>
                                    <span>SSL encryption for data transmission</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-orange-500 mt-1">•</span>
                                    <span>Secure payment processing through trusted gateways</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-orange-500 mt-1">•</span>
                                    <span>Regular security audits and updates</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-orange-500 mt-1">•</span>
                                    <span>Restricted access to personal data</span>
                                </li>
                            </ul>
                        </div>

                        {/* Your Rights */}
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                                    <UserCheck className="w-5 h-5 text-yellow-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">Your Rights</h2>
                            </div>
                            <p className="text-gray-600 leading-relaxed mb-4">You have the right to:</p>
                            <ul className="space-y-2 text-gray-600">
                                <li className="flex items-start gap-2">
                                    <span className="text-orange-500 mt-1">•</span>
                                    <span>Access your personal data</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-orange-500 mt-1">•</span>
                                    <span>Correct inaccurate or incomplete data</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-orange-500 mt-1">•</span>
                                    <span>Request deletion of your data</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-orange-500 mt-1">•</span>
                                    <span>Object to processing of your data</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-orange-500 mt-1">•</span>
                                    <span>Request data portability</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-orange-500 mt-1">•</span>
                                    <span>Withdraw consent at any time</span>
                                </li>
                            </ul>
                        </div>

                        {/* Cookies */}
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Cookies and Tracking</h2>
                            <p className="text-gray-600 leading-relaxed">
                                We use cookies and similar tracking technologies to enhance your browsing experience, analyze 
                                site traffic, and personalize content. You can control cookies through your browser settings.
                            </p>
                        </div>

                        {/* Third-Party Services */}
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Third-Party Services</h2>
                            <p className="text-gray-600 leading-relaxed">
                                We may share your information with trusted third-party service providers who assist us in 
                                operating our website, conducting our business, or servicing you. These parties are obligated 
                                to keep your information confidential and use it only for the purposes we specify.
                            </p>
                        </div>

                        {/* Children's Privacy */}
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Children's Privacy</h2>
                            <p className="text-gray-600 leading-relaxed">
                                Our service is not directed to individuals under the age of 18. We do not knowingly collect 
                                personal information from children. If you are a parent or guardian and believe your child 
                                has provided us with personal information, please contact us.
                            </p>
                        </div>

                        {/* Changes to Policy */}
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes to This Policy</h2>
                            <p className="text-gray-600 leading-relaxed">
                                We may update this privacy policy from time to time. We will notify you of any changes by 
                                posting the new privacy policy on this page and updating the "Last updated" date.
                            </p>
                        </div>

                        {/* Contact */}
                        <div className="bg-orange-50 rounded-xl p-6 border border-orange-100">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">Questions About Privacy?</h3>
                                    <p className="text-gray-600 text-sm mb-3">
                                        If you have any questions about this privacy policy or our data practices, please contact us:
                                    </p>
                                    <div className="space-y-1 text-sm text-gray-600">
                                        <p>Email: <a href="mailto:privacy@zelton.co.in" className="text-orange-600 hover:underline">privacy@zelton.co.in</a></p>
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
