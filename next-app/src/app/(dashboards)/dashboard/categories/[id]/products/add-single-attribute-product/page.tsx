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
import { X } from "lucide-react";

const variant = yup.object({
    has_images: yup.boolean(),
    title: yup.string().required('title is required'),
    attributeValue: yup.string().required("Attribute Value 1 is required"),
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
    status: yup.boolean().default(true),
    imageUrl: yup.string().when('has_images', {
        is: (has_images: boolean) => has_images,
        then: (schema) => schema.required("Primary image is required"),
        otherwise: (schema) => schema.notRequired(),
    }),
    imageJson: yup.array().of(yup.string()),
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

type FormData = yup.InferType<typeof schema>;

const uploadUrl = process.env.NEXT_PUBLIC_UPLOAD_BASE ?? "https://api.zelton.co.in";

function VariantProductForm() {
    const [preview, setPreview] = useState<string | null>(null);
    const [multiPreview, setMultiPreview] = useState<string[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [attributes, setAttributes] = useState<CategoryAttribute[]>([]);
    const [variantHasImages, setVariantHasImages] = useState<boolean>(false);
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

    const fetchCategory = async () => {
        showLoader();
        try {
            const data = await getCategoryByIdForProduct(categoryId!);
            const categoryData = data.result;

            setCategory(categoryData);
            setAttributes(categoryData.attributes || []);
            const attributeHasImages = categoryData.attributes?.some(
                (attr: any) => attr.pivot?.has_images === true
            ) || false;

            setVariantHasImages(attributeHasImages);

            if (categoryData.attributes.length === 1) {
                const firstAttr = categoryData.attributes[0];
                setValue("attributeOneHasImages", firstAttr.pivot?.has_images === true);
            } else if (categoryData.attributes.length === 2) {
                const [firstAttr, secondAttr] = categoryData.attributes;
                setValue("attributeOneHasImages", firstAttr.pivot?.has_images === true);
                setValue("attributeTwoHasImages", secondAttr.pivot?.has_images === true);
            }
        } catch (err) {
            console.error(err);
            setErrorMessage("Failed to load category attributes");
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

    const onSubmit = async (data: FormData) => {
        const formattedVariants = (data.variants ?? []).map(v => ({
            title: v.title,
            sku: v.sku,
            mrp: v.mrp,
            sp: v.sp,
            bp: v.bp,
            stock: v.stock,
            status: v.status,
            has_images: v.has_images,
            image_url: v.imageUrl ?? null,
            image_json: v.imageJson?.length ? JSON.stringify(v.imageJson) : null,
            attributeValues: v.attributeValue ? [v.attributeValue] : [],
        }));

        const payload = {
            name: data.name,
            description: data.description,
            itemCode: data.itemCode,
            category_id: data.categoryId,
            brandId: data.brandId,
            status: true,
            detailList: data.detailJson || [],
            featureList: data.featureJson?.map(feature => feature.value) || [],
            image_url: data.image_url ?? null,
            imageList: data.imageJson || [],
            variants: formattedVariants,
        };

        try {
            if (selectedProduct) {
                await updateProduct(selectedProduct.id, payload as any);
                setSuccessMessage("Product updated successfully!");
            } else {
                const res: ApiResponse<string> = await createProduct(payload as any);
                if (res.success) {
                    setSuccessMessage("Product created successfully!");
                    setTimeout(() => router.back(), 4000);
                } else {
                    setErrorMessage(res.message || "Failed to create product");
                }
            }
        } catch (err) {
            console.error(err);
            setErrorMessage(selectedProduct ? "Failed to update product" : "Failed to create product");
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
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [showToast]);

    const disableScrollNumberInput = (e: React.WheelEvent<HTMLInputElement>) => {
        e.currentTarget.blur(); // remove focus so scroll cannot change value
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
                            {/* Name */}
                            <div>
                                <label className="block text-base font-semibold text-black mb-1">Name<span className="text-red-600">*</span></label>
                                <input
                                    {...register("name")}
                                    type="text"
                                    placeholder="Enter product name"
                                    className="w-full px-3 py-2 rounded-lg bg-white text-black border border-gray-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
                                />
                                <p className="text-sm text-red-500">{errors.name?.message as any}</p>
                            </div>

                            {/* Brand */}
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
                                <p className="text-sm text-red-500">{errors.brandId?.message as any}</p>
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
                            </div>

                        </div>
                        {/* Description */}
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
                            <p className="text-sm text-red-500">{errors.description?.message as any}</p>
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
                        {/* Images */}
                        {!variantHasImages && (
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
                    {/* Variants Section */}
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
                                                sku: "",
                                                mrp: 0,
                                                bp: 0,
                                                sp: 0,
                                                stock: 0,
                                                status: true,
                                                imageUrl: "",
                                                imageJson: [],
                                                has_images: variantHasImages,
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
                                const variantImageUrl = watch(`variants.${variantIndex}.imageUrl`);
                                const rawVariantImageJson = watch(`variants.${variantIndex}.imageJson`);
                                const variantImageJson = Array.isArray(rawVariantImageJson)
                                    ? rawVariantImageJson
                                    : rawVariantImageJson
                                        ? [rawVariantImageJson]
                                        : [];
                                return (
                                    <div
                                        key={variant.id}
                                        className="mb-6 p-4 border border-gray-200 rounded-xl bg-gray-50 shadow-sm flex flex-col gap-4 relative"
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

                                        <div className="flex flex-col sm:flex-row gap-4 items-center">
                                            <div className="flex-1">
                                                <label className="block text-base font-semibold text-black mb-1">Name<span className="text-red-600">*</span></label>
                                                <input
                                                    {...register(`variants.${variantIndex}.title` as const)}
                                                    type="text"
                                                    placeholder="Enter product name"
                                                    className="w-full px-3 py-2 rounded-lg bg-white text-black border border-gray-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
                                                />
                                                <p className="text-sm text-red-500">
                                                    {Array.isArray(errors.variants) ? errors.variants[variantIndex]?.title?.message : undefined}
                                                </p>
                                            </div>
                                            {/* Attribute Value */}
                                            <div className="flex-1">
                                                <div>
                                                    <label className="block text-base font-semibold text-black mb-1">
                                                        {attributes.length > 0 ? attributes[0].name : "Attribute Value"}<span className="text-red-600">*</span>
                                                    </label>
                                                    <select
                                                        {...register(`variants.${variantIndex}.attributeValue` as const)}
                                                        className="w-full px-3 py-3 rounded-lg bg-white text-black border border-gray-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
                                                    >
                                                        <option value="">-- Select value --</option>
                                                        {attributes[0]?.values?.length ? (
                                                            attributes[0].values.map((value) => (
                                                                <option key={value.id} value={value.id}>
                                                                    {value.value}
                                                                </option>
                                                            ))
                                                        ) : (
                                                            <option disabled>No values available</option>
                                                        )}
                                                    </select>
                                                    <p className="text-sm text-red-500">
                                                        {Array.isArray(errors.variants) ? errors.variants[variantIndex]?.attributeValue?.message : undefined}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-4 items-center">

                                            {/* SKU */}
                                            <div className="flex-1">
                                                <label className="block text-base font-semibold text-black mb-1">
                                                    SKU<span className="text-red-600">*</span>
                                                </label>
                                                <input
                                                    {...register(`variants.${variantIndex}.sku` as const)}
                                                    type="text"
                                                    placeholder="Enter SKU"
                                                    className="w-full px-3 py-2 rounded-lg bg-white text-black border border-gray-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
                                                />
                                                <p className="text-sm text-red-500">
                                                    {Array.isArray(errors.variants) ? errors.variants[variantIndex]?.sku?.message : undefined}
                                                </p>
                                            </div>
                                            {/* MRP */}
                                            <div className="flex-1">
                                                <label className="block text-base font-semibold text-black mb-1">
                                                    MRP<span className="text-red-600">*</span>
                                                </label>
                                                <input
                                                    {...register(`variants.${variantIndex}.mrp` as const)}
                                                    type="number"
                                                    onWheel={disableScrollNumberInput}
                                                    placeholder="MRP"
                                                    className="w-full px-3 py-2 rounded-lg bg-white text-black border border-gray-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
                                                />
                                                <p className="text-sm text-red-500">
                                                    {Array.isArray(errors.variants) ? errors.variants[variantIndex]?.mrp?.message : undefined}
                                                </p>
                                            </div>

                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-4 items-center">
                                            {/* SP */}
                                            <div className="flex-1">
                                                <label className="block text-base font-semibold text-black mb-1">
                                                    SP<span className="text-red-600">*</span>
                                                </label>
                                                <input
                                                    {...register(`variants.${variantIndex}.sp` as const)}
                                                    type="number"
                                                    onWheel={disableScrollNumberInput}
                                                    placeholder="SP"
                                                    className="w-full px-3 py-2 rounded-lg bg-white text-black border border-gray-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
                                                />
                                                <p className="text-sm text-red-500">
                                                    {Array.isArray(errors.variants) ? errors.variants[variantIndex]?.sp?.message : undefined}
                                                </p>
                                            </div>
                                            {/* BP */}
                                            <div className="flex-1">
                                                <label className="block text-base font-semibold text-black mb-1">
                                                    BP<span className="text-red-600">*</span>
                                                </label>
                                                <input
                                                    {...register(`variants.${variantIndex}.bp` as const)}
                                                    type="number"
                                                    onWheel={disableScrollNumberInput}
                                                    placeholder="BP"
                                                    className="w-full px-3 py-2 rounded-lg bg-white text-black border border-gray-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
                                                />
                                                <p className="text-sm text-red-500">
                                                    {Array.isArray(errors.variants) ? errors.variants[variantIndex]?.bp?.message : undefined}
                                                </p>
                                            </div>


                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-4 items-center">
                                            {/* Stock */}
                                            <div className="flex-1">
                                                <label className="block text-base font-semibold text-black mb-1">Stock<span className="text-red-600">*</span></label>
                                                <input
                                                    {...register(`variants.${variantIndex}.stock` as const)}
                                                    type="number"
                                                    onWheel={disableScrollNumberInput}
                                                    step="0.01"
                                                    placeholder="Enter Stock"
                                                    className="w-full px-3 py-2 rounded-lg bg-white text-black border border-gray-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
                                                />
                                                <p className="text-sm text-red-500">
                                                    {Array.isArray(errors.variants) ? errors.variants[variantIndex]?.stock?.message : undefined}
                                                </p>
                                            </div>
                                            <div className="mt-6">
                                                <label className="flex items-center gap-4 cursor-pointer select-none">

                                                    {/* Label */}
                                                    <span className="text-sm font-semibold text-gray-800">
                                                        Status
                                                    </span>

                                                    {/* Toggle */}
                                                    <div
                                                        className={`relative flex items-center h-6 w-12 rounded-full transition-all duration-300
                ${watch(`variants.${variantIndex}.status`)
                                                                ? "bg-amber-500"
                                                                : "bg-zinc-400"
                                                            }`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            {...register(`variants.${variantIndex}.status` as const)}
                                                            defaultChecked
                                                            className="sr-only"
                                                        />

                                                        <span
                                                            className={`absolute h-6 w-6 rounded-full bg-white shadow-md transform transition-all duration-300
                                                                ${watch(`variants.${variantIndex}.status`)
                                                                    ? "translate-x-6"
                                                                    : "translate-x-0"
                                                                }`}
                                                        />
                                                    </div>

                                                </label>
                                            </div>

                                        </div>

                                        {/* Primary Image with Cropper for this variant */}
                                        {variantHasImages && (
                                            <>
                                                <div>
                                                    <label className="block text-base font-semibold text-black mb-1">Primary Image*</label>
                                                    <ImageCropperModal
                                                        onSelect={(img: any) => {
                                                            setValue(`variants.${variantIndex}.imageUrl`, img);
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
                                                    <p className="text-sm text-red-500">
                                                        {Array.isArray(errors.variants) ? errors.variants[variantIndex]?.imageUrl?.message : undefined}
                                                    </p>
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
                                                            .filter((src): src is string => typeof src === "string" && !!src)
                                                            .map((src, i) => (
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
                                    </div>
                                );
                            })}
                        </div>
                        <p className="text-sm text-red-500">
                            {errors.variants?.message as any}
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

