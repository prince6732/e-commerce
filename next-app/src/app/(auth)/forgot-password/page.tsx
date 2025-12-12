"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import * as Yup from "yup";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import ErrorMessage from "@/components/(sheared)/ErrorMessage";
import SuccessMessage from "@/components/(sheared)/SuccessMessage";
import Link from "next/link";
import logo from "@/public/ZeltonHorizontalBlack.png";
import Image from "next/image";
import { forgotPassword } from "../../../../utils/auth";
import { KeyRound, Mail } from "lucide-react";

const schema = Yup.object().shape({
    email: Yup.string()
        .email("Please enter a valid email address")
        .required("Email is required"),
});

interface ForgotPasswordForm {
    email: string;
}

export default function ForgotPasswordPage() {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const router = useRouter();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ForgotPasswordForm>({
        resolver: yupResolver(schema),
    });

    const onSubmit = async (data: ForgotPasswordForm) => {
        setError("");
        setMessage("");
        setErrorMessage(null);
        setSuccessMessage(null);
        setLoading(true);

        try {
            const res = await forgotPassword(data.email);
            setMessage(res.message);
            setSuccessMessage("Reset code sent successfully! Redirecting...");

            // Save email to localStorage for reset password page
            localStorage.setItem("resetPasswordEmail", data.email);

            setTimeout(() => {
                router.push("/reset-password");
            }, 1500);
        } catch (err) {
            const error = err as AxiosError<{ message?: string }>;
            const errorMsg = error.response?.data?.message || "Something went wrong";
            setError(errorMsg);
            setErrorMessage(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-10">
            {errorMessage && <ErrorMessage message={errorMessage} onClose={() => setErrorMessage(null)} />}
            {successMessage && <SuccessMessage message={successMessage} onClose={() => setSuccessMessage(null)} />}
            <div className="w-full max-w-md bg-white rounded-3xl shadow-lg p-8 sm:p-10">
                {/* Logo & Title */}
                <div className="text-center mb-8">
                    {logo && <Image src={logo} unoptimized alt="logo" className="w-28 mx-auto mb-3" />}
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
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                                {...register("email")}
                                type="email"
                                placeholder="Enter your email"
                                className={`w-full h-12 pl-10 pr-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-400 transition ${
                                    errors.email ? "border-red-400" : "border-gray-300"
                                }`}
                            />
                        </div>
                        {errors.email && (
                            <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
                        )}
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
