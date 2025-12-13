"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import * as yup from "yup";
import React from "react";
import { useLoader } from "@/context/LoaderContext";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { yupResolver } from "@hookform/resolvers/yup/dist/yup.js";
import { FaArrowLeft } from "react-icons/fa";
import JoditEditor from "jodit-react";
import { Brand } from "@/common/interface";
import {
    createBrand,
    deleteBrand,
    fetchBrands,
    updateBrand
} from "../../../../../utils/brand";
import ErrorMessage from "@/components/(sheared)/ErrorMessage";
import SuccessMessage from "@/components/(sheared)/SuccessMessage";
import Modal from "@/components/(sheared)/Modal";
import ImageCropperModal from "@/components/(frontend)/ImageCropperModal";
import { Pencil, Trash2 } from "lucide-react";
import { TiInfoLargeOutline } from "react-icons/ti";

const schema = yup.object({
    name: yup.string().required("Name is required").min(2).max(50),
    description: yup.string().required("Description is required").max(1000),
    image1: yup.string().required("image is required"),
    description1: yup.string().max(1000, "Description can be max 1000 characters"),
    image2: yup.string(),
    description2: yup.string().max(1000, "Description can be max 1000 characters"),
    image3: yup.string(),
    description3: yup.string().max(1000, "Description can be max 1000 characters"),
    status: yup.boolean().required(),
});

type FormData = yup.InferType<typeof schema>;

function AdminBrandManagement() {
    const [brands, setBrands] = useState<Brand[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
    const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [previewImage1, setPreviewImage1] = useState<string | null>(null);
    const [previewImage2, setPreviewImage2] = useState<string | null>(null);
    const [previewImage3, setPreviewImage3] = useState<string | null>(null);
    const { showLoader, hideLoader } = useLoader();
    const router = useRouter();
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [brandToDelete, setBrandToDelete] = useState<number | null>(null);
    const uploadUrl = process.env.NEXT_PUBLIC_UPLOAD_BASE || "https://api.zelton.co.in";

    const config = useMemo(
        () => ({
            "uploader": {
                "insertImageAsBase64URI": true
            },
            showPlaceholder: false,
            readonly: false,
            buttons: "bold,italic,underline,strikethrough,ul,ol,font,fontsize,paragraph,image,video,hr,table,link,indent,outdent,left,undo,redo"
        }),
        []
    );

    const {
        register,
        handleSubmit,
        setValue,
        reset,
        control,
        watch,
        formState: { errors },
    } = useForm<any>({
        resolver: yupResolver(schema),
        defaultValues: { status: true },

    });

    useEffect(() => {
        getAllBrands();
    }, []);

    const getAllBrands = async () => {
        showLoader();
        try {
            const data = await fetchBrands();
            setBrands(data);
        } catch (err) {
            console.error(err);
            setErrorMessage("Failed to load brands");
        } finally {
            hideLoader();
        }
    };

    const openDescriptionModal = (item: Brand | null = null) => {
        setSelectedBrand(item);
        if (item) {
            setIsDescriptionModalOpen(true);
        }
    };

    const openModal = (brand: Brand | null = null) => {
        setSelectedBrand(brand);

        if (brand) {
            setValue("name", brand.name);
            setValue("description", brand.description ?? "");
            setValue("description1", brand.description1 ?? "");
            setValue("description2", brand.description2 ?? "");
            setValue("description3", brand.description3 ?? "");
            setValue("status", Boolean(brand.status));

            const normalize = (path?: string | null) =>
                path ? path.replace(/\\/g, "/") : null;

            setPreviewImage1(normalize(brand.image1));
            setPreviewImage2(normalize(brand.image2));
            setPreviewImage3(normalize(brand.image3));
            if (brand.image1) setValue("image1", brand.image1);
            if (brand.image2) setValue("image2", brand.image2);
            if (brand.image3) setValue("image3", brand.image3);
        } else {
            reset({ status: true });
            setPreviewImage1(null);
            setPreviewImage2(null);
            setPreviewImage3(null);
        }
        setIsModalOpen(true);
    };

    const onSubmit = async (data: FormData) => {
        showLoader();
        setErrorMessage(null);
        setSuccessMessage(null);
        try {
            if (selectedBrand) {
                await updateBrand(selectedBrand.id, data as any);
                setSuccessMessage("Brand updated successfully!");
            } else {
                await createBrand(data as any);
                setSuccessMessage("Brand created successfully!");
            }
            getAllBrands();
            reset();
            setPreviewImage1(null);
            setPreviewImage2(null);
            setIsModalOpen(false);
        } catch (err) {
            console.error(err);
            setErrorMessage(selectedBrand ? "Failed to update brand" : "Failed to create brand");
        } finally {
            hideLoader();
        }
    };

    const confirmDelete = (id: number) => {
        setBrandToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        if (!brandToDelete) return;

        showLoader();
        setErrorMessage(null);
        setSuccessMessage(null);

        try {
            await deleteBrand(brandToDelete.toString());
            setSuccessMessage("Brand deleted successfully!");
            getAllBrands();
        } catch (err) {
            console.error(err);
            setErrorMessage("Failed to delete brand");
        } finally {
            hideLoader();
            setIsDeleteModalOpen(false);
            setBrandToDelete(null);
        }
    };

    return (
        <div className="z-[999]">
            {errorMessage && <ErrorMessage message={errorMessage} onClose={() => setErrorMessage(null)} />}
            {successMessage && <SuccessMessage message={successMessage} onClose={() => setSuccessMessage(null)} />}

            <div>
                <div className="p-5 bg-white/70 backdrop-blur border border-gray-200 rounded-2xl shadow-lg mb-5">
                    <div className="flex items-center justify-between">

                        {/* Title */}
                        <h2 className="lg:text-3xl text-xl font-bold px-5 text-gray-900 tracking-tight">
                            Brands
                        </h2>

                        {/* Buttons */}
                        <div className="flex gap-3">

                            {/* Create Brand Button */}
                            <button
                                onClick={() => openModal(null)}
                                className="flex items-center gap-2 px-5 py-3 
                bg-gradient-to-r from-orange-400 to-yellow-400 
                hover:from-orange-500 hover:to-yellow-500 
                rounded-xl shadow-md text-white font-semibold
                hover:shadow-lg transition-all duration-200"
                            >
                                + Create Brand
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
                                <th className="px-6 py-4">Description</th>
                                <th className="px-6 py-4">Section 1 Image</th>
                                <th className="px-6 py-4">Section 2 Image</th>
                                <th className="px-6 py-4">Section 3 Image</th>
                                <th className="px-6 py-4">Description</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 text-gray-700">
                            {brands.length ? (
                                brands.map((brand, index) => {
                                    const primaryUrl = brand.image1
                                        ? `${uploadUrl}${brand.image1.replace(/\\/g, "/")}`
                                        : null;
                                    const secondaryUrl = brand.image2
                                        ? `${uploadUrl}${brand.image2.replace(/\\/g, "/")}`
                                        : null;
                                    const tertiaryUrl = brand.image3
                                        ? `${uploadUrl}${brand.image3.replace(/\\/g, "/")}`
                                        : null;

                                    return (
                                        <tr key={brand.id} className="bg-white/5 hover:bg-white/10 transition">
                                            <td className="px-6 py-4">{index + 1}</td>
                                            <td className="px-6 py-4">{brand.name}</td>
                                            <td className="px-6 py-4" dangerouslySetInnerHTML={{ __html: brand?.description || "<p>No Description</p>" }} ></td>

                                            <td className="px-6 py-4">
                                                {primaryUrl ? (
                                                    <Image
                                                        src={primaryUrl}
                                                        alt={brand.name}
                                                        width={80}
                                                        height={80}
                                                        className="object-cover rounded"
                                                        unoptimized
                                                    />
                                                ) : (
                                                    <span className="text-xs text-zinc-400 italic">No Image</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {secondaryUrl ? (
                                                    <Image
                                                        src={secondaryUrl}
                                                        alt={brand.name}
                                                        width={80}
                                                        height={80}
                                                        className="object-cover rounded"
                                                        unoptimized
                                                    />
                                                ) : (
                                                    <span className="text-xs text-zinc-400 italic">No Image</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {tertiaryUrl ? (
                                                    <Image
                                                        src={tertiaryUrl}
                                                        alt={brand.name}
                                                        width={80}
                                                        height={80}
                                                        className="object-cover rounded"
                                                        unoptimized
                                                    />
                                                ) : (
                                                    <span className="text-xs text-zinc-400 italic">No Image</span>
                                                )}
                                            </td>

                                            {/* Description Button */}
                                            <td className="px-6 py-4">
                                                <button
                                                    className="px-3 py-2 text-xs rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 font-semibold transition"
                                                    onClick={() => openDescriptionModal(brand)}
                                                >
                                                    View Description
                                                </button>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`px-3 py-2 rounded-md text-xs font-medium ${brand.status
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-red-100 text-red-700"
                                                        }`}
                                                >
                                                    {brand.status ? "Active" : "Inactive"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 flex gap-2">
                                                <button
                                                    title="Edit Brand"
                                                    onClick={() => openModal(brand)}
                                                    className="size-10 bg-gc-300/30 hover:bg-orange-400 flex justify-center items-center rounded-full"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button
                                                    title="Delete Brand"
                                                    onClick={() => confirmDelete(Number(brand.id))}
                                                    className="size-10 bg-gc-300/30 hover:bg-orange-400 flex justify-center items-center rounded-full"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={5} className="text-center text-zinc-400 py-8 italic">
                                        No Brands Found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Brand Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    reset();
                    setPreviewImage1(null);
                    setPreviewImage2(null);
                    setPreviewImage3(null);
                }}
                width="max-w-5xl"
                title={selectedBrand ? "Edit Brand" : "Add Brand"}
            >
                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="grid gap-8 bg-gradient-to-br from-white to-white text-gray-100 p-6 rounded-2xl border border-black/10 backdrop-blur-lg"
                >
                    {/* Brand Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1">
                            Name <span className="text-red-400">*</span>
                        </label>
                        <input
                            {...register("name")}
                            type="text"
                            placeholder="Enter Brand Name"
                            className="w-full min-h-12 py-2 px-4 rounded-xl bg-white/10 border border-black/10 placeholder-gray-400 text-black focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all duration-200"
                        />
                        <p className="text-sm text-red-400 mt-1">{errors.name?.message as any}</p>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                            Description <span className="text-red-400">*</span>
                        </label>
                        <div className="rounded-xl overflow-hidden border border-gray-300 bg-white">
                            <Controller
                                name="description"
                                control={control}
                                defaultValue=""
                                render={({ field: { onChange, value } }) => (
                                    <JoditEditor
                                        value={value ?? ""}
                                        config={{
                                            ...config,
                                            style: {
                                                color: "#000",
                                                background: "#fff",
                                                minHeight: "200px",
                                            },
                                            toolbarAdaptive: false,
                                            toolbarSticky: false,
                                        }}
                                        onBlur={(newContent) => onChange(newContent)}
                                    />
                                )}
                            />
                        </div>
                        <p className="text-sm text-red-500 mt-1">{errors.description?.message as any}</p>
                    </div>

                    <hr className="border-black/10" />

                    {/* Section 1 */}
                    <div className="bg-white/5 border border-black/10 rounded-2xl p-5 shadow-md">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Primary Section</h3>
                        <div className="space-y-4">
                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-2">
                                    Description <span className="text-red-400">*</span>
                                </label>
                                <div className="rounded-xl overflow-hidden border border-gray-300 bg-white">
                                    <Controller
                                        name="description1"
                                        control={control}
                                        defaultValue=""
                                        render={({ field: { onChange, value } }) => (
                                            <JoditEditor
                                                value={value ?? ""}
                                                config={{
                                                    ...config,
                                                    style: { color: "#000", background: "#fff", minHeight: "200px" },
                                                }}
                                                onBlur={(newContent) => onChange(newContent)}
                                            />
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Image */}
                            <div className="flex items-center gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-2">
                                        Primary Image
                                    </label>
                                    <ImageCropperModal
                                        onSelect={(img: any) => {
                                            setValue("image1", img);
                                            setPreviewImage1(img);
                                        }}
                                        buttonLabel="Select Image"
                                        directory="brands"
                                    />
                                </div>
                                <div>
                                    {previewImage1 ? (
                                        <img
                                            src={`${uploadUrl}${previewImage1}`}
                                            alt="Primary"
                                            className="h-24 w-24 rounded-xl object-cover border border-black/10 shadow-md"
                                        />
                                    ) : (
                                        <div className="h-24 w-24 flex items-center justify-center rounded-xl bg-black/5 border border-black/10 text-xs text-gray-400">
                                            No Image
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 2 */}
                    <div className="bg-white/5 border border-black/10 rounded-2xl p-5 shadow-md">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Second Section</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-2">
                                    Description <span className="text-red-400">*</span>
                                </label>
                                <div className="rounded-xl overflow-hidden border border-gray-300 bg-white">
                                    <Controller
                                        name="description2"
                                        control={control}
                                        defaultValue=""
                                        render={({ field: { onChange, value } }) => (
                                            <JoditEditor
                                                value={value ?? ""}
                                                config={{
                                                    ...config,
                                                    style: { color: "#000", background: "#fff", minHeight: "200px" },
                                                }}
                                                onBlur={(newContent) => onChange(newContent)}
                                            />
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Image */}
                            <div className="flex items-center gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-2">
                                        Secondary Image
                                    </label>
                                    <ImageCropperModal
                                        onSelect={(img: any) => {
                                            setValue("image2", img);
                                            setPreviewImage2(img);
                                        }}
                                        buttonLabel="Select Image"
                                        directory="brands"
                                    />
                                </div>
                                <div>
                                    {previewImage2 ? (
                                        <img
                                            src={`${uploadUrl}${previewImage2}`}
                                            alt="Secondary"
                                            className="h-24 w-24 rounded-xl object-cover border border-black/10 shadow-md"
                                        />
                                    ) : (
                                        <div className="h-24 w-24 flex items-center justify-center rounded-xl bg-black/5 border border-black/10 text-xs text-gray-400">
                                            No Image
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 3 */}
                    <div className="bg-white/5 border border-black/10 rounded-2xl p-5 shadow-md">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Third Section</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-2">
                                    Description <span className="text-red-400">*</span>
                                </label>
                                <div className="rounded-xl overflow-hidden border border-gray-300 bg-white">
                                    <Controller
                                        name="description3"
                                        control={control}
                                        defaultValue=""
                                        render={({ field: { onChange, value } }) => (
                                            <JoditEditor
                                                value={value ?? ""}
                                                config={{
                                                    ...config,
                                                    style: { color: "#000", background: "#fff", minHeight: "200px" },
                                                }}
                                                onBlur={(newContent) => onChange(newContent)}
                                            />
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Image */}
                            <div className="flex items-center gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-2">
                                        Image
                                    </label>
                                    <ImageCropperModal
                                        onSelect={(img: any) => {
                                            setValue("image3", img);
                                            setPreviewImage3(img);
                                        }}
                                        buttonLabel="Select Image"
                                        directory="brands"
                                    />
                                </div>
                                <div>
                                    {previewImage3 ? (
                                        <img
                                            src={`${uploadUrl}${previewImage3}`}
                                            alt="Third"
                                            className="h-24 w-24 rounded-xl object-cover border border-black/10 shadow-md"
                                        />
                                    ) : (
                                        <div className="h-24 w-24 flex items-center justify-center rounded-xl bg-black/5 border border-black/10 text-xs text-gray-400">
                                            No Image
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <hr className="border-black/10" />

                    {/* Status + Submit */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        {/* Status Toggle */}
                        <label className="flex items-center gap-3 cursor-pointer">
                            <span className="text-sm font-medium text-gray-900">Status</span>
                            <div
                                className={`flex items-center h-6 w-12 rounded-full transition-all duration-300 ${watch("status") ? "bg-amber-500" : "bg-zinc-600"
                                    }`}
                            >
                                <input type="checkbox" {...register("status")} hidden />
                                <div
                                    className={`h-6 w-6 rounded-full bg-white shadow-md transform transition-all duration-300 ${watch("status") ? "translate-x-6" : "translate-x-0"
                                        }`}
                                ></div>
                            </div>
                        </label>

                        {/* Submit */}
                        <button
                            type="submit"
                            className="px-10 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold rounded-full transition-all duration-300 shadow-lg hover:shadow-orange-500/30 w-full sm:w-auto"
                        >
                            {selectedBrand ? "Update Brand" : "Save Brand"}
                        </button>
                    </div>
                </form>
            </Modal>


            <Modal
                isOpen={isDescriptionModalOpen}
                onClose={() => {
                    setIsDescriptionModalOpen(false);
                }}
                width="max-w-4xl"
                title="Descriptions"
            >
                <h2 className="text-xl font-semibold text-gray-700">Description 1</h2>
                <div className="text-gray-700 mb-4" dangerouslySetInnerHTML={{ __html: selectedBrand?.description1 || "<p>No Description</p>" }} />
                <h2 className="text-xl font-semibold text-gray-700">Description 2</h2>
                <div className="text-gray-700 mb-4" dangerouslySetInnerHTML={{ __html: selectedBrand?.description2 || "<p>No Description</p>" }} />
                <h2 className="text-xl font-semibold text-gray-700">Description 3</h2>
                <div className="text-gray-700 mb-4" dangerouslySetInnerHTML={{ __html: selectedBrand?.description3 || "<p>No Description</p>" }} />
            </Modal>

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
                        Are you sure you want to delete this brand?
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
                        <button
                            onClick={handleDelete}
                            className="px-4 py-2 rounded-full bg-red-500 hover:bg-red-600 text-white transition"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

export default AdminBrandManagement;
