"use client";

import { useEffect, useMemo, useState } from "react";
import { yupResolver } from "@hookform/resolvers/yup/dist/yup.js";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import * as yup from "yup";
import JoditEditor from "jodit-react";
import { ApiResponse, Brand, Product } from "@/common/interface";
import { useLoader } from "@/context/LoaderContext";
import { useParams, useRouter } from "next/navigation";
import ImageCropperModal from "@/components/(frontend)/ImageCropperModal";
import { createProduct, updateProduct } from "../../../../../../../../utils/product";
import { fetchBrands } from "../../../../../../../../utils/brand";

const schema = yup.object({
    name: yup.string().required("Name is required").min(2).max(50),
    sku: yup.string().required("SKU is required").max(10, "Maximum length for SKU is 10 characters"),
    mrp: yup
        .number()
        .typeError("MRP must be a number")
        .required("MRP is required")
        .positive("MRP must be greater than 0")
        .max(9999999.99, "MRP exceeds limit"),
    bp: yup
        .number()
        .typeError("BP must be a number")
        .required("BP is required")
        .positive("BP must be greater than 0")
        .max(9999999.99, "BP exceeds limit"),
    sp: yup
        .number()
        .typeError("SP must be a number")
        .required("SP is required")
        .positive("SP must be greater than 0")
        .max(9999999.99, "SP exceeds limit"),
    stock: yup
        .number()
        .typeError("Stopck value must be a number")
        .required("Stock is required")
        .min(0, "Stock must be greater than or equal to 0")
        .max(100000, "Stock exceeds limit"),
    description: yup.string(),
    itemCode: yup.string().nullable(),
    categoryId: yup.string().required("Category is required"),
    brandId: yup.string().required("Brand is required"),
    status: yup.boolean().default(true),
    image_url: yup.string().required("Primary image is required"),
    detailJson: yup.array(
        yup.object({
            key: yup.string().required("Detail Key is required"),
            value: yup.string().required("Detail Value is required"),
        })
    ),
    featureJson: yup.array(
        yup.object({
            value: yup.string().required("Feature is required"),
        })
    ),
    imageJson: yup.array().of(yup.string()),
});

type FormData = yup.InferType<typeof schema>;

const uploadUrl = process.env.NEXT_PUBLIC_UPLOAD_BASE ?? "https://api.zelton.co.in";

function ProductForm() {
    const [preview, setPreview] = useState<string | null>(null);
    const [multiPreview, setMultiPreview] = useState<string[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const { showLoader, hideLoader } = useLoader();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [showToast, setShowToast] = useState(false);
    const [toastType, setToastType] = useState<"success" | "error" | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const router = useRouter()
    const params = useParams();
    const categoryId = params?.id as string;
    const config = useMemo(
        () => ({
            "uploader": {
                "insertImageAsBase64URI": true
            },
            showPlaceholder: false,
            readonly: false,
            buttons: "bold,italic,underline,strikethrough,ul,ol,font,fontsize,paragraph,hr,table,link,indent,outdent,left,undo,redo"
        }),
        []
    );

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        control,
        formState: { errors },
    } = useForm<any>({
        resolver: yupResolver(schema),
        defaultValues: {
            description: "",
            featureJson: [],
            imageJson: [],
            detailJson: [],
            categoryId: categoryId || "",
        },
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

    const { fields: featureFields, append: featureAppend, remove: featureRemove } = useFieldArray({
        control,
        name: "featureJson",
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "detailJson",
    });

    const onSubmit = async (data: FormData) => {
        const payload = {
            name: data.name,
            description: data.description,
            itemCode: data.itemCode,
            category_id: data.categoryId,
            brandId: data.brandId,
            status: data.status ?? true,
            detailList: data.detailJson || [],
            featureList: data.featureJson?.map(feature => feature.value) || [],
            image_url: data.image_url,
            imageList: data.imageJson || [],
            variants: [
                {
                    mrp: data.mrp,
                    stock: data.stock,
                    bp: data.bp,
                    sp: data.sp,
                    sku: data.sku,
                },
            ],
        };

        try {
            if (selectedProduct) {
                await updateProduct(selectedProduct.id, payload as any);
                setSuccessMessage("Product updated successfully!");

            } else {
                const res: ApiResponse<string> = await createProduct(payload as any);
                if (res.success) {
                    setSuccessMessage("Product created successfully!");

                } else {
                    setErrorMessage(res.message || "Failed to create product");
                }

            }
        } catch (err) {
            console.error(err);
            setErrorMessage(selectedProduct ? "Failed to update product" : "Failed to create producttttttttt");
        } finally {
            hideLoader();
        }
    };

    useEffect(() => {
        if (successMessage) {
            setToastType("success");
            setToastMessage(successMessage);
            setShowToast(true);
        } else if (errorMessage) {
            setToastType("error");
            setToastMessage(errorMessage);
            setShowToast(true);
        }
    }, [successMessage, errorMessage]);

    useEffect(() => {
        if (showToast) {
            const timer = setTimeout(() => {
                setShowToast(false);
                setSuccessMessage(null);
                setErrorMessage(null);
                setToastMessage(null);
                setToastType(null);
                router.back();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [showToast]);

    const disableScrollNumberInput = (e: React.WheelEvent<HTMLInputElement>) => {
        e.currentTarget.blur();
    };

    return (
        <div className="mt-8 w-full max-w-4xl mx-auto sm:p-4 md:p-8 p-2 bg-white/90 border border-gray-200 rounded-2xl shadow-lg relative">
            <h2 className="text-2xl font-bold text-black mb-6">Add Product</h2>

            {showToast && toastMessage && (
                <div className={`fixed top-6 right-6 z-[9999] px-6 py-4 rounded shadow-lg font-semibold transition-all
                    ${toastType === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                    {toastMessage}
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6">
                    {/* Name */}
                    <div>
                        <label className="block text-base font-semibold text-black mb-1">Name *</label>
                        <input
                            {...register("name")}
                            type="text"
                            placeholder="Enter product name"
                            className="w-full px-3 py-2 rounded-lg bg-white text-black border border-gray-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
                        />
                        <p className="text-sm text-red-500">{errors.name?.message as any}</p>
                    </div>
                    {/* SKU */}
                    <div>
                        <label className="block text-base font-semibold text-black mb-1">SKU *</label>
                        <input
                            {...register("sku")}
                            type="text"
                            placeholder="Enter SKU"
                            className="w-full px-3 py-2 rounded-lg bg-white text-black border border-gray-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
                        />
                        <p className="text-sm text-red-500">{errors.sku?.message as any}</p>
                    </div>

                    {/* MRP */}
                    <div>
                        <label className="block text-base font-semibold text-black mb-1">MRP *</label>
                        <input
                            {...register("mrp")}
                            type="number"
                            onWheel={disableScrollNumberInput}
                            step="0.01"
                            placeholder="Enter MRP"
                            className="w-full px-3 py-2 rounded-lg bg-white text-black border border-gray-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
                        />
                        <p className="text-sm text-red-500">{errors.mrp?.message as any}</p>
                    </div>
                    {/* BP */}
                    <div>
                        <label className="block text-base font-semibold text-black mb-1">BP *</label>
                        <input
                            {...register("bp")}
                            type="number"
                            onWheel={disableScrollNumberInput}
                            step="0.01"
                            placeholder="Enter Base Price"
                            className="w-full px-3 py-2 rounded-lg bg-white text-black border border-gray-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
                        />
                        <p className="text-sm text-red-500">{errors.bp?.message as any}</p>
                    </div>
                    {/* SP */}
                    <div>
                        <label className="block text-base font-semibold text-black mb-1">Selling Price *</label>
                        <input
                            {...register("sp")}
                            type="number"
                            step="0.01"
                            onWheel={disableScrollNumberInput}
                            placeholder="Enter Selling Price"
                            className="w-full px-3 py-2 rounded-lg bg-white text-black border border-gray-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
                        />
                        <p className="text-sm text-red-500">{errors.sp?.message as any}</p>
                    </div>
                    {/* Stock */}
                    <div>
                        <label className="block text-base font-semibold text-black mb-1">Stock*</label>
                        <input
                            {...register("stock")}
                            type="number"
                            step="0.01"
                            onWheel={disableScrollNumberInput}
                            placeholder="Enter Stock"
                            className="w-full px-3 py-2 rounded-lg bg-white text-black border border-gray-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
                        />
                        <p className="text-sm text-red-500">{errors.stock?.message as any}</p>
                    </div>
                    {/* Item Code */}
                    <div>
                        <label className="block text-base font-semibold text-black mb-1">Item Code</label>
                        <input
                            {...register("itemCode")}
                            type="text"
                            placeholder="Enter item code"
                            className="w-full px-3 py-2 rounded-lg bg-white text-black border border-gray-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
                        />
                        <p className="text-sm text-red-500">{errors.itemCode?.message as any}</p>
                    </div>
                    {/* Brand */}
                    <div>
                        <label className="block text-base font-semibold text-black mb-1">Brand</label>
                        <select
                            {...register("brandId")}
                            className="w-full px-3 py-2 rounded-lg bg-white text-black border border-gray-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
                        >
                            <option value="">-- Select Brand --</option>
                            {brands.map((brand) => (
                                <option key={brand.id} value={brand.id}>
                                    {brand.name}
                                </option>
                            ))}
                        </select>
                        <p className="text-sm text-red-500">{errors.brandId?.message as any}</p>
                    </div>
                    {/* Description */}
                    <div className="w-full sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Description<span className="text-red-600">*</span>
                        </label>
                        <Controller
                            name="description"
                            control={control}
                            defaultValue=""
                            render={({ field: { onChange, value } }) => (
                                <JoditEditor
                                    value={value}
                                    config={config}
                                    onBlur={(newContent) => onChange(newContent)}
                                />
                            )}
                        />
                        <p className="text-sm text-red-500">{errors.description?.message as any}</p>
                    </div>
                    {/* Primary Image with Cropper */}
                    <div>
                        <label className="block text-base font-semibold text-black mb-1">Primary Image *</label>
                        <ImageCropperModal
                            onSelect={(img: any) => {
                                setValue("image_url", img);
                                setPreview(img);
                            }}
                            buttonLabel="Select Primary Image"
                        />
                        {preview && (
                            <img src={`${uploadUrl}${preview}`} alt="Primary" className="mt-2 h-24 w-24 rounded object-cover border" />
                        )}
                        <p className="text-sm text-red-500">{errors.image_url?.message as any}</p>
                    </div>
                    {/* Multiple Images with Cropper */}
                    <div>
                        <label className="block text-base font-semibold text-black mb-1">Additional Images</label>
                        <ImageCropperModal
                            multiple
                            onSelect={(imgs: any) => {
                                const normalized = Array.isArray(imgs) ? imgs : imgs ? [imgs] : [];
                                setValue("imageJson", normalized);
                                setMultiPreview(normalized);
                            }}
                            buttonLabel="Select Additional Images"
                        />

                        <div className="flex gap-2 mt-2 flex-nowrap overflow-x-auto">
                            {Array.isArray(multiPreview) &&
                                multiPreview.map((src, i) => (
                                    <img
                                        key={i}
                                        src={`${uploadUrl}${src}`}
                                        alt={`Preview ${i}`}
                                        className="h-20 w-20 rounded object-cover border"
                                    />
                                ))}
                        </div>
                    </div>
                </div>
                {/* Product Details */}
                <div>
                    <label className="block text-base font-semibold text-black mb-2">Product Detail</label>
                    <div className="flex flex-col gap-3">
                        {fields.map((field, index) => (
                            <div
                                key={field.id}
                                className="flex flex-col sm:flex-row gap-2 p-3 rounded-xl border border-gray-200 shadow-sm bg-white sm:bg-transparent sm:border-none sm:shadow-none items-start"
                            >
                                <span className="flex-1 w-full">
                                    <input
                                        {...register(`detailJson.${index}.key` as const)}
                                        placeholder="Key"
                                        className="w-full px-3 py-2 rounded bg-white text-black border border-gray-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
                                    />
                                    <p className="text-sm text-red-500 mt-1">{(errors.detailJson as any)?.[index]?.key?.message}</p>
                                </span>

                                <span className="flex-1 w-full">
                                    <input
                                        {...register(`detailJson.${index}.value` as const)}
                                        placeholder="Value"
                                        className="w-full px-3 py-2 rounded bg-white text-black border border-gray-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition mt-2 sm:mt-0"
                                    />
                                    <p className="text-sm text-red-500 mt-1">{(errors.detailJson as any)?.[index]?.value?.message}</p>
                                </span>

                                <div className="w-full sm:w-auto flex-shrink-0 mt-2 sm:mt-0">
                                    <button
                                        type="button"
                                        onClick={() => remove(index)}
                                        className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition w-full sm:w-auto"
                                    >
                                        X
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={() => append({ key: "", value: "" })}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition w-full sm:w-auto mt-2"
                    >
                        + Add detail
                    </button>
                </div>

                {/* Product Features */}
                <div>
                    <label className="block text-base font-semibold text-black mb-2">
                        Product Features
                    </label>

                    <div className="flex flex-col gap-3">
                        {featureFields.map((field, index) => (
                            <div
                                key={field.id}
                                className="flex flex-col sm:flex-row gap-2 mb-2 p-3 rounded-xl border border-gray-200 shadow-sm bg-white sm:bg-transparent sm:border-none sm:shadow-none items-start"
                            >
                                <span className="flex-1 w-full">
                                    <input
                                        {...register(`featureJson.${index}.value` as const)}
                                        placeholder={`Feature ${index + 1}`}
                                        className="w-full px-3 py-2 rounded bg-white text-black border border-gray-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
                                    />
                                    {/* ✅ Error message */}
                                    <p className="text-sm text-red-500 mt-1">
                                        {Array.isArray(errors.featureJson) && errors.featureJson[index]?.value?.message}
                                    </p>
                                </span>

                                <div className="w-full sm:w-auto flex-shrink-0 mt-2 sm:mt-0">
                                    <button
                                        type="button"
                                        onClick={() => featureRemove(index)}
                                        className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition w-full sm:w-auto"
                                    >
                                        X
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={() => featureAppend({ value: "" })}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition w-full sm:w-auto mt-2"
                    >
                        + Add Feature
                    </button>
                </div>


                {/* Status */}
                <div>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <span className="text-sm font-medium">Status</span>
                        <div
                            className={`flex items-center h-6 w-12 rounded-full border transition-all ${watch("status") ? "bg-green-600" : "bg-zinc-400"
                                }`}>
                            <input type="checkbox" {...register("status")} hidden />
                            <div
                                className={`h-5 w-5 rounded-full bg-white shadow-md transition-all ${watch("status") ? "translate-x-6" : "translate-x-0"
                                    }`}
                            ></div>
                        </div>
                    </label>
                </div>
                {/* Submit - full width */}
                <button
                    type="submit"
                    className="w-full py-3 rounded-full bg-orange-500 text-white font-semibold text-lg hover:bg-orange-600 transition"
                >
                    Save Product
                </button>
            </form>
        </div>
    );
}

export default ProductForm;

