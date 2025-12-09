'use client';

import { Store, Users, ShieldCheck, Truck, Heart, Award, Target, Sparkles } from 'lucide-react';

export default function AboutUsPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
            {/* Hero Section */}
            <section className="relative bg-gradient-to-r from-orange-500 to-yellow-500 text-white py-20 overflow-hidden">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLW9wYWNpdHk9Ii4xIi8+PC9nPjwvc3ZnPg==')] opacity-20"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-6">
                            <Store className="w-10 h-10" />
                        </div>
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">About Zelton</h1>
                        <p className="text-lg sm:text-xl text-white/90 max-w-3xl mx-auto">
                            Your trusted destination for quality products, exceptional service, and unforgettable shopping experiences.
                        </p>
                    </div>
                </div>
            </section>

            {/* Mission & Vision */}
            <section className="py-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="bg-white rounded-2xl shadow-lg p-8 border border-orange-100 hover:shadow-xl transition-shadow">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                                    <Target className="w-6 h-6 text-orange-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">Our Mission</h2>
                            </div>
                            <p className="text-gray-600 leading-relaxed">
                                To revolutionize online shopping by providing an exceptional platform that connects customers 
                                with high-quality products, backed by outstanding customer service and innovative technology. 
                                We strive to make every shopping experience seamless, enjoyable, and memorable.
                            </p>
                        </div>

                        <div className="bg-white rounded-2xl shadow-lg p-8 border border-yellow-100 hover:shadow-xl transition-shadow">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                                    <Sparkles className="w-6 h-6 text-yellow-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">Our Vision</h2>
                            </div>
                            <p className="text-gray-600 leading-relaxed">
                                To become the leading e-commerce platform recognized for trust, innovation, and customer 
                                satisfaction. We envision a future where online shopping is not just convenient but also 
                                personalized, sustainable, and accessible to everyone.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-orange-500 to-yellow-500">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[
                            { number: '50K+', label: 'Happy Customers', icon: Users },
                            { number: '10K+', label: 'Products', icon: Store },
                            { number: '98%', label: 'Satisfaction Rate', icon: Heart },
                            { number: '24/7', label: 'Support', icon: ShieldCheck },
                        ].map((stat, index) => (
                            <div key={index} className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-center text-white hover:bg-white/20 transition-all">
                                <div className="flex justify-center mb-3">
                                    <stat.icon className="w-8 h-8" />
                                </div>
                                <div className="text-3xl sm:text-4xl font-bold mb-2">{stat.number}</div>
                                <div className="text-sm sm:text-base text-white/90">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Why Choose Us */}
            <section className="py-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Why Choose Zelton?</h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            We're committed to providing the best shopping experience with features that matter most to you.
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            {
                                icon: ShieldCheck,
                                title: 'Secure Shopping',
                                description: 'Your data is protected with industry-standard encryption and secure payment gateways.',
                                color: 'orange'
                            },
                            {
                                icon: Truck,
                                title: 'Fast Delivery',
                                description: 'Quick and reliable shipping to get your products to you as soon as possible.',
                                color: 'yellow'
                            },
                            {
                                icon: Award,
                                title: 'Quality Products',
                                description: 'Every product is carefully vetted to ensure it meets our high quality standards.',
                                color: 'orange'
                            },
                            {
                                icon: Heart,
                                title: 'Customer First',
                                description: 'Our dedicated support team is always here to help with any questions or concerns.',
                                color: 'yellow'
                            },
                            {
                                icon: Store,
                                title: 'Wide Selection',
                                description: 'Thousands of products across multiple categories to choose from.',
                                color: 'orange'
                            },
                            {
                                icon: Users,
                                title: 'Trusted Community',
                                description: 'Join thousands of satisfied customers who trust us for their shopping needs.',
                                color: 'yellow'
                            },
                        ].map((feature, index) => (
                            <div
                                key={index}
                                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all border border-gray-100 group"
                            >
                                <div className={`w-14 h-14 bg-${feature.color}-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                    <feature.icon className={`w-7 h-7 text-${feature.color}-600`} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Our Story */}
            <section className="py-16 px-4 sm:px-6 lg:px-8 bg-orange-50">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
                        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 text-center">Our Story</h2>
                        <div className="prose prose-lg max-w-none text-gray-600">
                            <p className="mb-4">
                                Founded with a passion for bringing quality products to customers worldwide, Zelton has grown 
                                from a small startup to a trusted e-commerce platform serving thousands of happy customers.
                            </p>
                            <p className="mb-4">
                                Our journey began with a simple idea: create an online shopping experience that combines 
                                convenience, quality, and trust. Today, we're proud to offer a vast selection of products 
                                across multiple categories, all carefully curated to meet your needs.
                            </p>
                            <p>
                                As we continue to grow, our commitment remains the same – to provide exceptional service, 
                                quality products, and an unforgettable shopping experience to every customer, every time.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-orange-500 to-yellow-500 text-white">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to Start Shopping?</h2>
                    <p className="text-lg text-white/90 mb-8">
                        Join thousands of satisfied customers and discover amazing products today.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a
                            href="/products"
                            className="px-8 py-3 bg-white text-orange-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors shadow-lg hover:shadow-xl"
                        >
                            Browse Products
                        </a>
                        <a
                            href="/contact-us"
                            className="px-8 py-3 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl hover:bg-white/20 transition-colors border-2 border-white/30"
                        >
                            Contact Us
                        </a>
                    </div>
                </div>
            </section>
        </div>
    );
}
