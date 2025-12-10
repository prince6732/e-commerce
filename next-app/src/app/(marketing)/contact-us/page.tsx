'use client';

import { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle, Loader2 } from 'lucide-react';
import { submitContactMessage } from '../../../../utils/contactUsApi';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';

const contactSchema = Yup.object().shape({
    name: Yup.string()
        .required('Name is required')
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name must not exceed 100 characters')
        .matches(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
    email: Yup.string()
        .required('Email is required')
        .email('Please enter a valid email address')
        .max(255, 'Email must not exceed 255 characters'),
    phone_number: Yup.string()
        .required('Phone number is required')
        .matches(/^[0-9+\-\s()]+$/, 'Please enter a valid phone number')
        .min(10, 'Phone number must be at least 10 digits')
        .max(20, 'Phone number must not exceed 20 characters'),
    message: Yup.string()
        .required('Message is required')
        .min(10, 'Message must be at least 10 characters')
        .max(1000, 'Message must not exceed 1000 characters')
});

interface ContactFormData {
    name: string;
    email: string;
    phone_number: string;
    message: string;
}

export default function ContactUsPage() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm<ContactFormData>({
        resolver: yupResolver(contactSchema)
    });

    const onSubmit = async (data: ContactFormData) => {
        setLoading(true);
        setSuccess(false);

        try {
            const response = await submitContactMessage(data);
            if (response.success) {
                setSuccess(true);
                reset();
                setTimeout(() => setSuccess(false), 5000);
            }
        } catch (error: any) {
            console.error('Error submitting contact form:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
            {/* Hero Section */}
            <section className="relative bg-gradient-to-r from-orange-500 to-yellow-500 text-white py-20 overflow-hidden">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLW9wYWNpdHk9Ii4xIi8+PC9nPjwvc3ZnPg==')] opacity-20"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-6">
                            <Mail className="w-10 h-10" />
                        </div>
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">Get in Touch</h1>
                        <p className="text-lg sm:text-xl text-white/90 max-w-3xl mx-auto">
                            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
                        </p>
                    </div>
                </div>
            </section>

            {/* Contact Form & Info */}
            <section className="py-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-[1536px] mx-auto">
                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Contact Info */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-white rounded-2xl shadow-lg p-6 border border-orange-100">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <Mail className="w-6 h-6 text-orange-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-1">Email Us</h3>
                                        <p className="text-gray-600 text-sm">support@zelton.co.in</p>
                                        <p className="text-gray-600 text-sm">info@zelton.co.in</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl shadow-lg p-6 border border-yellow-100">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <Phone className="w-6 h-6 text-yellow-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-1">Call Us</h3>
                                        <p className="text-gray-600 text-sm">+91 9729310456</p>
                                        <p className="text-gray-500 text-xs mt-1">Mon-Sat: 9AM - 6PM</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl shadow-lg p-6 border border-orange-100">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <MapPin className="w-6 h-6 text-orange-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-1">Visit Us</h3>
                                        <p className="text-gray-600 text-sm">
                                            Zelton Headquarters<br />
                                            India
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Response Time Info */}
                            <div className="bg-gradient-to-r from-orange-500 to-yellow-500 rounded-2xl shadow-lg p-6 text-white">
                                <h3 className="font-semibold mb-3">Quick Response</h3>
                                <ul className="space-y-2 text-sm text-white/90">
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4" />
                                        <span>24-hour response time</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4" />
                                        <span>Live chat available</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4" />
                                        <span>Multilingual support</span>
                                    </li>
                                </ul>
                            </div>

                            {/* Social Links */}
                            <div className="bg-white rounded-2xl shadow-lg p-6 border border-yellow-100">
                                <h3 className="font-semibold text-gray-900 mb-4">Follow Us</h3>
                                <div className="flex gap-3">
                                    <a href="#" className="w-10 h-10 bg-blue-100 hover:bg-blue-200 rounded-lg flex items-center justify-center transition-colors">
                                        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                        </svg>
                                    </a>
                                    <a href="#" className="w-10 h-10 bg-pink-100 hover:bg-pink-200 rounded-lg flex items-center justify-center transition-colors">
                                        <svg className="w-5 h-5 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                        </svg>
                                    </a>
                                    <a href="#" className="w-10 h-10 bg-blue-100 hover:bg-blue-200 rounded-lg flex items-center justify-center transition-colors">
                                        <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                                        </svg>
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a Message</h2>

                                {success && (
                                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                                        <p className="text-green-800 text-sm">
                                            Thank you for contacting us! We'll get back to you soon.
                                        </p>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                            Your Name *
                                        </label>
                                        <input
                                            type="text"
                                            id="name"
                                            {...register('name')}
                                            className={`w-full px-4 py-3 rounded-xl border ${errors.name ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-orange-500'
                                                } focus:ring-2 focus:border-transparent transition-all`}
                                            placeholder="John Doe"
                                        />
                                        {errors.name && (
                                            <p className="mt-2 text-sm text-red-600 flex items-start gap-1">
                                                <span className="text-red-500 font-bold">⚠</span>
                                                {errors.name.message}
                                            </p>
                                        )}
                                    </div>

                                    <div className="grid sm:grid-cols-2 gap-6">
                                        <div>
                                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                                Email Address *
                                            </label>
                                            <input
                                                type="email"
                                                id="email"
                                                {...register('email')}
                                                className={`w-full px-4 py-3 rounded-xl border ${errors.email ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-orange-500'
                                                    } focus:ring-2 focus:border-transparent transition-all`}
                                                placeholder="john@example.com"
                                            />
                                            {errors.email && (
                                                <p className="mt-2 text-sm text-red-600 flex items-start gap-1">
                                                    <span className="text-red-500 font-bold">⚠</span>
                                                    {errors.email.message}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-2">
                                                Phone Number *
                                            </label>
                                            <input
                                                type="tel"
                                                id="phone_number"
                                                {...register('phone_number')}
                                                className={`w-full px-4 py-3 rounded-xl border ${errors.phone_number ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-orange-500'
                                                    } focus:ring-2 focus:border-transparent transition-all`}
                                                placeholder="+91 9729310456"
                                            />
                                            {errors.phone_number && (
                                                <p className="mt-2 text-sm text-red-600 flex items-start gap-1">
                                                    <span className="text-red-500 font-bold">⚠</span>
                                                    {errors.phone_number.message}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                                            Your Message *
                                        </label>
                                        <textarea
                                            id="message"
                                            {...register('message')}
                                            rows={6}
                                            className={`w-full px-4 py-3 rounded-xl border ${errors.message ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-orange-500'
                                                } focus:ring-2 focus:border-transparent transition-all resize-none`}
                                            placeholder="Tell us how we can help you..."
                                        ></textarea>
                                        {errors.message && (
                                            <p className="mt-2 text-sm text-red-600 flex items-start gap-1">
                                                <span className="text-red-500 font-bold">⚠</span>
                                                {errors.message.message}
                                            </p>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-yellow-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-5 h-5" />
                                                Send Message
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-16 px-4 sm:px-8 lg:px-10 bg-orange-50">
                <div className="max-w-[1536px] mx-auto">
                    <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
                    <div className="space-y-4">
                        {[
                            {
                                question: 'What are your business hours?',
                                answer: 'Our customer support is available Monday to Saturday, 9:00 AM to 6:00 PM IST.'
                            },
                            {
                                question: 'How long does it take to get a response?',
                                answer: 'We typically respond to all inquiries within 24 hours during business days.'
                            },
                            {
                                question: 'Can I track my order?',
                                answer: 'Yes! You can track your order from your account dashboard or use the tracking number sent to your email.'
                            },
                            {
                                question: 'What payment methods do you accept?',
                                answer: 'We accept all major credit/debit cards, UPI, net banking, and cash on delivery.'
                            }
                        ].map((faq, index) => (
                            <details key={index} className="bg-white rounded-xl shadow-md overflow-hidden group">
                                <summary className="px-6 py-4 cursor-pointer font-semibold text-gray-900 hover:bg-orange-50 transition-colors">
                                    {faq.question}
                                </summary>
                                <div className="px-6 pb-4 text-gray-600 border-t border-gray-100">
                                    <p className="pt-4">{faq.answer}</p>
                                </div>
                            </details>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
