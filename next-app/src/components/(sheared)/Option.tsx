
import { CategoryAttribute } from "@/common/interface";
import { Control, FieldErrors, useFieldArray, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { FaTimes } from "react-icons/fa";
import ImageCropperModal from "../(frontend)/ImageCropperModal";
import { FormData1 } from "@/app/(dashboards)/dashboard/categories/[id]/products/add-multi-variant/page";

type Props = {
    itemIndex: number;
    control: Control<any>;
    register: any;
    setValue: UseFormSetValue<FormData1>;
    watch: UseFormWatch<FormData1>;
    errors: FieldErrors<FormData1>;
    attributeOneHasImages: boolean;
    attributeTwoHasImages: boolean;
    attribute: CategoryAttribute;
};

const uploadUrl = process.env.NEXT_PUBLIC_UPLOAD_BASE ?? "https://api.zelton.co.in";

function VariantOption({ itemIndex, control, register, setValue, watch, errors, attributeOneHasImages, attributeTwoHasImages, attribute }: Props) {
    const { fields, append, remove } = useFieldArray({
        control,
        name: `variants.${itemIndex}.options`,
    });

    return (
        <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-6">
                {fields.map((option, optionIndex) => {
                    const variantImageUrl = watch(`variants.${itemIndex}.options.${optionIndex}.image_url`);
                    // Ensure variantImageJson is an array
                    let variantImageJsonRaw = watch(`variants.${itemIndex}.options.${optionIndex}.imageJson`);
                    let variantImageJson: string[] = [];

                    if (variantImageJsonRaw) {
                        if (typeof variantImageJsonRaw === "string") {
                            try {
                                const parsed = JSON.parse(variantImageJsonRaw);
                                if (Array.isArray(parsed)) variantImageJson = parsed;
                            } catch (err) {
                                console.error("Failed to parse imageJson", err);
                            }
                        } else if (Array.isArray(variantImageJsonRaw)) {
                            variantImageJson = variantImageJsonRaw.filter((item): item is string => item !== undefined);
                        }
                    }

                    return (
                        <div
                            key={option.id}
                            className="p-4 border border-gray-200 rounded-xl bg-gray-50 shadow-sm flex flex-col gap-4 relative"
                        >
                            {/* Header row */}
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex-1">
                                    <label className="block text-base font-semibold text-black mb-1">Name *</label>
                                    <input
                                        {...register(`variants.${itemIndex}.options.${optionIndex}.title`)}
                                        type="text"
                                        placeholder="Enter product name"
                                        className="w-full px-3 py-2 rounded-lg bg-white text-black border border-gray-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
                                    />
                                    <p className="text-sm text-red-500">{errors.variants?.[itemIndex]?.options?.[optionIndex]?.title?.message}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => remove(optionIndex)}
                                    className="ml-4 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition flex items-center justify-center"
                                    title="Remove"
                                >
                                    <FaTimes className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Attribute Value */}
                                <div>
                                    <label className="block text-base font-semibold text-black mb-1">
                                        {attribute.name} *
                                    </label>
                                    <select
                                        {...register(`variants.${itemIndex}.options.${optionIndex}.attributeValue`)}
                                        className="w-full px-3 py-2 rounded-lg bg-white text-black border border-gray-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
                                    >
                                        <option value="">-- Select value --</option>
                                        {attribute.values?.map((value) => (
                                            <option key={value.id} value={value.id}>
                                                {value.value}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-sm text-red-500">
                                        {errors.variants?.[itemIndex]?.options?.[optionIndex]?.attributeValue?.message}
                                    </p>
                                </div>
                                {/* SKU */}
                                <div>
                                    <label className="block text-base font-semibold text-black mb-1">
                                        SKU
                                    </label>
                                    <input
                                        {...register(`variants.${itemIndex}.options.${optionIndex}.sku`)}
                                        type="text"
                                        placeholder="Enter SKU"
                                        className="w-full px-3 py-2 rounded-lg bg-white text-black border border-gray-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
                                    />
                                    <p className="text-sm text-red-500">
                                        {errors.variants?.[itemIndex]?.options?.[optionIndex]?.sku?.message}
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* MRP */}
                                <div>
                                    <label className="block text-base font-semibold text-black mb-1">
                                        MRP
                                    </label>
                                    <input
                                        {...register(`variants.${itemIndex}.options.${optionIndex}.mrp`)}
                                        type="number"
                                        placeholder="MRP"
                                        className="w-full px-3 py-2 rounded-lg bg-white text-black border border-gray-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
                                    />
                                    <p className="text-sm text-red-500">
                                        {errors.variants?.[itemIndex]?.options?.[optionIndex]?.mrp?.message}
                                    </p>
                                </div>
                                {/* BP */}
                                <div>
                                    <label className="block text-base font-semibold text-black mb-1">
                                        BP
                                    </label>
                                    <input
                                        {...register(`variants.${itemIndex}.options.${optionIndex}.bp`)}
                                        type="number"
                                        placeholder="BP"
                                        className="w-full px-3 py-2 rounded-lg bg-white text-black border border-gray-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
                                    />
                                    <p className="text-sm text-red-500">
                                        {errors.variants?.[itemIndex]?.options?.[optionIndex]?.bp?.message}
                                    </p>
                                </div>
                                {/* SP */}
                                <div>
                                    <label className="block text-base font-semibold text-black mb-1">
                                        SP
                                    </label>
                                    <input
                                        {...register(`variants.${itemIndex}.options.${optionIndex}.sp`)}
                                        type="number"
                                        placeholder="SP"
                                        className="w-full px-3 py-2 rounded-lg bg-white text-black border border-gray-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
                                    />
                                    <p className="text-sm text-red-500">
                                        {errors.variants?.[itemIndex]?.options?.[optionIndex]?.sp?.message}
                                    </p>
                                </div>

                                {/* Stock */}
                                <div>
                                    <label className="block text-base font-semibold text-black mb-1">Stock*</label>
                                    <input
                                        {...register(`variants.${itemIndex}.options.${optionIndex}.stock` as const)}
                                        type="number"
                                        step="0.01"
                                        placeholder="Enter Stock"
                                        className="w-full px-3 py-2 rounded-lg bg-white text-black border border-gray-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
                                    />
                                    <p className="text-sm text-red-500">{errors.variants?.[itemIndex]?.options?.[optionIndex]?.stock?.message}</p>
                                </div>
                            </div>
                            {/* Primary Image with Cropper for this option */}
                            {attributeTwoHasImages && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-base font-semibold text-black mb-1">Primary Image*</label>
                                        <ImageCropperModal
                                            onSelect={(img: any) => {
                                                setValue(`variants.${itemIndex}.options.${optionIndex}.image_url`, img);
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
                                        <p className="text-sm text-red-500">{errors.variants?.[itemIndex]?.options?.[optionIndex]?.image_url?.message}</p>
                                    </div>
                                    <div>
                                        <label className="block text-base font-semibold text-black mb-1">Additional Images</label>
                                        <ImageCropperModal
                                            multiple
                                            onSelect={(imgs: any) => {
                                                setValue(`variants.${itemIndex}.options.${optionIndex}.imageJson`, imgs);
                                            }}
                                            buttonLabel="Select Additional Images"
                                        />
                                        <div className="flex gap-2 mt-2 flex-nowrap overflow-x-auto">
                                            {variantImageJson
                                                .filter((src: any): src is string => typeof src === "string" && !!src)
                                                .map((src: any, i: any) => (
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
                            )}
                            {/* Status */}
                            <div className="flex items-center gap-2 mt-2">
                                <input
                                    type="checkbox"
                                    {...register(`variants.${itemIndex}.options.${optionIndex}.status`)}
                                    defaultChecked
                                />
                                <span className="text-base text-black font-semibold">Active</span>
                            </div>
                        </div>
                    );
                })}
            </div>
            <button
                type="button"
                onClick={() =>
                    append({
                        title: "",
                        attributeValue: "",
                        sku: "",
                        mrp: "",
                        bp: "",
                        sp: "",
                        imageUrl: "",
                        imageJson: [],
                        status: true,
                        hasAttributeImages1: attributeOneHasImages,
                        hasAttributeImages2: attributeTwoHasImages
                    })
                }
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition self-start"
            >
                + Add Option
            </button>
        </div>
    );
}

export default VariantOption;