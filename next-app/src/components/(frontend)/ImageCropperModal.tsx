"use client";

import { useState, useCallback } from "react";
import Cropper, { Area } from "react-easy-crop";
import axios from "../../../utils/axios";
import getCroppedImg from "../../../utils/cropImage";
import Modal from "../(sheared)/Modal";
import { Trash2 } from "lucide-react";

export interface ImageItem {
    url: string;
    selected: boolean;
}

type Props = {
    multiple?: boolean;
    onSelect: (imgs: string[] | string) => void;
    buttonLabel?: string;
    directory?: string;
    aspectRatio?: number;
};

export default function ImageCropperModal({
    multiple = false,
    onSelect,
    buttonLabel = "Select Image",
    directory = "products",
    aspectRatio = 1,
}: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [images, setImages] = useState<ImageItem[]>([]);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedArea, setCroppedArea] = useState<Area | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isCropping, setIsCropping] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [imageToDelete, setImageToDelete] = useState<string | null>(null);

    const uploadUrl = process.env.NEXT_PUBLIC_UPLOAD_BASE || "https://api.zelton.co.in";

    const onCropComplete = useCallback((_croppedArea: Area, croppedPixels: Area) => {
        setCroppedArea(croppedPixels);
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const url = URL.createObjectURL(e.target.files[0]);
            setSelectedImage(url);
        }
    };

    const fetchImages = async () => {
        try {
            const res = await axios.get(`/api/images/get-files/${directory}`);
            const imgs: ImageItem[] = res.data.map((url: string) => ({ url, selected: false }));
            setImages(imgs);
        } catch (err) {
            console.error(err);
            setErrorMessage("Failed to load images.");
        }
    };

    const handleCropSave = async () => {
        if (!selectedImage || !croppedArea) return;

        setIsCropping(true);

        try {
            const blob = await getCroppedImg(selectedImage, croppedArea);
            const formData = new FormData();
            formData.append("image", blob, "cropped_image.png");
            formData.append("directory", directory);

            const res = await axios.post("/api/images/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            const uploadedUrl: string = res.data.result;
            if (!uploadedUrl) throw new Error("No image URL returned from server");

            const finalUrl = uploadedUrl.startsWith("http") ? uploadedUrl : `${uploadedUrl}`;

            onSelect(finalUrl);
            setSelectedImage(null);
            setImages((prev) => [...prev, { url: finalUrl, selected: true }]);
        } catch (err) {
            console.error(err);
            alert("Failed to upload cropped image.");
        } finally {
            setIsCropping(false);
        }
    };


    const toggleSelect = (index: number) => {
        setImages((prev) => {
            return multiple
                ? prev.map((img, i) =>
                    i === index ? { ...img, selected: !img.selected } : img
                )
                : prev.map((img, i) => {
                    if (i === index) {
                        const isCurrentlySelected = img.selected;
                        return { ...img, selected: !isCurrentlySelected };
                    } else {
                        return { ...img, selected: false };
                    }
                });
        });
    };

    const confirmDeleteImage = (url: string) => {
        setImageToDelete(url);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteConfirmed = async () => {
        if (!imageToDelete) return;
        try {
            const res = await axios.delete("/api/images", { data: { path: imageToDelete } });
            if (res.data?.isSuccess) {
                setImages((prev) => prev.filter((img) => img.url !== imageToDelete));
                setIsDeleteModalOpen(false);
                setImageToDelete(null);
            } else {
                alert(res.data?.message || "Failed to delete image.");
            }
        } catch (err) {
            console.error(err);
            alert("Error deleting image.");
        }
    };

    const handleDone = () => {
        const selectedImgs = images.filter((img) => img.selected).map((img) => img.url);
        onSelect(multiple ? selectedImgs : selectedImgs[0] || "");
        setIsOpen(false);
        setSelectedImage(null);
        setImages([]);
    };

    const handleClose = () => {
        setIsOpen(false);
        setSelectedImage(null);
    };

    const openModal = () => {
        setIsOpen(true);
        fetchImages();
    };

    return (
        <div>
            <button
                type="button"
                onClick={openModal}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {buttonLabel}
            </button>

            <Modal isOpen={isOpen} onClose={handleClose} title="Select Image" width="max-w-4xl">
                {!selectedImage ? (
                    <div className="space-y-4">
                        <label className="btn btn-secondary mb-4 cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md inline-block">
                            Upload Image
                            <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                        </label>

                        {images.length > 0 && (
                            <div className="max-h-[290px] overflow-y-auto pr-2">
                                <div className="grid grid-cols-4 gap-4">
                                    {images.map((img, i) => (
                                        <div key={i} className="relative group cursor-pointer">
                                            <img
                                                src={`${uploadUrl}${img.url}`}
                                                className="w-full h-28 object-cover border rounded-md"
                                                onClick={() => toggleSelect(i)}
                                            />

                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    confirmDeleteImage(img.url);
                                                }}
                                                className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition"
                                                title="Delete image"
                                            >
                                                <Trash2 size={16} />
                                            </button>

                                            <input
                                                type="checkbox"
                                                checked={img.selected}
                                                onChange={() => toggleSelect(i)}
                                                className="absolute top-2 left-2 w-5 h-5 cursor-pointer accent-blue-600"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100"
                            >
                                Cancel
                            </button>
                            {images.some((img) => img.selected) && (
                                <button
                                    type="button"
                                    onClick={handleDone}
                                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md"
                                >
                                    Done
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="relative w-full h-96 bg-gray-100 rounded-md overflow-hidden">
                        <Cropper
                            image={selectedImage}
                            crop={crop}
                            zoom={zoom}
                            aspect={aspectRatio}
                            onCropChange={setCrop}
                            onZoomChange={setZoom}
                            onCropComplete={onCropComplete}
                        />
                        <div className="absolute bottom-5 left-5 flex gap-2">
                            <button
                                type="button"
                                onClick={() => setSelectedImage(null)}
                                className="px-4 py-2 border rounded bg-gray-200 hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleCropSave}
                                disabled={isCropping}
                                className={`px-4 py-2 rounded-md text-white ${isCropping ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"}`}
                            >
                                {isCropping ? "Cropping..." : "Crop"}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Delete Image"
                width="max-w-md"
            >
                <div className="text-center space-y-4">
                    <p className="text-gray-700">Are you sure you want to delete this image?</p>
                    <div className="flex justify-center gap-3">
                        <button
                            type="button"
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleDeleteConfirmed}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
