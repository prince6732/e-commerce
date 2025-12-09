"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AxiosError } from "axios";
import Link from "next/link";
import logo from "@/public/ZeltonHorizontalBlack.png";
import Image from "next/image";
import { verifyEmailCode } from "../../../../utils/auth";
import { Mail } from "lucide-react";

const schema = yup.object().shape({
  code: yup.string().required("Verification code is required"),
});

interface FormData {
  code: string;
}

export default function EmailVerifyPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/");
    }
  }, [user, loading, router]);


  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    const savedEmail = localStorage.getItem("verifyEmail");
    setEmail(savedEmail);
  }, []);

  const onSubmit = async (data: FormData) => {
    if (!email) {
      setServerError("Email not found in storage");
      return;
    }

    try {
      setServerError(null);
      const res = await verifyEmailCode({ email, code: data.code });

      setSuccess(res.message);
      setSuccessMessage(res.message);
      localStorage.removeItem("verifyEmail");

      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      setServerError(error.response?.data?.message || "Verification failed");
    }
  };


  if (loading || user) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600 text-xl">Loading...</p>
      </div>
    );
  }

  return (
    <section className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-lg p-8 sm:p-10">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          {logo && <Image src={logo} unoptimized alt="logo" className="w-28 mx-auto mb-3" />}
          <h1 className="text-gray-800 font-extrabold text-3xl flex justify-center items-center gap-2">
            <Mail className="text-orange-500" />
            Verify Your <span className="text-orange-500">Email</span>
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            Enter the 6-digit code sent to your email address.
          </p>
        </div>

        {/* Success & Error Messages */}
        {success && (
          <div className="bg-green-100 border border-green-300 text-green-700 px-4 py-3 rounded-xl mb-4 text-center">
            {success}
          </div>
        )}
        {serverError && (
          <div className="bg-red-100 border border-red-300 text-red-600 px-4 py-3 rounded-xl mb-4 text-center">
            {serverError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Verification Code */}
          <div>
            <label className="text-gray-700 font-medium mb-2 block">
              Verification Code
            </label>
            <input
              {...register("code")}
              type="text"
              placeholder="Enter your 6-digit code"
              className={`w-full h-12 px-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-400 transition ${errors.code ? "border-red-400" : "border-gray-300"
                }`}
            />
            {errors.code && (
              <p className="text-sm text-red-500 mt-1">
                {errors.code.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 rounded-xl font-semibold bg-orange-500 text-white hover:bg-orange-600 hover:shadow-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Verifying..." : "Verify Email"}
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


