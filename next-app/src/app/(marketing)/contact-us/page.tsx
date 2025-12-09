'use client';

import { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle, Loader2 } from 'lucide-react';
import { submitContactMessage } from '../../../../utils/contactUsApi';

export default function ContactUsPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone_number: '',
        message: ''
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        // Clear error for this field
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: [] });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});
        setSuccess(false);

        try {
            const response = await submitContactMessage(formData);
            if (response.success) {
                setSuccess(true);
                setFormData({
                    name: '',
                    email: '',
                    phone_number: '',
                    message: ''
                });
                setTimeout(() => setSuccess(false), 5000);
            }
        } catch (error: any) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            }
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
                <div className="max-w-7xl mx-auto">
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
                                        <p className="text-gray-600 text-sm">+91 95925 75105</p>
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

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                            Your Name *
                                        </label>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-3 rounded-xl border ${
                                                errors.name ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-orange-500'
                                            } focus:ring-2 focus:border-transparent transition-all`}
                                            placeholder="John Doe"
                                            required
                                        />
                                        {errors.name && (
                                            <p className="mt-1 text-sm text-red-600">{errors.name[0]}</p>
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
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                className={`w-full px-4 py-3 rounded-xl border ${
                                                    errors.email ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-orange-500'
                                                } focus:ring-2 focus:border-transparent transition-all`}
                                                placeholder="john@example.com"
                                                required
                                            />
                                            {errors.email && (
                                                <p className="mt-1 text-sm text-red-600">{errors.email[0]}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-2">
                                                Phone Number *
                                            </label>
                                            <input
                                                type="tel"
                                                id="phone_number"
                                                name="phone_number"
                                                value={formData.phone_number}
                                                onChange={handleChange}
                                                className={`w-full px-4 py-3 rounded-xl border ${
                                                    errors.phone_number ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-orange-500'
                                                } focus:ring-2 focus:border-transparent transition-all`}
                                                placeholder="+91 95925 75105"
                                                required
                                            />
                                            {errors.phone_number && (
                                                <p className="mt-1 text-sm text-red-600">{errors.phone_number[0]}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                                            Your Message *
                                        </label>
                                        <textarea
                                            id="message"
                                            name="message"
                                            value={formData.message}
                                            onChange={handleChange}
                                            rows={6}
                                            className={`w-full px-4 py-3 rounded-xl border ${
                                                errors.message ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-orange-500'
                                            } focus:ring-2 focus:border-transparent transition-all resize-none`}
                                            placeholder="Tell us how we can help you..."
                                            required
                                        ></textarea>
                                        {errors.message && (
                                            <p className="mt-1 text-sm text-red-600">{errors.message[0]}</p>
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
            <section className="py-16 px-4 sm:px-6 lg:px-8 bg-orange-50">
                <div className="max-w-4xl mx-auto">
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
