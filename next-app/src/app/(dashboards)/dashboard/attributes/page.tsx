"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Modal from "@/components/(sheared)/Modal";
import ErrorMessage from "@/components/(sheared)/ErrorMessage";
import SuccessMessage from "@/components/(sheared)/SuccessMessage";
import { useLoader } from "@/context/LoaderContext";
import { Pencil, Trash2 } from "lucide-react";
import ProtectedRoute from "@/components/(sheared)/ProtectedRoute";
import { useRouter } from "next/navigation";
import { TiInfoLargeOutline } from "react-icons/ti";
import { createAttribute, deleteAttribute, fetchAttributes, updateAttribute } from "../../../../../utils/attribute";
import { Attribute } from "@/common/interface";

const schema = yup.object({
    name: yup.string().required("Name is required").max(50),
    description: yup.string().nullable(),
    status: yup.boolean().required(),
});

type FormValues = yup.InferType<typeof schema>;

export default function AttributesManagement() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFormSubmit, setIsFormSubmit] = useState(false);
    const [selectedAttribute, setSelectedAttribute] = useState<Attribute | null>(
        null
    );
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [attributes, setAttributes] = useState<Attribute[]>([]);
    const { showLoader, hideLoader } = useLoader();
    const router = useRouter();

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors },
    } = useForm<any>({
        resolver: yupResolver(schema),
        mode: "onChange",
        defaultValues: {
            name: "",
            description: "",
            status: true,
        },
    });

    useEffect(() => {
        getAttributes();
    }, []);

    const getAttributes = async () => {
        showLoader();
        try {
            const res = await fetchAttributes();
            setAttributes(res);
        } catch {
            setErrorMessage("Please try again");
        } finally {
            hideLoader();
        }
    };

    const onDetail = (attribute: Attribute) => {
        router.push(`/dashboard/attributes/${attribute.id}/attribute-values`);
    };

    const openModal = (attribute: Attribute | null = null) => {
        setSelectedAttribute(attribute);

        if (attribute) {
            reset({
                name: attribute.name,
                description: attribute.description ?? "",
                status: attribute.status,
            });
        } else {
            reset({
                name: "",
                description: "",
                status: true,
            });
        }
        setIsModalOpen(true);
    };

    const onSubmit = async (data: FormValues) => {
        showLoader();
        setIsFormSubmit(true);
        setErrorMessage(null);
        setSuccessMessage(null);

        try {
            const payload = {
                ...data,
                description: data.description ?? undefined,
                status: Boolean(data.status),
            };

            if (selectedAttribute) {
                await updateAttribute(selectedAttribute.id, payload);
                setSuccessMessage("Attribute updated successfully!");
            } else {
                await createAttribute(payload);
                setSuccessMessage("Attribute created successfully!");
            }

            await getAttributes();
            reset({ name: "", description: "", status: true });
            setIsModalOpen(false);
        } catch {
            setErrorMessage("Please try again.");
        } finally {
            setIsFormSubmit(false);
            hideLoader();
        }
    };

    const confirmDelete = (attribute: Attribute) => {
        setSelectedAttribute(attribute);
        setIsDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        if (!selectedAttribute) return;
        showLoader();
        try {
            await deleteAttribute(selectedAttribute.id);
            setSuccessMessage("Attribute deleted successfully!");
            await getAttributes();
            setIsDeleteModalOpen(false);
        } catch {
            setErrorMessage("Please try again");
        } finally {
            hideLoader();
        }
    };

    return (
        <ProtectedRoute role="Admin">
            <div className="z-[999]">
                {errorMessage && (<ErrorMessage message={errorMessage} onClose={() => setErrorMessage(null)} />)}
                {successMessage && (<SuccessMessage message={successMessage} onClose={() => setSuccessMessage(null)} />)}

                {/* header */}
                <div className="p-2 bg-white/5 border border-gc-300/30 rounded-3xl shadow flex items-center justify-between mb-3">
                    <h2 className="lg:text-2xl text-lg px-5 font-semibold text-gray-700">
                        Attributes
                    </h2>
                    <button
                        className="flex items-center px-10 py-3 bg-orange-400 hover:bg-orange-500 rounded-full font-semibold text-white transition"
                        onClick={() => openModal(null)}
                    >
                        + Create Attribute
                    </button>
                </div>

                {/* table */}
                <div className="overflow-x-auto scrollbar rounded-2xl shadow border border-gc-300/30 bg-transparent">
                    <table className="w-full min-w-[800px] text-sm text-left">
                        <thead className="  uppercase text-xs font-semibold text-gray-700">
                            <tr>
                                <th className="px-6 py-4">S.No.</th>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Description</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-end">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gc-300/30 text-gray-700">
                            {attributes.length ? (
                                attributes.map((attr, index) => (
                                    <tr
                                        key={attr.id}
                                        className="bg-white/5 hover:bg-white/10 transition"
                                    >
                                        <td className="px-6 py-4">{index + 1}</td>
                                        <td className="px-6 py-4">{attr.name}</td>
                                        <td className="px-6 py-4">{attr.description}</td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-medium ${attr.status
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-red-100 text-red-700"
                                                    }`}
                                            >
                                                {attr.status ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    title="Edit Attribute"
                                                    onClick={() => openModal(attr)}
                                                    className="size-10 bg-gc-300/30 hover:bg-orange-400 flex justify-center items-center rounded-full"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button
                                                    title="Delete Attribute"
                                                    onClick={() => confirmDelete(attr)}
                                                    className="size-10 bg-gc-300/30 hover:bg-orange-400 flex justify-center items-center rounded-full"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    title="View Attribute Values"
                                                    onClick={() => onDetail(attr)}
                                                    className="size-10 bg-gc-300/30 hover:bg-orange-400 flex justify-center items-center rounded-full"
                                                >
                                                    <TiInfoLargeOutline className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="text-center text-zinc-400 py-8 italic"
                                    >
                                        No Attributes Found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* modal */}
                <Modal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        reset({ name: "", description: "", status: true });
                        setSelectedAttribute(null);
                    }}
                    title={selectedAttribute ? "Edit Attribute" : "Add Attribute"}
                    width="max-w-xl"
                >
                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="grid gap-8 bg-gradient-to-br from-white to-white text-gray-100 p-6 rounded-2xl border border-black/10 backdrop-blur-lg"
                    >
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-1">
                                Name <span className="text-red-400">*</span>
                            </label>
                            <input
                                {...register("name")}
                                type="text"
                                placeholder="Enter Attribute Name"
                                className="w-full min-h-12 py-2 px-4 rounded-xl bg-white/10 border border-black/10 placeholder-gray-400 text-black focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all duration-200"
                            />
                            <p className="text-sm text-red-400 mt-1">{errors.name?.message as any}</p>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-1">
                                Description
                            </label>
                            <input
                                {...register("description")}
                                type="text"
                                placeholder="Enter Description (optional)"
                                className="w-full min-h-12 py-2 px-4 rounded-xl bg-white/10 border border-black/10 placeholder-gray-400 text-black focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all duration-200"
                            />
                        </div>

                        {/* Divider */}
                        <hr className="border-black/10" />

                        {/* Status + Submit */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            {/* Status Toggle */}
                            <label className="flex items-center gap-3 cursor-pointer">
                                <span className="text-sm font-medium text-gray-900">Status</span>
                                <div
                                    className={`flex items-center h-6 w-12 rounded-full transition-all duration-300 ${watch("status") ? "bg-green-500" : "bg-zinc-600"
                                        }`}
                                >
                                    <input type="checkbox" {...register("status")} hidden />
                                    <div
                                        className={`h-6 w-6 rounded-full bg-white shadow-md transform transition-all duration-300 ${watch("status") ? "translate-x-6" : "translate-x-0"
                                            }`}
                                    ></div>
                                </div>
                            </label>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isFormSubmit}
                                className={`px-10 py-3 w-full sm:w-auto font-semibold rounded-full text-white shadow-lg transition-all duration-300 ${isFormSubmit
                                    ? "bg-orange-500/60 cursor-not-allowed"
                                    : "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 hover:shadow-orange-500/30"
                                    }`}
                            >
                                {isFormSubmit
                                    ? "Saving..."
                                    : selectedAttribute
                                        ? "Update Attribute"
                                        : "Save Attribute"}
                            </button>
                        </div>
                    </form>
                </Modal>


                {/* delete modal */}
                <Modal
                    width="max-w-xl"
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    title="Confirm Delete"
                >
                    <p className="text-gray-700">Are you sure you want to delete {selectedAttribute?.name}?</p>
                    <div className="mt-4 flex justify-end space-x-4">
                        <button
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="rounded bg-gray-500 px-4 py-2 text-white"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDelete}
                            className="rounded bg-red-500 px-4 py-2 text-white"
                        >
                            Delete
                        </button>
                    </div>
                </Modal>
            </div>
        </ProtectedRoute>
    );
}
