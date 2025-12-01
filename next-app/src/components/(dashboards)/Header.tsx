"use client";

import { Menu, Bell, Search, User, LogOut, Home } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";

interface HeaderProps {
    onToggleSidebar: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [showUserModal, setShowUserModal] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
                setShowUserModal(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleLogout = () => {
        logout();
        router.push("/login");
    };

    return (
        <header className="sticky top-0 z-50  bg-white border-b rounded-2xl mx-3 mt-2 border-gray-200 shadow-sm">
            <div className="flex items-center justify-between px-4 py-2">
                {/* Left Section - Sidebar Toggle */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={onToggleSidebar}
                        className="text-gray-600 hover:text-[#ff9903] hover:bg-gray-50 p-2 rounded-lg transition-all duration-200"
                        aria-label="Toggle Sidebar"
                    >
                        <Menu className="w-6 h-6" />
                    </button>

                    <h1 className="text-lg font-semibold text-gray-800 hidden sm:block">
                        Zelton Admin Dashboard
                    </h1>
                </div>

                {/* Right Section - User Menu & Notifications */}
                <div className="flex items-center gap-3">
                    {/* Notifications */}
                    <button
                        className="relative text-gray-600 hover:text-[#ff9903] hover:bg-gray-50 p-2 rounded-lg transition-all duration-200"
                        aria-label="Notifications"
                    >
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                    </button>

                    {/* User Menu */}
                    <div className="relative" ref={modalRef}>
                        <button
                            onClick={() => setShowUserModal((prev) => !prev)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all duration-200"
                        >
                            <div className="size-8 bg-[#ff9903] text-white rounded-full flex items-center justify-center text-sm font-bold">
                                {user?.name?.charAt(0).toUpperCase() || "U"}
                            </div>
                            <span className="text-sm font-medium text-gray-800 hidden md:block">
                                {user?.name || "User"}
                            </span>
                        </button>

                        {showUserModal && (
                            <div className="absolute right-0 top-12 bg-white border border-gray-100 shadow-xl rounded-xl w-56 overflow-hidden transition-all duration-200">
                                <div className="px-4 py-3 border-b border-gray-100">
                                    <p className="text-sm font-medium text-gray-900">{user?.name || "User"}</p>
                                    <p className="text-xs text-gray-500 truncate">{user?.email || ""}</p>
                                </div>

                                <div className="py-1">
                                    <Link
                                        href="/"
                                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-[#fff8ef] hover:text-[#ff9903] transition-all duration-150"
                                        onClick={() => setShowUserModal(false)}
                                    >
                                        <Home className="w-4 h-4" />
                                        Home
                                    </Link>
                                    <Link
                                        href="/profile"
                                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-[#fff8ef] hover:text-[#ff9903] transition-all duration-150"
                                        onClick={() => setShowUserModal(false)}
                                    >
                                        <User className="w-4 h-4" />
                                        Profile
                                    </Link>
                                </div>

                                <div className="border-t border-gray-100">
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-all duration-150"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Logout
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
