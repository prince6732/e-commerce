"use client";

import { useEffect, useState } from "react";
import React from "react";
import { useLoader } from "@/context/LoaderContext";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FaArrowLeft } from "react-icons/fa";
import { User } from "@/common/interface";
import ErrorMessage from "@/components/(sheared)/ErrorMessage";
import SuccessMessage from "@/components/(sheared)/SuccessMessage";
import Modal from "@/components/(sheared)/Modal";
import { getAllUsers } from "../../../../../utils/auth";

function Users() {
    const [brands, setBrands] = useState<User[]>([]);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const { showLoader, hideLoader } = useLoader();
    const router = useRouter();
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [brandToDelete, setBrandToDelete] = useState<number | null>(null);

    const uploadUrl = (`${process.env.NEXT_PUBLIC_UPLOAD_BASE}/storage`) || "https://api.zelton.co.in";

    useEffect(() => {
        getAllBrands();
    }, []);

    const getAllBrands = async () => {
        showLoader();
        try {
            const data = await getAllUsers();
            setBrands(data);
        } catch (err) {
            console.error(err);
            setErrorMessage("Failed to load users");
        } finally {
            hideLoader();
        }
    };

    const detail = (id: number) => {
        router.push(`/sub-categories/${id}`);
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
                    <div className="flex items-center justify-between">
                        <h2 className="lg:text-2xl text-lg px-5 font-semibold text-gray-800 tracking-tight">
                            All Users
                        </h2>
                        <div className="flex gap-3 justify-end">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full shadow transition"
                            >
                                <FaArrowLeft className="text-lg" />
                                <span className="font-medium">Back</span>
                            </button>
                        </div>
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
                            {brands.length ? (
                                brands.map((brand, index) => {
                                    let primaryUrl: string | null = null;
                                    if (brand.profile_picture) {
                                        const cleanBase = uploadUrl.replace(/\/+$/, "");
                                        const cleanPath = brand.profile_picture
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
                                            key={brand.id}
                                            className="bg-white hover:bg-gray-50 transition"
                                        >
                                            <td className="px-6 py-4">{index + 1}</td>
                                            <td className="px-6 py-4">{brand.name}</td>
                                            <td className="px-6 py-4">{brand.email}</td>
                                            <td className="px-6 py-4">{brand.phone_number}</td>

                                            <td className="px-6 py-4">
                                                {primaryUrl ? (
                                                    <Image
                                                        src={primaryUrl}
                                                        alt={brand.name || "User"}
                                                        width={80}
                                                        height={80}
                                                        className="object-cover rounded"
                                                        unoptimized
                                                    />
                                                ) : (
                                                    <span className="text-xs text-zinc-400 italic">
                                                        No Image
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-6 py-4">
                                                {brand.status ? (
                                                    <span className="px-2 py-1 rounded bg-green-500 text-white text-xs">
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-1 rounded bg-red-500 text-white text-xs">
                                                        Inactive
                                                    </span>
                                                )}
                                            </td>

                                            {/* <td className="px-6 py-4 flex gap-2">
                                                <button
                                                    className="px-3 py-1 text-sm rounded bg-green-100 text-green-700 hover:bg-green-200"
                                                    onClick={() => detail(Number(brand.id))}
                                                >
                                                    Detail
                                                </button>
                                            </td> */}
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="text-center text-zinc-400 py-8 italic"
                                    >
                                        No Users Found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <Modal
                width="max-w-md"
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setBrandToDelete(null);
                }}
                title="Confirm Delete"
            >
                <div className="space-y-6">
                    <p className="text-gray-700 text-lg">
                        Are you sure you want to delete this user?
                    </p>
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => {
                                setIsDeleteModalOpen(false);
                                setBrandToDelete(null);
                            }}
                            className="px-4 py-2 rounded-full bg-gray-300 hover:bg-gray-400 text-gray-800 transition"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

export default Users;
