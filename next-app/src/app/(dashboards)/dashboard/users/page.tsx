"use client";

import { useEffect, useState } from "react";
import React from "react";
import { useLoader } from "@/context/LoaderContext";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FaArrowLeft, FaSearch, FaEye, FaBan, FaCheckCircle } from "react-icons/fa";
import ErrorMessage from "@/components/(sheared)/ErrorMessage";
import SuccessMessage from "@/components/(sheared)/SuccessMessage";
import Modal from "@/components/(sheared)/Modal";
import { getAllUsers, toggleUserStatus, User } from "../../../../../utils/userApi";

function Users() {
    const [users, setUsers] = useState<User[]>([]);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const { showLoader, hideLoader } = useLoader();
    const router = useRouter();
    
    // Pagination & Filters
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);
    const [perPage] = useState(15);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');
    const [loading, setLoading] = useState(false);

    // Modal state
    const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
    const [userToToggle, setUserToToggle] = useState<User | null>(null);

    const uploadUrl = (`${process.env.NEXT_PUBLIC_UPLOAD_BASE}/storage`) || "http://localhost:8000";

    useEffect(() => {
        fetchUsers();
    }, [currentPage, statusFilter]);

    const fetchUsers = async () => {
        setLoading(true);
        showLoader();
        try {
            const response = await getAllUsers({
                page: currentPage,
                per_page: perPage,
                search: searchQuery || undefined,
                status: statusFilter,
                sort_by: 'created_at',
                sort_order: 'desc'
            });
            
            setUsers(response.users.data);
            setCurrentPage(response.users.current_page);
            setTotalPages(response.users.last_page);
            setTotalUsers(response.users.total);
        } catch (err: any) {
            console.error(err);
            setErrorMessage(err.message || "Failed to load users");
        } finally {
            hideLoader();
            setLoading(false);
        }
    };

    const handleSearch = () => {
        setCurrentPage(1);
        fetchUsers();
    };

    const handleToggleStatus = (user: User) => {
        setUserToToggle(user);
        setIsBlockModalOpen(true);
    };

    const confirmToggleStatus = async () => {
        if (!userToToggle) return;

        showLoader();
        try {
            const response = await toggleUserStatus(userToToggle.id);
            setSuccessMessage(response.message);
            setIsBlockModalOpen(false);
            setUserToToggle(null);
            fetchUsers(); // Refresh the list
        } catch (err: any) {
            setErrorMessage(err.message || "Failed to update user status");
        } finally {
            hideLoader();
        }
    };

    const viewUserDetails = (userId: number) => {
        router.push(`/dashboard/users/${userId}`);
    };

    return (
        <div className="z-[999]">
            {errorMessage && (
                <ErrorMessage
                    message={errorMessage}
                    onClose={() => setErrorMessage(null)}
                />
            )}
            {successMessage && (
                <SuccessMessage
                    message={successMessage}
                    onClose={() => setSuccessMessage(null)}
                />
            )}

            <div>
                <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-md mb-4">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="lg:text-2xl text-lg px-5 font-semibold text-gray-800 tracking-tight">
                            User Management ({totalUsers} Users)
                        </h2>
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full shadow transition"
                        >
                            <FaArrowLeft className="text-lg" />
                            <span className="font-medium">Back</span>
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap gap-3 px-5">
                        {/* Search */}
                        <div className="flex-1 min-w-[250px]">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    placeholder="Search by name, email, phone..."
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                    onClick={handleSearch}
                                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition flex items-center gap-2"
                                >
                                    <FaSearch />
                                    Search
                                </button>
                            </div>
                        </div>

                        {/* Status Filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'blocked')}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Users</option>
                            <option value="active">Active Users</option>
                            <option value="blocked">Blocked Users</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-2xl shadow-lg border border-gray-200 bg-white">
                    <table className="w-full min-w-[700px] text-sm text-left">
                        <thead className="bg-gray-50 uppercase text-xs font-semibold text-gray-600">
                            <tr>
                                <th className="px-6 py-4">S.No.</th>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Email</th>
                                <th className="px-6 py-4">Phone Number</th>
                                <th className="px-6 py-4">Image</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Actions</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-200 text-gray-700">
                            {users.length ? (
                                users.map((user, index) => {
                                    let primaryUrl: string | null = null;
                                    if (user.profile_picture) {
                                        const cleanBase = uploadUrl.replace(/\/+$/, "");
                                        const cleanPath = user.profile_picture
                                            .replace(/^\/+/, "")
                                            .replace(/\\/g, "/");
                                        const fullUrl = `${cleanBase}/${cleanPath}`;

                                        try {
                                            new URL(fullUrl);
                                            primaryUrl = fullUrl;
                                        } catch {
                                            console.warn("Invalid image URL:", fullUrl);
                                            primaryUrl = null;
                                        }
                                    }

                                    return (
                                        <tr
                                            key={user.id}
                                            className="bg-white hover:bg-gray-50 transition"
                                        >
                                            <td className="px-6 py-4">{(currentPage - 1) * perPage + index + 1}</td>
                                            <td className="px-6 py-4 font-medium">{user.name}</td>
                                            <td className="px-6 py-4">{user.email}</td>
                                            <td className="px-6 py-4">{user.phone_number || '-'}</td>

                                            <td className="px-6 py-4">
                                                {primaryUrl ? (
                                                    <Image
                                                        src={primaryUrl}
                                                        alt={user.name || "User"}
                                                        width={50}
                                                        height={50}
                                                        className="object-cover rounded-full"
                                                        unoptimized
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-semibold">
                                                        {user.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </td>

                                            <td className="px-6 py-4">
                                                {user.status ? (
                                                    <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium flex items-center gap-1 w-fit">
                                                        <FaCheckCircle />
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium flex items-center gap-1 w-fit">
                                                        <FaBan />
                                                        Blocked
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="flex gap-2">
                                                    <button
                                                        className="px-3 py-1.5 text-sm rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition flex items-center gap-1"
                                                        onClick={() => viewUserDetails(user.id)}
                                                    >
                                                        <FaEye />
                                                        View
                                                    </button>
                                                    <button
                                                        className={`px-3 py-1.5 text-sm rounded-lg transition flex items-center gap-1 ${
                                                            user.status
                                                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                                                        }`}
                                                        onClick={() => handleToggleStatus(user)}
                                                    >
                                                        {user.status ? (
                                                            <>
                                                                <FaBan />
                                                                Block
                                                            </>
                                                        ) : (
                                                            <>
                                                                <FaCheckCircle />
                                                                Unblock
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="text-center text-zinc-400 py-8 italic"
                                    >
                                        {loading ? 'Loading users...' : 'No Users Found'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 mt-6 pb-4">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1 || loading}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        
                        <span className="text-sm text-gray-600">
                            Page {currentPage} of {totalPages}
                        </span>
                        
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages || loading}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {/* Block/Unblock Confirmation Modal */}
            <Modal
                width="max-w-md"
                isOpen={isBlockModalOpen}
                onClose={() => {
                    setIsBlockModalOpen(false);
                    setUserToToggle(null);
                }}
                title={userToToggle?.status ? "Block User" : "Unblock User"}
            >
                <div className="space-y-4 p-4">
                    <p className="text-gray-700">
                        Are you sure you want to {userToToggle?.status ? 'block' : 'unblock'}{' '}
                        <span className="font-semibold">{userToToggle?.name}</span>?
                    </p>
                    
                    {userToToggle?.status && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <p className="text-sm text-yellow-800">
                                ⚠️ Blocking this user will:
                            </p>
                            <ul className="text-sm text-yellow-700 mt-2 ml-4 list-disc">
                                <li>Log them out immediately</li>
                                <li>Prevent them from logging in</li>
                                <li>Revoke all their active sessions</li>
                            </ul>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            onClick={() => {
                                setIsBlockModalOpen(false);
                                setUserToToggle(null);
                            }}
                            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmToggleStatus}
                            className={`px-4 py-2 rounded-lg transition text-white ${
                                userToToggle?.status
                                    ? 'bg-red-500 hover:bg-red-600'
                                    : 'bg-green-500 hover:bg-green-600'
                            }`}
                        >
                            {userToToggle?.status ? 'Block User' : 'Unblock User'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

export default Users;
