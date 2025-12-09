"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import Modal from "@/components/(sheared)/Modal";
import ErrorMessage from "@/components/(sheared)/ErrorMessage";
import SuccessMessage from "@/components/(sheared)/SuccessMessage";
import { useLoader } from "@/context/LoaderContext";
import { AxiosError } from "axios";
import { Pencil, Trash2, GripVertical } from "lucide-react";
import ProtectedRoute from "@/components/(sheared)/ProtectedRoute";
import ImageCropperModal from "@/components/(frontend)/ImageCropperModal";
import { createSlider, deleteSlider, fetchSliders, SliderPayload, updateSlider, updateSliderOrder } from "../../../../../utils/slider";
import { Slider } from "@/common/interface";

const basePath = process.env.NEXT_PUBLIC_UPLOAD_BASE || "https://api.zelton.co.in";

const schema = yup.object({
    title: yup.string().required("Title is required").min(2).max(100),
    description: yup.string().nullable(),
    link: yup.string().nullable().url("Please enter a valid URL"),
    open_in_new_tab: yup.boolean(),
    status: yup.boolean(),
    image: yup.mixed().nullable(),
});

type FormData = yup.InferType<typeof schema>;

function SlidersManagement() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFormSubmit, setIsFormSubmit] = useState(false);
    const [selectedSlider, setSelectedSlider] = useState<Slider | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [sliders, setSliders] = useState<Slider[]>([]);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [draggedItem, setDraggedItem] = useState<Slider | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const { showLoader, hideLoader } = useLoader();

    const {
        register,
        handleSubmit,
        setValue,
        reset,
        watch,
        formState: { errors },
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: { status: true },
    });

    useEffect(() => {
        getSliders();
    }, []);

    const getSliders = async () => {
        showLoader();
        try {
            const data = await fetchSliders();
            setSliders(data);
        } catch {
            setErrorMessage("Please try again");
        } finally {
            hideLoader();
        }
    };

    const openModal = (slider: Slider | null = null) => {
        setSelectedSlider(slider);
        setPreviewImage(null);

        if (slider) {
            setValue("title", slider.title);
            setValue("description", slider.description);
            setValue("link", slider.link || "");
            setValue("open_in_new_tab", slider.open_in_new_tab || false);
            setValue("status", slider.status);
            setPreviewImage(slider.image || null);
        } else {
            reset({ status: true, open_in_new_tab: false });
        }
        setIsModalOpen(true);
    };

    const onSubmit = async (data: FormData) => {
        if (!selectedSlider && !previewImage) {
            setErrorMessage("Image is required for new sliders");
            return;
        }

        showLoader();
        setIsFormSubmit(true);
        setErrorMessage(null);
        setSuccessMessage(null);

        try {
            const payload: SliderPayload = {
                title: data.title,
                description: data.description ?? "",
                link: data.link ?? "",
                open_in_new_tab: data.open_in_new_tab ?? false,
                status: data.status ?? true,
                image: previewImage || "",
            };

            if (selectedSlider) {
                await updateSlider(selectedSlider.id, payload);
                setSuccessMessage("Slider updated successfully!");
            } else {
                await createSlider(payload);
                setSuccessMessage("Slider created successfully!");
            }

            await getSliders();
            reset({ status: true, open_in_new_tab: false });
            setPreviewImage(null);
            setIsModalOpen(false);
        } catch (err) {
            const error = err as AxiosError<{ message?: string }>;
            setErrorMessage(error.response?.data?.message || "Please try again.");
        } finally {
            setIsFormSubmit(false);
            hideLoader();
        }
    };

    const confirmDelete = (slider: Slider) => {
        setSelectedSlider(slider);
        setIsDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        showLoader();
        try {
            if (selectedSlider) {
                await deleteSlider(selectedSlider.id);
                setSuccessMessage("Slider deleted successfully!");
                await getSliders();
                setIsDeleteModalOpen(false);
            }
        } catch {
            setErrorMessage("Please try again");
        } finally {
            hideLoader();
        }
    };

    const handleDragStart = (e: React.DragEvent, slider: Slider) => {
        setDraggedItem(slider);
        setIsDragging(true);
        e.dataTransfer.effectAllowed = 'move';

        const target = e.currentTarget as HTMLElement;
        target.style.opacity = '0.5';
        target.style.transform = 'scale(0.95)';
    };

    const handleDragEnd = (e: React.DragEvent) => {
        setDraggedItem(null);
        setIsDragging(false);

        const target = e.currentTarget as HTMLElement;
        target.style.opacity = '1';
        target.style.transform = 'scale(1)';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        const target = e.currentTarget as HTMLElement;
        if (!target.classList.contains('drag-over')) {
            target.classList.add('drag-over');
            target.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
            target.style.borderTop = '2px solid #3b82f6';
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        const target = e.currentTarget as HTMLElement;
        target.classList.remove('drag-over');
        target.style.backgroundColor = '';
        target.style.borderTop = '';
    };

    const handleDrop = async (e: React.DragEvent, targetSlider: Slider) => {
        e.preventDefault();

        const target = e.currentTarget as HTMLElement;
        target.classList.remove('drag-over');
        target.style.backgroundColor = '';
        target.style.borderTop = '';

        if (!draggedItem || draggedItem.id === targetSlider.id) {
            return;
        }

        const newSliders = [...sliders];
        const draggedIndex = newSliders.findIndex(s => s.id === draggedItem.id);
        const targetIndex = newSliders.findIndex(s => s.id === targetSlider.id);

        newSliders.splice(draggedIndex, 1);
        newSliders.splice(targetIndex, 0, draggedItem);

        setSliders(newSliders);

        try {
            const orderIds = newSliders.map(slider => slider.id);
            await updateSliderOrder(orderIds);
            setSuccessMessage("Slider order updated successfully!");
        } catch (error) {
            await getSliders();
            setErrorMessage("Failed to update slider order. Please try again.");
        }
    };

    return (
        <ProtectedRoute role="Admin">
            <div className="z-[999]">
                {errorMessage && (
                    <ErrorMessage message={errorMessage} onClose={() => setErrorMessage(null)} />
                )}
                {successMessage && (
                    <SuccessMessage message={successMessage} onClose={() => setSuccessMessage(null)} />
                )}

                {/* header */}
                <div className="p-2 border border-gc-300/30 rounded-3xl shadow flex items-center justify-between mb-3">
                    <h2 className="lg:text-2xl text-lg px-5 font-semibold text-gray-700">Sliders</h2>
                    <button
                        className="flex items-center px-10 py-3 bg-orange-400 hover:bg-orange-500 rounded-full font-semibold text-white transition"
                        onClick={() => openModal(null)}
                    >
                        + Create Slider
                    </button>
                </div>

                {/* Drag and Drop Info */}
                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700 flex items-center gap-2">
                        <GripVertical className="h-4 w-4" />
                        Drag and drop rows to reorder sliders. Changes will be saved automatically.
                    </p>
                </div>

                {/* table */}
                <div className={`overflow-x-auto scrollbar rounded-2xl shadow border border-gc-300/30 bg-transparent ${isDragging ? 'bg-blue-50/20' : ''}`}>
                    <table className="w-full min-w-[800px] text-sm text-left">
                        <thead className="  uppercase text-xs font-semibold text-gray-700">
                            <tr>
                                <th className="px-3 py-4 w-10"></th>
                                <th className="px-6 py-4">S.No.</th>
                                <th className="px-6 py-4">Image</th>
                                <th className="px-6 py-4">Title</th>
                                <th className="px-6 py-4">Sub Title</th>
                                <th className="px-6 py-4">Link</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-end">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gc-300/30 text-gray-700">
                            {sliders.length ? (
                                sliders.map((slider, index) => (
                                    <tr
                                        key={slider.id}
                                        className={`bg-white/5 hover:bg-white/10 transition cursor-move ${isDragging ? 'select-none' : ''}`}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, slider)}
                                        onDragEnd={handleDragEnd}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={(e) => handleDrop(e, slider)}
                                    >
                                        <td className="px-3 py-4">
                                            <GripVertical className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                                        </td>
                                        <td className="px-6 py-4">{index + 1}</td>
                                        <td className="px-6 py-4">
                                            {slider.image ? (
                                                <img
                                                    src={`${basePath}${slider.image}`}
                                                    alt={slider.title}
                                                    className="h-16 w-30 rounded object-cover"
                                                />
                                            ) : (
                                                <span>No Image</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">{slider.title}</td>
                                        <td className="px-6 py-4">{slider.description}</td>
                                        <td className="px-6 py-4">
                                            {slider.link ? (
                                                <a
                                                    href={slider.link}
                                                    target={slider.open_in_new_tab ? "_blank" : "_self"}
                                                    rel="noopener noreferrer"
                                                    className="text-orange-500 hover:text-orange-600 underline max-w-[150px] block truncate"
                                                    title={slider.link}
                                                >
                                                    {slider.link}
                                                </a>
                                            ) : (
                                                <span className="text-gray-400">No Link</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-medium ${slider.status
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-red-100 text-red-700"
                                                    }`}
                                            >
                                                {slider.status ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => openModal(slider)}
                                                    className="size-10 bg-gc-300/30 hover:bg-orange-400 flex justify-center items-center rounded-full"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => confirmDelete(slider)}
                                                    className="size-10 bg-gc-300/30 hover:bg-orange-400 flex justify-center items-center rounded-full"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="text-center text-zinc-400 py-8 italic">
                                        No Sliders Found
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
                        reset({ status: true, open_in_new_tab: false });
                        setPreviewImage(null);
                    }}
                    title={selectedSlider ? "Edit Slider" : "Add Slider"}
                    width="max-w-5xl"
                >
                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="grid gap-8 bg-gradient-to-br from-white to-white text-gray-100 p-6 rounded-2xl border border-black/10 backdrop-blur-lg shadow-xl"
                    >
                        {/* Title & Sub Title */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-1">
                                    Title <span className="text-red-400">*</span>
                                </label>
                                <input
                                    {...register("title")}
                                    type="text"
                                    placeholder="Enter Title"
                                    className="w-full min-h-12 py-2 px-4 rounded-xl bg-white/10 border border-black/10 placeholder-gray-400 text-black focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all duration-200"
                                />
                                <p className="text-sm text-red-400 mt-1">{errors.title?.message}</p>
                            </div>

                            {/* Sub Title */}
                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-1">
                                    Sub Title
                                </label>
                                <input
                                    {...register("description")}
                                    type="text"
                                    placeholder="Enter Sub Title"
                                    className="w-full min-h-12 py-2 px-4 rounded-xl bg-white/10 border border-black/10 placeholder-gray-400 text-black focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all duration-200"
                                />
                            </div>
                        </div>

                        {/* Link Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Link URL */}
                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-1">
                                    Link URL
                                </label>
                                <input
                                    {...register("link")}
                                    type="url"
                                    placeholder="Enter Link URL (optional)"
                                    className="w-full min-h-12 py-2 px-4 rounded-xl bg-white/10 border border-black/10 placeholder-gray-400 text-black focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all duration-200"
                                />
                                <p className="text-sm text-red-400 mt-1">{errors.link?.message}</p>
                            </div>

                            {/* Open in New Tab */}
                            <div className="flex items-center gap-3 pt-6">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <span className="text-sm font-medium text-gray-900">Open in New Tab</span>
                                    <div
                                        className={`flex items-center h-6 w-12 rounded-full transition-all duration-300 ${watch("open_in_new_tab") ? "bg-orange-500" : "bg-zinc-600"
                                            }`}
                                    >
                                        <input type="checkbox" {...register("open_in_new_tab")} hidden />
                                        <div
                                            className={`h-6 w-6 rounded-full bg-white shadow-md transform transition-all duration-300 ${watch("open_in_new_tab") ? "translate-x-6" : "translate-x-0"
                                                }`}
                                        ></div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <hr className="border-black/10" />

                        {/* Image Upload Section */}
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                Image
                            </label>

                            <div className="flex items-center gap-4">
                                <ImageCropperModal
                                    multiple={false}
                                    onSelect={(img: string | string[]) => {
                                        const selected = Array.isArray(img) ? img[0] : img;
                                        setValue("image", selected);
                                        setPreviewImage(selected);
                                    }}
                                    buttonLabel="Select Image"
                                    directory="sliders"
                                    aspectRatio={16 / 9}
                                />
                                <div>
                                    {previewImage ? (
                                        <img
                                            src={`${process.env.NEXT_PUBLIC_UPLOAD_BASE}${previewImage}`}
                                            alt="Slider Preview"
                                            className="mt-1 h-24 w-40 rounded-xl object-cover border border-black/10 shadow-md"
                                        />
                                    ) : (
                                        <div className="mt-1 h-24 w-40 rounded-xl border border-black/10 flex items-center justify-center text-xs text-gray-400 bg-white/5">
                                            No Image
                                        </div>
                                    )}
                                </div>
                            </div>
                            <p className="text-sm text-red-400 mt-1">{errors.image?.message}</p>
                        </div>

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
                                className={`px-10 py-3 rounded-full font-semibold text-white shadow-lg transition-all duration-300 w-full sm:w-auto ${isFormSubmit
                                    ? "bg-orange-400/40 cursor-not-allowed"
                                    : "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 hover:shadow-orange-500/30"
                                    }`}
                            >
                                {isFormSubmit
                                    ? "Saving..."
                                    : selectedSlider
                                        ? "Update Slider"
                                        : "Save Slider"}
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
                    <p className="text-black">Are you sure you want to delete {selectedSlider?.title}?</p>
                    <div className="mt-4 flex justify-end space-x-4">
                        <button
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="rounded bg-gray-500 px-4 py-2 text-white"
                        >
                            Cancel
                        </button>
                        <button onClick={handleDelete} className="rounded bg-red-500 px-4 py-2 text-white">
                            Delete
                        </button>
                    </div>
                </Modal>
            </div>
        </ProtectedRoute>
    );
}

export default SlidersManagement;
