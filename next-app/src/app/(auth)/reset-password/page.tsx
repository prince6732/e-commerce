"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import Link from "next/link";
import logo from "@/public/ZeltonHorizontalBlack.png";
import Image from "next/image";
import { resetPassword } from "../../../../utils/auth";
import { Check, KeyRound, Lock, Mail } from "lucide-react";
import { useLoader } from "@/context/LoaderContext";
import ErrorMessage from "@/components/(sheared)/ErrorMessage";
import SuccessMessage from "@/components/(sheared)/SuccessMessage";
export default function ResetPasswordPage() {
    const router = useRouter();
    const { showLoader, hideLoader } = useLoader();

    const [form, setForm] = useState({
        email: "",
        code: "",
        password: "",
        password_confirmation: "",
    });

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setMessage("");
        setErrorMessage(null);
        setSuccessMessage(null);
        showLoader();

        try {
            const res = await resetPassword(form);
            setMessage(res.message);
            setSuccessMessage(res.message);

            // Redirect to login page after success
            setTimeout(() => router.push("/login"), 2000);
        } catch (err) {
            const error = err as AxiosError<{ message?: string }>;
            const errorMsg = error.response?.data?.message || "Something went wrong";
            setError(errorMsg);
            setErrorMessage(errorMsg);
        } finally {
            hideLoader();
        }
    };

    return (
        <section className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-10">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-lg p-8 sm:p-10">
                {/* Logo & Title */}
                <div className="text-center mb-8">
                    {logo && <Image src={logo} unoptimized alt="logo" className="w-28 mx-auto mb-3" />}
                    <h1 className="text-gray-800 font-extrabold text-3xl flex justify-center items-center gap-2">
                        <KeyRound className="text-orange-500" />
                        Reset <span className="text-orange-500">Password</span>
                    </h1>
                    <p className="text-gray-500 text-sm mt-2">
                        Enter your email, verification code, and new password.
                    </p>
                </div>

                {errorMessage && <ErrorMessage message={errorMessage} onClose={() => setErrorMessage(null)} />}
                {successMessage && <SuccessMessage message={successMessage} onClose={() => setSuccessMessage(null)} />}

                {/* Reset Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Email */}
                    <div>
                        <label className="text-gray-700 font-medium mb-2 block">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                required
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="Enter your email"
                                className="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
                            />
                        </div>
                    </div>

                    {/* Code */}
                    <div>
                        <label className="text-gray-700 font-medium mb-2 block">Verification Code</label>
                        <input
                            required
                            type="text"
                            name="code"
                            value={form.code}
                            onChange={handleChange}
                            placeholder="Enter the code sent to your email"
                            className="w-full h-12 px-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
                        />
                    </div>

                    {/* New Password */}
                    <div>
                        <label className="text-gray-700 font-medium mb-2 block">New Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                required
                                type="password"
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                placeholder="Enter new password"
                                className="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
                            />
                        </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className="text-gray-700 font-medium mb-2 block">Confirm Password</label>
                        <div className="relative">
                            <Check className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                required
                                type="password"
                                name="password_confirmation"
                                value={form.password_confirmation}
                                onChange={handleChange}
                                placeholder="Confirm new password"
                                className="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
                            />
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        className="w-full h-12 rounded-xl font-semibold bg-orange-500 text-white hover:bg-orange-600 hover:shadow-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        Reset Password
                    </button>
                </form>

                {/* Footer */}
                <p className="text-sm text-gray-600 text-center mt-6">
                    Back to{" "}
                    <Link href="/login" className="text-orange-500 font-medium hover:underline">
                        Login
                    </Link>
                </p>
            </div>
        </section>
    );
}
