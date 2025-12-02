"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";

import Link from "next/link";
import logo from "@/public/ZeltonHorizontalBlack.png";
import Image from "next/image";
import { forgotPassword } from "../../../../utils/auth";
import { KeyRound, Mail } from "lucide-react";
export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setMessage("");
        setLoading(true);

        try {
            const res = await forgotPassword(email);
            setMessage(res.message);

            setTimeout(() => {
                router.push("/reset-password");
            }, 1500);
        } catch (err) {
            const error = err as AxiosError<{ message?: string }>;
            setError(error.response?.data?.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-10">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-lg p-8 sm:p-10">
                {/* Logo & Title */}
                <div className="text-center mb-8">
                    {logo && <Image src={logo} alt="logo" className="w-28 mx-auto mb-3" />}
                    <h1 className="text-gray-800 font-extrabold text-3xl flex justify-center items-center gap-2">
                        <KeyRound className="text-orange-500" />
                        Forgot <span className="text-orange-500">Password</span>
                    </h1>
                    <p className="text-gray-500 text-sm mt-2">
                        We’ll send you a reset code via email.
                    </p>
                </div>

                {/* Success & Error Messages */}
                {message && (
                    <div className="bg-green-100 border border-green-300 text-green-700 px-4 py-3 rounded-xl mb-4 text-center">
                        {message}
                    </div>
                )}
                {error && (
                    <div className="bg-red-100 border border-red-300 text-red-600 px-4 py-3 rounded-xl mb-4 text-center">
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="text-gray-700 font-medium mb-2 block">
                            Email Address
                        </label>
                        <div className="relative">
                            <Mail
                                size={18}
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                            />
                            <input
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                type="email"
                                placeholder="Enter your email"
                                className="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 rounded-xl font-semibold bg-orange-500 text-white hover:bg-orange-600 hover:shadow-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {loading ? "Sending..." : "Send Reset Code"}
                    </button>
                </form>

                {/* Footer */}
                <p className="text-sm text-gray-600 text-center mt-6">
                    Back to{" "}
                    <Link
                        href="/login"
                        className="text-orange-500 font-medium hover:underline"
                    >
                        Login
                    </Link>
                </p>
            </div>
        </section>
    );
}
