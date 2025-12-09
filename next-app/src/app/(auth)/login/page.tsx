"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { login } from "../../../../utils/auth";
import { useAuth } from "../../../context/AuthContext";
import { useLoader } from "@/context/LoaderContext";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { AxiosError } from "axios";
import Link from "next/link";
import logo from "@/public/ZeltonHorizontalBlack.png";
import Image from "next/image";
import { Check, Eye, EyeOff, LogIn } from "lucide-react";
import { User } from "@/common/interface"; // Use your shared User type
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import axios from "../../../../utils/axios";

const loginSchema = Yup.object().shape({
  email: Yup.string().required("Email is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

export interface LoginFormData {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { showLoader, hideLoader } = useLoader();
  const { user, setUserDirectly, loading } = useAuth();
  const [error, setError] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
  });

  useEffect(() => {
    if (!loading && user) {
      router.replace("/"); // redirect if already logged in
    }
  }, [user, loading, router]);

  const onSubmit = async (data: LoginFormData) => {
    setError("");
    showLoader();
    try {
      const res: LoginResponse = await login(data.email, data.password);
      handleLoginSuccess(res.user, res.token);
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      setError(error.response?.data?.message || "Login failed");
    } finally {
      hideLoader();
    }
  };

  const handleLoginSuccess = (loggedUser: User, token: string) => {
    localStorage.setItem("user", JSON.stringify(loggedUser));
    localStorage.setItem("token", token);
    setUserDirectly(loggedUser);

    if (loggedUser.role === "Admin") router.push("/dashboard");
    else if (loggedUser.role === "User") router.push("/");
    else setError("Invalid role");
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setError("");
    showLoader();
    try {
      const response = await axios.post('/api/auth/google', {
        token: credentialResponse.credential
      });

      if (response.data.token && response.data.user) {
        handleLoginSuccess(response.data.user, response.data.token);
      }
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      setError(error.response?.data?.message || "Google login failed");
    } finally {
      hideLoader();
    }
  };

  const handleGoogleError = () => {
    setError("Google login failed. Please try again.");
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
            <LogIn className="text-orange-500" />
            Login to <span className="text-orange-500">Zelton</span>
          </h1>
          <p className="text-gray-500 text-sm mt-2">Welcome back! Please enter your details.</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-300 text-red-600 px-4 py-3 rounded-xl mb-4 text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Email */}
          <div>
            <label className="text-gray-700 font-medium mb-2 block">Email</label>
            <input
              {...register("email")}
              type="text"
              placeholder="Enter your email"
              className={`w-full h-12 px-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-400 transition ${errors.email ? "border-red-400" : "border-gray-300"
                }`}
            />
            {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="text-gray-700 font-medium mb-2 block">Password</label>
            <div className="relative">
              <input
                {...register("password")}
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                className={`w-full h-12 px-4 pr-10 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-400 transition ${errors.password ? "border-red-400" : "border-gray-300"
                  }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* Remember Me + Forgot Password */}
          <div className="flex justify-between items-center flex-wrap gap-3">
            <label htmlFor="remember" className="flex gap-2 items-center cursor-pointer">
              <input type="checkbox" hidden id="remember" className="peer" />
              <div className="size-5 rounded border-2 border-gray-400 flex justify-center items-center text-transparent peer-checked:text-white peer-checked:bg-orange-500 transition">
                <Check className="size-3" strokeWidth={2} />
              </div>
              <span className="text-gray-700 text-sm font-medium">Remember Me</span>
            </label>

            <Link href="/forgot-password" className="text-orange-500 font-medium text-sm hover:underline">
              Forgot Password?
            </Link>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 rounded-xl font-semibold bg-orange-500 text-white hover:bg-orange-600 hover:shadow-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-4 text-sm text-gray-500">OR</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* Google Login */}
        <div className="flex justify-center">
          <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              theme="outline"
              size="large"
              width="384"
              text="continue_with"
            />
          </GoogleOAuthProvider>
        </div>

        {/* Footer */}
        <p className="text-sm text-gray-600 text-center mt-6">
          Don't have an account?{" "}
          <Link href="/register" className="text-orange-500 font-medium hover:underline">
            Create Now
          </Link>
        </p>
      </div>
    </section>
  );
}
