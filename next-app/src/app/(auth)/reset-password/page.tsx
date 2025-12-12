"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import * as Yup from "yup";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import Link from "next/link";
import logo from "@/public/ZeltonHorizontalBlack.png";
import Image from "next/image";
import { resetPassword } from "../../../../utils/auth";
import { KeyRound, Lock, ArrowLeft, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { useLoader } from "@/context/LoaderContext";
import ErrorMessage from "@/components/(sheared)/ErrorMessage";
import SuccessMessage from "@/components/(sheared)/SuccessMessage";

const schema = Yup.object().shape({
    password: Yup.string()
        .min(8, "Password must be at least 8 characters")
        // .matches(/[a-z]/, "Password must contain at least one lowercase letter")
        // .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
        // .matches(/[0-9]/, "Password must contain at least one number")
        .required("Password is required"),
    passwordConfirmation: Yup.string()
        .oneOf([Yup.ref("password")], "Passwords must match")
        .required("Please confirm your password"),
});

interface ResetPasswordForm {
    password: string;
    passwordConfirmation: string;
}

export default function ResetPasswordPage() {
    const router = useRouter();
    const { showLoader, hideLoader } = useLoader();

    const [email, setEmail] = useState<string>("");
    const [code, setCode] = useState(["", "", "", "", "", ""]);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
    } = useForm<ResetPasswordForm>({
        resolver: yupResolver(schema),
    });

    const password = watch("password");
    const passwordConfirmation = watch("passwordConfirmation");

    useEffect(() => {
        const savedEmail = localStorage.getItem("resetPasswordEmail");
        if (savedEmail) {
            setEmail(savedEmail);
        } else {
            setErrorMessage("No email found. Please request a password reset first.");
        }
    }, []);

    const handleCodeChange = (index: number, value: string) => {
        if (value.length > 1) {
            value = value[0];
        }

        if (!/^\d*$/.test(value)) return;

        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text").slice(0, 6);
        if (!/^\d+$/.test(pastedData)) return;

        const newCode = [...code];
        pastedData.split("").forEach((char, index) => {
            if (index < 6) newCode[index] = char;
        });
        setCode(newCode);

        const nextEmptyIndex = newCode.findIndex((val) => !val);
        const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
        inputRefs.current[focusIndex]?.focus();
    };

    const onSubmit = async (data: ResetPasswordForm) => {
        setErrorMessage(null);
        setSuccessMessage(null);

        if (!email) {
            setErrorMessage("Email not found. Please request a password reset first.");
            return;
        }

        const codeString = code.join("");
        if (codeString.length !== 6) {
            setErrorMessage("Please enter all 6 digits of the reset code.");
            return;
        }

        showLoader();

        try {
            const res = await resetPassword({
                email,
                code: codeString,
                password: data.password,
                password_confirmation: data.passwordConfirmation,
            });
            setSuccessMessage("Password reset successfully! Redirecting to login...");
            localStorage.removeItem("resetPasswordEmail");

            setTimeout(() => router.push("/login"), 2000);
        } catch (err) {
            const error = err as AxiosError<{ message?: string }>;
            const errorMsg = error.response?.data?.message || "Something went wrong";
            setErrorMessage(errorMsg);
        } finally {
            hideLoader();
        }
    };

    return (
        <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-50 px-4 py-10">
            <div className="w-full max-w-md">
                {/* Back Button */}
                <Link
                    href="/forgot-password"
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-500 transition mb-4"
                >
                    <ArrowLeft size={20} />
                    <span>Back to Forgot Password</span>
                </Link>

                {/* Main Card */}
                <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-10 border border-orange-100">
                    {/* Logo & Title */}
                    <div className="text-center mb-8">
                        {logo && <Image src={logo} unoptimized alt="Zelton Logo" className="w-32 mx-auto mb-4" />}
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <KeyRound className="text-white" size={36} />
                        </div>
                        <h1 className="text-gray-800 font-extrabold text-3xl mb-2">
                            Reset Password
                        </h1>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            Enter the 6-digit code sent to
                            <br />
                            <span className="text-orange-600 font-semibold">{email || "your email"}</span>
                        </p>
                    </div>

                    {errorMessage && <ErrorMessage message={errorMessage} onClose={() => setErrorMessage(null)} />}
                    {successMessage && <SuccessMessage message={successMessage} onClose={() => setSuccessMessage(null)} />}

                    {/* Reset Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Code Input */}
                        <div>
                            <label className="text-gray-700 font-semibold mb-3 block text-center">
                                Enter Reset Code
                            </label>
                            <div className="flex gap-2 justify-center" onPaste={handlePaste}>
                                {code.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={(el) => { inputRefs.current[index] = el; }}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleCodeChange(index, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(index, e)}
                                        className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold rounded-xl border-2 border-gray-300 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 transition"
                                        autoFocus={index === 0}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* New Password */}
                        <div>
                            <label className="text-gray-700 font-medium mb-2 block">New Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    {...register("password")}
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter new password (min 8 characters)"
                                    className={`w-full h-12 pl-10 pr-12 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-400 transition ${
                                        errors.password ? "border-red-400" : "border-gray-300"
                                    }`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="text-gray-700 font-medium mb-2 block">Confirm Password</label>
                            <div className="relative">
                                <CheckCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    {...register("passwordConfirmation")}
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Confirm new password"
                                    className={`w-full h-12 pl-10 pr-12 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-400 transition ${
                                        errors.passwordConfirmation ? "border-red-400" : "border-gray-300"
                                    }`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {errors.passwordConfirmation && (
                                <p className="text-sm text-red-500 mt-1">{errors.passwordConfirmation.message}</p>
                            )}
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            className="w-full h-14 rounded-xl font-semibold bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
                        >
                            <KeyRound size={20} />
                            <span>Reset Password</span>
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center my-6">
                        <div className="flex-1 border-t border-gray-200"></div>
                        <span className="px-4 text-xs text-gray-400 uppercase tracking-wider">Or</span>
                        <div className="flex-1 border-t border-gray-200"></div>
                    </div>

                    {/* Footer */}
                    <div className="text-center space-y-2">
                        <p className="text-sm text-gray-600">
                            Remember your password?{" "}
                            <Link href="/login" className="text-orange-600 font-semibold hover:underline">
                                Login here
                            </Link>
                        </p>
                        <p className="text-xs text-gray-400">
                            Didn't receive the code?{" "}
                            <Link
                                href="/forgot-password"
                                className="text-orange-600 hover:underline"
                            >
                                Request again
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Info Box */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
                    <p className="font-semibold mb-1">💡 Tips:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>Reset code is valid for 15 minutes</li>
                        <li>Password must be at least 8 characters</li>
                        <li>Check your spam folder if you don't see the email</li>
                    </ul>
                </div>
            </div>
        </section>
    );
}
