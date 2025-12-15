"use client";

import { useEffect, useMemo, useState } from "react";
import { yupResolver } from "@hookform/resolvers/yup/dist/yup.js";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import * as yup from "yup";
import JoditEditor from "jodit-react";
import {
    ApiResponse,
    Brand,
    Category,
    CategoryAttribute,
    Product
} from "@/common/interface";
import { useLoader } from "@/context/LoaderContext";
import { useParams, useRouter } from "next/navigation";
import { FaTimes } from "react-icons/fa";
import { getCategoryByIdForProduct } from "../../../../../../../../utils/category";
import { fetchBrands } from "../../../../../../../../utils/brand";
import { createProduct, updateProduct } from "../../../../../../../../utils/product";
import ImageCropperModal from "@/components/(frontend)/ImageCropperModal";
import VariantOption from "@/components/(sheared)/Option";
import { X } from "lucide-react";

const option = yup.object({
    hasAttributeImages1: yup.boolean(),
    hasAttributeImages2: yup.boolean(),
    title: yup.string(),
    attributeValue: yup.string().required("Option value is required"),
    sku: yup.string().required("SKU is required").max(10, "Maximum length for SKU is 10 characters"),
    mrp: yup.number().typeError("MRP must be a number").required("MRP is required").positive("MRP must be greater than 0").max(9999999.99, "MRP exceeds limit"),
    bp: yup.number().typeError("BP must be a number").required("BP is required").positive("BP must be greater than 0").max(9999999.99, "BP exceeds limit"),
    sp: yup.number().typeError("SP must be a number").required("SP is required").positive("SP must be greater than 0").max(9999999.99, "SP exceeds limit"),
    stock: yup.number().typeError("Stopck value must be a number").required("Stock is required").min(0, "Stock must be greater than or equal to 0").max(100000, "Stock exceeds limit"),
    status: yup.boolean().default(true),
    image_url: yup.string().when(['hasAttributeImages1', 'hasAttributeImages2'], {
        is: (hasAttributeImages1: boolean, hasAttributeImages2: boolean) => hasAttributeImages1 && hasAttributeImages2,
        then: (schema) => schema.required("Primary image is required"),
        otherwise: (schema) => schema.notRequired(),
    }),
    imageJson: yup.array().of(yup.string()),
});

const variant = yup.object({
    hasAttributeImages1: yup.boolean(),
    hasAttributeImages2: yup.boolean(),
    title: yup.string(),
    attributeValue: yup.string().required("Variant value is required"),
    image_url: yup.string().when(['hasAttributeImages1', 'hasAttributeImages2'], {
        is: (hasAttributeImages1: boolean, hasAttributeImages2: boolean) => hasAttributeImages1 && !hasAttributeImages2,
        then: (schema) => schema.required("Primary image is required"),
        otherwise: (schema) => schema.notRequired(),
    }),
    imageJson: yup.array().of(yup.string()),
    options: yup.array().of(option).min(1, "At least one option is required"),
});

const schema = yup.object({
    attributeOneHasImages: yup.boolean(),
    attributeTwoHasImages: yup.boolean(),
    name: yup.string().required("Name is required").min(2).max(50),
    categoryId: yup.string().required("Category is required"),
    itemCode: yup.string().nullable(),
    brandId: yup.string().required("Brand is required"),
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
    description: yup.string(),
    image_url: yup.string().when(['attributeOneHasImages', 'attributeTwoHasImages'], {
        is: (attributeOneHasImages: boolean, attributeTwoHasImages: boolean) => !attributeOneHasImages && !attributeTwoHasImages,
        then: (schema) => schema.required("Primary image is required"),
        otherwise: (schema) => schema.notRequired(),
    }),
    imageJson: yup.array().of(yup.string()),
    variants: yup.array().of(variant).min(1, "At least one variant is required"),
    status: yup.boolean().default(true),
});

export type FormData1 = yup.InferType<typeof schema>;

const uploadUrl = process.env.NEXT_PUBLIC_UPLOAD_BASE ?? "https://api.zelton.co.in";

function VariantProductForm() {
    const [preview, setPreview] = useState<string | null>(null);
    const [multiPreview, setMultiPreview] = useState<string[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [attributes, setAttributes] = useState<CategoryAttribute[]>([]);
    const [variantOneHasImages, setVariantOneHasImages] = useState<boolean>(false);
    const [variantTwoHasImages, setVariantTwoHasImages] = useState<boolean>(false);

    const [category, setCategory] = useState<Category | null>(null);
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
        control,
        formState: { errors },
        watch
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
        fetchCategory();
    }, []);

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
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [showToast]);

    const fetchCategory = async () => {
        showLoader();
        try {
            const data = await getCategoryByIdForProduct(categoryId?.toString()!);

            if (!data?.result) {
                setErrorMessage("Category data not found.");
                return;
            }

            setCategory(data.result);

            const normalizedAttributes = data.result.attributes?.map((attr: any) => ({
                id: attr.id,
                name: attr.name,
                description: attr.description,
                hasImages: attr.pivot?.has_images ?? false,
                isPrimary: attr.pivot?.is_primary ?? false,
                values: attr.values || [],
            })) || [];

            const sortedAttributes = normalizedAttributes.sort((a: any, b: any) => {
                if (a.isPrimary && !b.isPrimary) return -1;
                if (!a.isPrimary && b.isPrimary) return 1;
                return 0;
            });

            setAttributes(sortedAttributes);

            if (sortedAttributes.length === 2) {
                const firstAttr = sortedAttributes[0];
                const secondAttr = sortedAttributes[1];

                setVariantOneHasImages(firstAttr.hasImages);
                setVariantTwoHasImages(secondAttr.hasImages);

                setValue("attributeOneHasImages", firstAttr.hasImages);
                setValue("attributeTwoHasImages", secondAttr.hasImages);
            }

        } catch (err) {
            console.error("Error fetching category:", err);
            setErrorMessage("Failed to load category attributes.");
        } finally {
            hideLoader();
        }
    };

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

    const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({
        control,
        name: "variants",
    });

    const onSubmit = async (data: FormData1) => {
        showLoader();
        setErrorMessage(null);
        setSuccessMessage(null);

        try {
            const formattedVariants = (data.variants ?? []).flatMap((variant, variantIndex) =>
                (variant.options ?? []).map((option, optionIndex) => {
                    const {
                        title,
                        hasAttributeImages1,
                        hasAttributeImages2,
                        attributeValue,
                        image_url,
                        imageJson,
                        ...restOfOption
                    } = option;

                    return {
                        ...restOfOption,
                        title: `${variant.title} ${option.title}`,
                        status: true,
                        attributeValues: [variant.attributeValue, attributeValue].filter(Boolean),
                        image_url: getImageUrl(data, variantIndex, optionIndex),
                        image_json: JSON.stringify(getImageList(data, variantIndex, optionIndex)), // ✅ convert array to string
                    };
                })
            );
            const payload = {
                name: data.name,
                description: data.description,
                itemCode: data.itemCode,
                category_id: data.categoryId,
                brandId: data.brandId,
                status: true,
                detailList: data.detailJson || [],
                featureList: data.featureJson?.map((feature) => feature.value) || [],
                image_url: data.image_url ?? null,
                imageList: data.imageJson || [],
                variants: formattedVariants,
            }
            let res: ApiResponse<string>;

            if (selectedProduct) {
                res = await updateProduct(selectedProduct.id, payload as any);
                if (res.success) {
                    setSuccessMessage("Product updated successfully!");
                } else {
                    setErrorMessage(res.message || "Failed to update product");
                }
            } else {
                res = await createProduct(payload as any);
                if (res.success) {
                    setSuccessMessage("Product created successfully!");
                    setTimeout(() => router.back(), 4000);
                } else {
                    setErrorMessage(res.message || "Failed to create product");
                }
            }
        } catch (err) {
            console.error("Submit error:", err);
            setErrorMessage(selectedProduct ? "Failed to update product" : "Failed to create product");
        } finally {
            hideLoader();
        }
    };

    const getImageUrl = (data: FormData1, variantIndex: number, optionIndex: number) => {
        const variant = data.variants![variantIndex];
        const option = variant.options![optionIndex];
        if (variant.hasAttributeImages1 && variant.hasAttributeImages2) {
            return option.image_url || variant.image_url || "";
        }
        if (variant.hasAttributeImages1 && !variant.hasAttributeImages2) {
            return variant.image_url || "";
        }
        if (!variant.hasAttributeImages1 && variant.hasAttributeImages2) {
            return option.image_url || "";
        }
        return "";
    };

    const getImageList = (data: FormData1, variantIndex: number, optionIndex: number) => {
        const variant = data.variants![variantIndex];
        const option = variant.options![optionIndex];
        if (variant.hasAttributeImages1 && variant.hasAttributeImages2) {
            return option.imageJson?.length ? option.imageJson : variant.imageJson || [];
        }
        if (variant.hasAttributeImages1 && !variant.hasAttributeImages2) {
            return variant.imageJson || [];
        }
        if (!variant.hasAttributeImages1 && variant.hasAttributeImages2) {
            return option.imageJson || [];
        }
        return [];
    };

    return (
        <div className="w-full mx-auto bg-white/90 relative">
            {/* header */}
            <div className="max-w-[80rem] mx-auto top-0 z-50 px-4 pt-4">
                <div className="p-5 bg-white/80 backdrop-blur border border-gray-200 rounded-2xl shadow-lg mb-5">

                    <div className="flex items-center justify-between">
                        {/* Title */}
                        <h2 className="lg:text-3xl text-xl font-bold px-5 text-gray-900 tracking-tight">
                            Fill Product Details
                        </h2>
                    </div>

                </div>
            </div>

            {showToast && toastMessage && (
                <div className={`fixed top-6 right-6 z-[9999] px-6 py-4 rounded shadow-lg font-semibold transition-all
                    ${toastType === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                    {toastMessage}
                </div>
            )}

            <form
                id="product-form"
                onSubmit={handleSubmit(onSubmit)}
                className="max-w-[80rem] mx-auto px-4 pb-4"
            >
                <div className="flex flex-col gap-8">
                    <div className="border border-gray-300 rounded-xl p-6 bg-white flex flex-col gap-6 shadow-sm">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-base font-semibold text-black mb-1">Name<span className="text-red-600">*</span></label>
                                <input
                                    {...register("name")}
                                    type="text"
                                    placeholder="Enter product name"
                                    className="w-full px-3 py-2 rounded-lg bg-white text-black border border-gray-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
                                />
                                <p className="text-sm text-red-500">{errors.name?.message as string}</p>
                            </div>
                            <div>
                                <label className="block text-base font-semibold text-black mb-1">Brand<span className="text-red-600">*</span></label>
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
                                <p className="text-sm text-red-500">{errors.brandId?.message as string}</p>
                            </div>
                            <div>
                                <label className="block text-base font-semibold text-black mb-1">Item Code</label>
                                <input
                                    {...register("itemCode")}
                                    type="text"
                                    placeholder="Enter item code"
                                    className="w-full px-3 py-2 rounded-lg bg-white text-black border border-gray-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
                                />
                            </div>

                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Description
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
                            <p className="text-sm text-red-500">{errors.description?.message as string}</p>
                        </div>
                        {/* Product Details */}
                        <div>
                            <label className="block text-base font-semibold text-black mb-2">Product Detail</label>
                            <div className="flex flex-col gap-3">
                                {fields.map((field, index) => (
                                    <div
                                        key={field.id}
                                        className="flex flex-col sm:flex-row gap-2 rounded-xl bg-white items-start"
                                    >
                                        <span className="flex-1 w-full">
                                            <input
                                                {...register(`detailJson.${index}.key` as const)}
                                                placeholder="Key"
                                                className="w-full px-3 py-2 rounded bg-white text-black border border-gray-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
                                            />
                                            <p className="text-sm text-red-500 mt-1">
                                                {Array.isArray(errors.detailJson) && errors.detailJson[index]?.key?.message}
                                            </p>
                                        </span>
                                        <span className="flex-1 w-full">
                                            <input
                                                {...register(`detailJson.${index}.value` as const)}
                                                placeholder="Value"
                                                className="w-full px-3 py-2 rounded bg-white text-black border border-gray-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition mt-2 sm:mt-0"
                                            />
                                            <p className="text-sm text-red-500 mt-1">
                                                {Array.isArray(errors.detailJson) ? errors.detailJson[index]?.value?.message : undefined}
                                            </p>
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
                                className="
                                flex items-center gap-2 px-4 py-2 mt-2
                                bg-gradient-to-r from-orange-400 to-yellow-400
                                hover:from-orange-500 hover:to-yellow-500
                                rounded-xl shadow-md text-white font-semibold
                                hover:shadow-lg transition-all duration-200
                            "                            >
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
                                        className="flex flex-col sm:flex-row gap-2 rounded-xl bg-white items-start"
                                    >
                                        <span className="flex-1 w-full">
                                            <input
                                                {...register(`featureJson.${index}.value` as const)}
                                                placeholder={`Feature ${index + 1}`}
                                                className="w-full px-3 py-2 rounded bg-white text-black border border-gray-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
                                            />
                                            {/* ✅ Error message */}
                                            <p className="text-sm text-red-500 mt-1">
                                                {Array.isArray(errors.featureJson) ? errors.featureJson[index]?.value?.message : undefined}
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
                                className="
                                flex items-center gap-2 px-4 py-2 mt-2
                                bg-gradient-to-r from-orange-400 to-yellow-400
                                hover:from-orange-500 hover:to-yellow-500
                                rounded-xl shadow-md text-white font-semibold
                                hover:shadow-lg transition-all duration-200
                            "                               >
                                + Add Feature
                            </button>
                        </div>
                        {!variantOneHasImages && !variantTwoHasImages && (
                            <>
                                {/* Product Images */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                                    {/* ================= LEFT: Primary Image ================= */}
                                    <div className="border border-gray-200 rounded-xl p-5 bg-gray-50/50">
                                        <label className="block text-lg font-semibold text-black mb-4">
                                            Primary Image<span className="text-red-600">*</span>
                                        </label>

                                        <ImageCropperModal
                                            className="flex items-center gap-2 px-4 py-2 mt-2
                                                     bg-gradient-to-r from-orange-400 to-yellow-400
                                                     hover:from-orange-500 hover:to-yellow-500
                                                     rounded-xl shadow-md text-white font-semibold
                                                     hover:shadow-lg transition-all duration-200"
                                            onSelect={(img: any) => {
                                                setValue("image_url", img);
                                                setPreview(img);
                                            }}
                                            buttonLabel="Select Primary Image"
                                        />

                                        {preview && (
                                            <img
                                                src={`${uploadUrl}${preview}`}
                                                alt="Primary"
                                                className="mt-4 h-28 w-28 rounded-xl object-cover border shadow-sm"
                                            />
                                        )}

                                        <p className="text-sm text-red-500 mt-1">
                                            {errors.image_url?.message as any}
                                        </p>
                                    </div>

                                    {/* ================= RIGHT: Additional Images ================= */}
                                    <div className="border border-gray-200 rounded-xl p-5 bg-gray-50/50">
                                        <label className="block text-lg font-semibold text-black mb-4">
                                            Additional Images
                                        </label>

                                        <ImageCropperModal
                                            multiple
                                            className="flex items-center gap-2 px-4 py-2 mt-2
                                                     bg-gradient-to-r from-orange-400 to-yellow-400
                                                     hover:from-orange-500 hover:to-yellow-500
                                                     rounded-xl shadow-md text-white font-semibold
                                                     hover:shadow-lg transition-all duration-200"
                                            onSelect={(imgs: any) => {
                                                const normalized = Array.isArray(imgs) ? imgs : imgs ? [imgs] : [];
                                                setValue("imageJson", normalized);
                                                setMultiPreview(normalized);
                                            }}
                                            buttonLabel="Select Additional Images"
                                        />

                                        <div className="flex gap-3 mt-4 overflow-x-auto">
                                            {Array.isArray(multiPreview) &&
                                                multiPreview.map((src, i) => (
                                                    <img
                                                        key={i}
                                                        src={`${uploadUrl}${src}`}
                                                        alt={`Preview ${i}`}
                                                        className="h-20 w-20 rounded-xl object-cover border shadow-sm"
                                                    />
                                                ))}
                                        </div>
                                    </div>

                                </div>
                            </>
                        )}
                        {/* Status Toggle */}
                        <label className="flex items-center gap-3 cursor-pointer">
                            <span className="block text-base font-semibold text-black mb-2">
                                Status</span>
                            <div
                                className={`flex items-center h-6 w-12 rounded-full transition-all duration-300 ${watch("status") ? "bg-amber-500" : "bg-zinc-600"
                                    }`}
                            >
                                <input type="checkbox" {...register("status")} defaultChecked hidden />
                                <div
                                    className={`h-6 w-6 rounded-full bg-white shadow-md transform transition-all duration-300 ${watch("status") ? "translate-x-6" : "translate-x-0"
                                        }`}
                                ></div>
                            </div>
                        </label>
                    </div>
                    <div className="border border-gray-300 rounded-xl p-6 bg-white shadow-sm">
                        <div className="p-3 bg-white/70 backdrop-blur border border-gray-200 rounded-2xl shadow-lg mb-5">
                            <div className="flex items-center justify-between">
                                {/* Title */}
                                <h2 className="lg:text-3xl text-xl font-bold px-5 text-gray-900 tracking-tight">
                                    Product Variant Details
                                </h2>

                                {/* Buttons */}
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            appendVariant({
                                                title: "",
                                                attributeValue: "",
                                                image_url: "",
                                                imageJson: [],
                                                options: [],
                                                hasAttributeImages1: variantOneHasImages,
                                                hasAttributeImages2: variantTwoHasImages
                                            })
                                        }
                                        className="
                                flex items-center gap-2 px-4 py-2
                                bg-gradient-to-r from-orange-400 to-yellow-400
                                hover:from-orange-500 hover:to-yellow-500
                                rounded-xl shadow-md text-white font-semibold
                                hover:shadow-lg transition-all duration-200">
                                        + Add Variant
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {variantFields.map((variant, variantIndex) => {
                                const variantImageUrl = watch(`variants.${variantIndex}.image_url`);
                                const rawImageJson = watch(`variants.${variantIndex}.imageJson`);
                                let variantImageJson: string[] = [];
                                if (Array.isArray(rawImageJson)) {
                                    variantImageJson = rawImageJson;
                                } else if (typeof rawImageJson === "string" && rawImageJson.trim() !== "") {
                                    try {
                                        const parsed = JSON.parse(rawImageJson);
                                        variantImageJson = Array.isArray(parsed) ? parsed : [parsed];
                                    } catch {
                                        variantImageJson = [rawImageJson];
                                    }
                                }

                                return (
                                    <div
                                        key={variant.id}
                                        className="mb-6 p-4 border border-gray-200 rounded-xl bg-gray-50 shadow-sm flex flex-col gap-2 relative"
                                    >

                                        <button
                                            type="button"
                                            onClick={() => removeVariant(variantIndex)}
                                            title="Remove Variant"
                                            className="absolute top-[-6] right-[-8]
                                                                                        flex items-center justify-center
                                                                                        h-9 w-9
                                                                                        rounded-xl
                                                                                        bg-red-50
                                                                                        text-red-600
                                                                                        border border-red-200
                                                                                        hover:bg-red-500 hover:text-white 
                                                                                        hover:border-red-500
                                                                                        shadow-sm hover:shadow-md
                                                                                        transition-all duration-200
                                                                                    "
                                        >
                                            <X size={20} className="text-red-600 font-bold hover:text-white"></X>
                                        </button>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-start">

                                            {/* Variant Name */}
                                            <div className="space-y-1.5">
                                                <label className="flex items-center gap-1 text-sm font-semibold text-gray-800">
                                                    Name
                                                    <span className="text-xs text-gray-400">(Optional)</span>
                                                </label>

                                                <input
                                                    {...register(`variants.${variantIndex}.title` as const)}
                                                    type="text"
                                                    placeholder="Enter product name"
                                                    className="
                w-full
                rounded-xl
                border border-gray-300
                bg-white
                px-3 py-3
                text-sm text-gray-900
                placeholder:text-gray-400
                focus:border-orange-500
                focus:ring-2 focus:ring-orange-100
                transition-all duration-200
            "
                                                />

                                                {(errors.variants as any)?.[variantIndex]?.title && (
                                                    <p className="text-xs text-red-500">
                                                        {(errors.variants as any)[variantIndex]?.title?.message}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Attribute Value */}
                                            <div className="space-y-1.5">
                                                <label className="flex items-center gap-1 text-sm font-semibold text-gray-800">
                                                    {attributes.length > 0 ? attributes[0].name : "Attribute Value"}
                                                    <span className="text-red-500">*</span>
                                                </label>

                                                <select
                                                    {...register(`variants.${variantIndex}.attributeValue` as const)}
                                                    className="
                w-full
                rounded-xl
                border border-gray-300
                bg-white
                px-3 py-3
                text-sm text-gray-900
                focus:border-orange-500
                focus:ring-2 focus:ring-orange-100
                transition-all duration-200
            "
                                                >
                                                    <option value="">Select value</option>
                                                    {attributes[0]?.values?.map((value) => (
                                                        <option key={value.id} value={value.id}>
                                                            {value.value}
                                                        </option>
                                                    ))}
                                                </select>

                                                {(errors.variants as any)?.[variantIndex]?.attributeValue && (
                                                    <p className="text-xs text-red-500">
                                                        {(errors.variants as any)[variantIndex]?.attributeValue?.message}
                                                    </p>
                                                )}
                                            </div>

                                        </div>

                                        {variantOneHasImages && !variantTwoHasImages && (
                                            <>
                                                <div>
                                                    <label className="block text-base font-semibold text-black mb-1">Primary Image<span className="text-red-600">*</span></label>
                                                    <ImageCropperModal
                                                        onSelect={(img: any) => {
                                                            setValue(`variants.${variantIndex}.image_url`, img);
                                                        }}
                                                        buttonLabel="Select Primary Image"
                                                    />
                                                    {variantImageUrl && (
                                                        <img
                                                            src={`${uploadUrl}${variantImageUrl}`}
                                                            alt="Primary"
                                                            className="mt-2 h-24 w-24 rounded object-cover border"
                                                        />
                                                    )}
                                                    <p className="text-sm text-red-500">{(errors.variants as any)?.[variantIndex]?.image_url?.message}</p>
                                                </div>
                                                <div>
                                                    <label className="block text-base font-semibold text-black mb-1">Additional Images</label>
                                                    <ImageCropperModal
                                                        multiple
                                                        onSelect={(imgs: any) => {
                                                            setValue(`variants.${variantIndex}.imageJson`, imgs);
                                                        }}
                                                        buttonLabel="Select Additional Images"
                                                    />
                                                    <div className="flex gap-2 mt-2 flex-nowrap overflow-x-auto">
                                                        {variantImageJson
                                                            .filter((src: string): src is string => typeof src === "string" && !!src)
                                                            .map((src: string, i: number) => (
                                                                <img
                                                                    key={i}
                                                                    src={`${uploadUrl}${src}`}
                                                                    alt={`Preview ${i}`}
                                                                    className="h-20 w-20 rounded object-cover border"
                                                                />
                                                            ))}
                                                    </div>

                                                </div>
                                            </>
                                        )}
                                        <div className="flex flex-col gap-2 w-full">
                                            <div className="
                                                mb-6
                                                rounded-2xl
                                                border border-gray-200
                                                bg-gradient-to-r from-white via-white/90 to-gray-50
                                                shadow-sm
                                            ">
                                                <div className="flex items-center justify-between px-6 py-4">

                                                    {/* Left: Title */}
                                                    <div className="flex items-center gap-4">
                                                        {/* Accent */}
                                                        <span className="h-8 w-1.5 rounded-full bg-orange-500"></span>

                                                        <div>
                                                            <h2 className="text-xl font-semibold text-gray-900 tracking-tight">
                                                                Product Variant Options
                                                            </h2>
                                                            <p className="text-sm text-gray-500">
                                                                Configure variant-specific pricing, images & details
                                                            </p>
                                                        </div>
                                                    </div>

                                                </div>
                                            </div>

                                            <div>
                                                <VariantOption
                                                    itemIndex={variantIndex}
                                                    control={control}
                                                    register={register}
                                                    setValue={setValue}
                                                    watch={watch}
                                                    errors={errors}
                                                    attributeOneHasImages={variantOneHasImages}
                                                    attributeTwoHasImages={variantTwoHasImages}
                                                    attribute={attributes[1]}
                                                />
                                            </div>
                                        </div>
                                        <p className="text-sm text-red-500">
                                            {(errors.variants as any)?.[variantIndex]?.options?.message}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                        <p className="text-sm text-red-500">
                            {errors.variants?.message as string}
                        </p>
                    </div>
                </div>

                {/* Button */}
                <div className="border border-gray-300 rounded-xl mt-6 shadow-[0_-6px_20px_rgba(0,0,0,0.08)] ">
                    <div className="max-w-[90rem] mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">

                        {/* Message */}
                        <p className="text-sm text-gray-600 font-medium">
                            ⚠️ Please check all product details before submitting.
                        </p>

                        {/* Save Button */}
                        <button
                            form="product-form"
                            type="submit"
                            className="
                                flex items-center gap-2 px-6 py-3
                                bg-gradient-to-r from-orange-400 to-yellow-400
                                hover:from-orange-500 hover:to-yellow-500
                                rounded-xl shadow-md text-white font-semibold
                                hover:shadow-lg transition-all duration-200
                            "
                        >
                            Save Product
                        </button>

                    </div>
                </div>
            </form>
        </div>
    );
}

export default VariantProductForm;

