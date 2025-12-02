"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import * as Yup from "yup";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useLoader } from "@/context/LoaderContext";
import { useAuth } from "@/context/AuthContext";
import { AxiosError } from "axios";
import logo from "@/public/ZeltonHorizontalBlack.png";
import Link from "next/link";
import Image from "next/image";
import { Check, Eye, EyeOff, UserPlus } from "lucide-react";
import { registerUser } from "../../../../utils/auth";
import { RegisterUser, User } from "@/common/interface";
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import axios from "../../../../utils/axios";

const schema = Yup.object().shape({
  name: Yup.string().required("Name is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
  password_confirmation: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords must match")
    .required("Please confirm your password"),
  terms: Yup.bool().oneOf([true], "You must accept the terms and conditions"),
});

export default function Home() {
  const router = useRouter();
  const { showLoader, hideLoader } = useLoader();
  const { user, loading, setUserDirectly } = useAuth();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);


  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });


  useEffect(() => {
    if (!loading && user) {
      router.replace("/"); // redirect to home
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600 text-xl">Loading...</p>
      </div>
    );
  }

  const onSubmit = async (data: RegisterUser) => {
    try {
      showLoader();
      await registerUser(data);

      localStorage.setItem("verifyEmail", data.email);
      setSuccessMessage("Verification code successfully sent to your email");

      setTimeout(() => router.push("/email-verify"), 1000);
    } catch (err) {
      const error = err as AxiosError<any>;
      if (error.response) {
        const data = error.response.data;
        if (data.errors) {
          const messages = Object.values(data.errors).flat().join(" ");
          setErrorMessage(messages);
        } else if (data.error) {
          setErrorMessage(data.error);
        } else if (data.message) {
          setErrorMessage(data.message);
        } else {
          setErrorMessage("Registration failed. Please try again.");
        }
      } else {
        setErrorMessage("Network error. Please try again later.");
      }
    } finally {
      hideLoader();
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setErrorMessage(null);
    showLoader();
    try {
      const response = await axios.post('/api/auth/google', {
        token: credentialResponse.credential
      });

      if (response.data.token && response.data.user) {
        const loggedUser: User = response.data.user;
        const token = response.data.token;
        
        localStorage.setItem("user", JSON.stringify(loggedUser));
        localStorage.setItem("token", token);
        setUserDirectly(loggedUser);

        if (loggedUser.role === "Admin") router.push("/dashboard");
        else if (loggedUser.role === "User") router.push("/");
        else setErrorMessage("Invalid role");
      }
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      setErrorMessage(error.response?.data?.message || "Google signup failed");
    } finally {
      hideLoader();
    }
  };

  const handleGoogleError = () => {
    setErrorMessage("Google signup failed. Please try again.");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-10">
      {/* Success & Error Messages */}
      {successMessage && (
        <div className="fixed top-5 z-50 bg-green-100 text-green-700 border border-green-300 rounded-xl px-6 py-3 shadow-lg">
          {successMessage}
          <button onClick={() => setSuccessMessage(null)} className="ml-3 text-green-700 font-bold">
            ✕
          </button>
        </div>
      )}
      {errorMessage && (
        <div className="fixed top-5 z-50 bg-red-100 text-red-700 border border-red-300 rounded-xl px-6 py-3 shadow-lg">
          {errorMessage}
          <button onClick={() => setErrorMessage(null)} className="ml-3 text-red-700 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Main Card */}
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-lg p-8 sm:p-10">
        {/* Header */}
        <div className="text-center mb-8">
          {logo && <Image src={logo} alt="logo" className="w-28 mx-auto mb-3" />}
          <h1 className="text-gray-800 font-extrabold text-3xl flex justify-center items-center gap-2">
            <UserPlus className="text-orange-500" />
            Create Account
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            Join <span className="text-orange-500 font-semibold">Zelton</span> and start shopping today!
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          {/* Name */}
          <div>
            <label className="text-gray-700 font-medium mb-2 block">Full Name</label>
            <input
              {...register("name")}
              type="text"
              placeholder="Enter your name"
              className={`w-full h-12 px-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-400 transition ${errors.name ? "border-red-400" : "border-gray-300"
                }`}
            />
            {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="text-gray-700 font-medium mb-2 block">Email Address</label>
            <input
              {...register("email")}
              type="email"
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
                placeholder="Enter password"
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
            {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="text-gray-700 font-medium mb-2 block">Confirm Password</label>
            <div className="relative">
              <input
                {...register("password_confirmation")}
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm password"
                className={`w-full h-12 px-4 pr-10 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-400 transition ${errors.password_confirmation ? "border-red-400" : "border-gray-300"
                  }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password_confirmation && (
              <p className="text-sm text-red-500 mt-1">{errors.password_confirmation.message}</p>
            )}
          </div>

          {/* Terms & Conditions */}
          <div>
            <label className="flex gap-2 items-start cursor-pointer">
              <input type="checkbox" hidden {...register("terms")} id="terms" className="peer" />
              <div className="size-5 rounded border-2 border-gray-400 flex justify-center items-center text-transparent peer-checked:text-white peer-checked:bg-orange-500 transition">
                <Check className="size-3" strokeWidth={2} />
              </div>
              <span className="text-gray-700 text-sm leading-5">
                I agree to the{" "}
                <Link href="/terms-conditions" className="text-orange-500 underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy-policy" className="text-orange-500 underline">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>
            {errors.terms && <p className="text-sm text-red-500 mt-1">{errors.terms.message}</p>}
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full h-12 font-semibold rounded-xl bg-orange-500 text-white hover:bg-orange-600 hover:shadow-md transition"
          >
            Create My Account
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-4 text-sm text-gray-500">OR</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* Google Signup */}
        <div className="flex justify-center">
          <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              theme="outline"
              size="large"
              width="384"
              text="signup_with"
            />
          </GoogleOAuthProvider>
        </div>

        {/* Footer */}
        <p className="text-sm text-gray-600 text-center mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-orange-500 font-medium hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
