"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import * as yup from "yup";
import Modal from "@/components/(sheared)/Modal";
import ErrorMessage from "@/components/(sheared)/ErrorMessage";
import SuccessMessage from "@/components/(sheared)/SuccessMessage";
import { useLoader } from "@/context/LoaderContext";
import { useParams, useRouter } from "next/navigation";
import { AxiosError } from "axios";
import { Pencil, Trash2 } from "lucide-react";
import ProtectedRoute from "@/components/(sheared)/ProtectedRoute";
import {
    createAttributeValue,
    deleteAttributeValue,
    fetchAttributeValues,
    updateAttributeValue
} from "../../../../../../../utils/attributeValue";
import { AttributeValue } from "@/common/interface";
import { FaArrowLeft } from "react-icons/fa";

const schema = yup.object({
    value: yup.string().required("Value is required").max(100),
    description: yup.string().nullable().max(255, "Description can't exceed 255 characters"),
    status: yup.boolean().required(),
    attributeValues: yup.array(
        yup.object({
            value: yup.string().required("Value is required"),
            description: yup.string().nullable().max(255, "Description can't exceed 255 characters"),
            status: yup.boolean().required(),
        })
    ),
}).required();

type FormData = yup.InferType<typeof schema>;

export default function AttributeValuesManagement() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFormSubmit, setIsFormSubmit] = useState(false);
    const [selectedValue, setSelectedValue] = useState<AttributeValue | null>(null);
    const [values, setValues] = useState<AttributeValue[]>([]);
    const [attributeName, setAttributeName] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const { showLoader, hideLoader } = useLoader();
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const params = useParams();
    const attributeId = Number(params.id);
    const router = useRouter();

    const {
        register,
        handleSubmit,
        reset,
        control,
        watch,
        formState: { errors },
    } = useForm<any>({
        resolver: yupResolver(schema),
        defaultValues: {
            value: "",
            description: "",
            status: true,
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "attributeValues",
    });

    useEffect(() => {
        fetchValues();
    }, [attributeId]);

    const fetchValues = async () => {
        showLoader();
        try {
            const res = await fetchAttributeValues(attributeId);
            setValues(res.values || []);
            setAttributeName(res.attribute?.name || null);
        } catch {
            setErrorMessage("Failed to load attribute values. Please try again.");
        } finally {
            hideLoader();
        }
    };

    const openModal = (val: AttributeValue | null = null) => {
        setSelectedValue(val);
        if (val) {
            reset({ value: val.value, description: val.description || "", status: val.status });
        } else {
            reset({ value: "", description: "", status: true, attributeValues: [] });
        }
        setIsModalOpen(true);
    };

    const onSubmit = async (data: FormData) => {
        showLoader();
        setIsFormSubmit(true);
        setErrorMessage(null);
        setSuccessMessage(null);
        const payload = {
            ...data,
            attributeValues: [
                ...(data.attributeValues || []),
                { value: data.value, description: data.description, status: data.status },
            ],
            attribute_id: attributeId,
        };

        try {
            if (selectedValue) {
                await updateAttributeValue(selectedValue.id, payload as any);
                setSuccessMessage("Value updated successfully!");
            } else {
                await createAttributeValue(payload as any);
                setSuccessMessage("Value created successfully!");
            }

            await fetchValues();
            reset({ value: "", description: "", status: true, attributeValues: [] });
            setIsModalOpen(false);
        } catch (err) {
            const error = err as AxiosError<{ message?: string }>;
            setErrorMessage(error.response?.data?.message || "Please try again.");
        } finally {
            setIsFormSubmit(false);
            hideLoader();
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === values.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(values.map((v) => v.id));
        }
    };

    const toggleSelect = (id: number) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    };

    const confirmDelete = (val: AttributeValue) => {
        setSelectedValue(val);
        setIsDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        if (!selectedValue) return;
        showLoader();
        try {
            await deleteAttributeValue(selectedValue.id);
            setSuccessMessage("Value deleted successfully!");
            await fetchValues();
            setIsDeleteModalOpen(false);
        } catch {
            setErrorMessage("Failed to delete value. Please try again.");
        } finally {
            hideLoader();
        }
    };

    return (
        <ProtectedRoute role="Admin">
            <div className="z-[999]">
                {errorMessage && <ErrorMessage message={errorMessage} onClose={() => setErrorMessage(null)} />}
                {successMessage && <SuccessMessage message={successMessage} onClose={() => setSuccessMessage(null)} />}

                <div className="p-5 bg-white/70 backdrop-blur border border-gray-200 rounded-2xl shadow-lg mb-5">
                    <div className="flex items-center justify-between">

                        {/* Title */}
                        <h2 className="lg:text-3xl text-xl font-bold px-5 text-gray-900 tracking-tight">
                            {attributeName ? `${attributeName} | Values` : "Attribute Values"}
                        </h2>

                        {/* Buttons */}
                        <div className="flex gap-3">

                            {/* Back Button */}
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="flex items-center gap-2 px-4 py-2 
                bg-gray-100 hover:bg-gray-200 
                text-gray-700 rounded-xl shadow-sm 
                hover:shadow-md transition-all duration-200"
                            >
                                <FaArrowLeft className="text-lg" />
                                <span className="font-medium">Back</span>
                            </button>

                            {/* Create Value Button */}
                            <button
                                onClick={() => openModal(null)}
                                className="flex items-center gap-2 px-6 py-3 
                bg-gradient-to-r from-orange-400 to-yellow-400 
                hover:from-orange-500 hover:to-yellow-500 
                rounded-xl shadow-md text-white font-semibold 
                hover:shadow-lg transition-all duration-200"
                            >
                                + Create Value
                            </button>
                        </div>
                    </div>
                </div>


                <div className="overflow-x-auto scrollbar rounded-2xl shadow border border-gc-300/30 bg-transparent">
                    <table className="w-full min-w-[600px] text-sm text-left">
                        <thead className="  uppercase text-xs font-semibold text-gray-700">
                            <tr>
                                {/* Select All Checkbox */}
                                {/* <th className="px-4 py-4">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.length === values.length && values.length > 0}
                                        onChange={toggleSelectAll}
                                        className="size-4 accent-orange-500 cursor-pointer"
                                    />
                                </th> */}
                                <th className="px-6 py-4">S.No.</th>
                                <th className="px-6 py-4">Value</th>
                                <th className="px-6 py-4">Description</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-end">Action</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gc-300/30 text-gray-700">
                            {values.length ? (
                                values.map((val, index) => (
                                    <tr
                                        key={val.id}
                                        className={`bg-white/5 hover:bg-white/10 transition ${selectedIds.includes(val.id) ? "bg-white/10" : ""
                                            }`}
                                    >
                                        {/* Row Checkbox */}
                                        {/* <td className="px-4 py-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(val.id)}
                                                onChange={() => toggleSelect(val.id)}
                                                className="size-4 accent-orange-500 cursor-pointer"
                                            />
                                        </td> */}

                                        <td className="px-6 py-4">{index + 1}</td>
                                        <td className="px-6 py-4">{val.value}</td>
                                        <td className="px-6 py-4">{val.description}</td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-medium ${val.status
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-red-100 text-red-700"
                                                    }`}
                                            >
                                                {val.status ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right flex gap-2 justify-end">
                                            <button
                                                title="Edit Value"
                                                onClick={() => openModal(val)}
                                                className="size-10 bg-gc-300/30 hover:bg-orange-400 flex justify-center items-center rounded-full"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                            <button
                                                title="Delete Value"
                                                onClick={() => confirmDelete(val)}
                                                className="size-10 bg-gc-300/30 hover:bg-orange-400 flex justify-center items-center rounded-full"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="text-center text-zinc-400 py-8 italic"
                                    >
                                        No Values Found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Form Modal */}
                <Modal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        reset({ value: "", description: "", status: true });
                        setSelectedValue(null);
                    }}
                    title={selectedValue ? "Edit Value" : "Add Value"}
                    width="max-w-3xl"
                >
                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="grid gap-8 bg-gradient-to-br from-white to-white text-gray-100 p-6 rounded-2xl border border-black/10 backdrop-blur-lg"
                    >
                        {/* Single Value Inputs */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Value */}
                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-1">
                                    Value <span className="text-red-400">*</span>
                                </label>
                                <input
                                    {...register("value")}
                                    placeholder="Enter Value"
                                    className="w-full min-h-12 py-2 px-4 rounded-xl bg-white/10 border border-black/10 placeholder-gray-400 text-black focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all duration-200"
                                />
                                <p className="text-sm text-red-400 mt-1">{errors.value?.message as any}</p>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-1">
                                    Description
                                </label>
                                <input
                                    {...register("description")}
                                    placeholder="Enter Description (optional)"
                                    className="w-full min-h-12 py-2 px-4 rounded-xl bg-white/10 border border-black/10 placeholder-gray-400 text-black focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all duration-200"
                                />
                                <p className="text-sm text-red-400 mt-1">{errors.description?.message as any}</p>
                            </div>
                        </div>
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

                        {/* Divider */}
                        <hr className="border-black/10" />

                        {/* Dynamic Values (Add More Section) */}
                        {!selectedValue && (
                            <div className="space-y-6">
                                {fields.map((field, index) => {
                                    const statusFieldName = `attributeValues.${index}.status` as const;
                                    const statusValue = watch(statusFieldName);

                                    return (
                                        <div
                                            key={field.id}
                                            className="p-4 rounded-xl bg-white/5 border border-black/10 backdrop-blur-md"
                                        >
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {/* Value */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-900 mb-1">
                                                        Value <span className="text-red-400">*</span>
                                                    </label>
                                                    <input
                                                        {...register(`attributeValues.${index}.value` as const)}
                                                        placeholder="Enter Value"
                                                        className="w-full min-h-12 py-2 px-4 rounded-xl bg-white/10 border border-black/10 placeholder-gray-400 text-black focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all duration-200"
                                                    />
                                                    <p className="text-sm text-red-400 mt-1">
                                                        {(errors.attributeValues as any)?.[index]?.value?.message}
                                                    </p>
                                                </div>

                                                {/* Description */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-900 mb-1">
                                                        Description
                                                    </label>
                                                    <input
                                                        {...register(`attributeValues.${index}.description` as const)}
                                                        placeholder="Enter Description"
                                                        className="w-full min-h-12 py-2 px-4 rounded-xl bg-white/10 border border-black/10 placeholder-gray-400 text-black focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all duration-200"
                                                    />
                                                    <p className="text-sm text-red-400 mt-1">
                                                        {(errors.attributeValues as any)?.[index]?.description?.message}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Status & Remove */}
                                            <div className="flex justify-between items-center mt-3">
                                                <label className="flex items-center gap-3 cursor-pointer select-none">
                                                    <span className="text-sm font-medium text-gray-900">Status</span>
                                                    <div
                                                        className={`flex items-center h-6 w-12 rounded-full transition-all duration-300 ${statusValue ? "bg-green-500" : "bg-zinc-600"
                                                            }`}
                                                    >
                                                        <input type="checkbox" {...register(statusFieldName)} hidden />
                                                        <div
                                                            className={`h-6 w-6 rounded-full bg-white shadow-md transform transition-all duration-300 ${statusValue ? "translate-x-6" : "translate-x-0"
                                                                }`}
                                                        ></div>
                                                    </div>
                                                </label>

                                                <button
                                                    type="button"
                                                    onClick={() => remove(index)}
                                                    className="flex items-center gap-1 text-sm bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full transition-all duration-200 shadow-md"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Submit */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            {/* Action Buttons */}
                            <div className="flex gap-2">
                                {!selectedValue && (
                                    <button
                                        type="button"
                                        onClick={() => append({ value: "", description: "", status: true })}
                                        className="px-6 py-3 rounded-full font-semibold bg-blue-500 hover:bg-blue-600 text-white transition-all duration-200 shadow-lg hover:shadow-blue-500/30"
                                    >
                                        + Add More
                                    </button>
                                )}

                                <button
                                    type="submit"
                                    disabled={isFormSubmit}
                                    className={`px-10 py-3 font-semibold rounded-full text-white shadow-lg transition-all duration-300 ${isFormSubmit
                                        ? "bg-orange-500/60 cursor-not-allowed"
                                        : "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 hover:shadow-orange-500/30"
                                        }`}
                                >
                                    {isFormSubmit ? "Saving..." : selectedValue ? "Update Value" : "Save Value"}
                                </button>
                            </div>
                        </div>
                    </form>
                </Modal>


                {/* Delete Modal */}
                <Modal width="max-w-xl" isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Delete">
                    <p className="text-gray-700">Are you sure you want to delete {selectedValue?.value}?</p>
                    <div className="mt-4 flex justify-end space-x-4">
                        <button onClick={() => setIsDeleteModalOpen(false)} className="rounded bg-gray-500 px-4 py-2 text-white">
                            Cancel
                        </button>
                        <button onClick={handleDelete} className="rounded bg-red-500 px-4 py-2 text-white">
                            Delete
                        </button>
                    </div>
                </Modal>
            </div>
        </ProtectedRoute >
    );
}
