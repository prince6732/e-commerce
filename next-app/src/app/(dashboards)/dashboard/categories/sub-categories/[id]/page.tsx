"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import Image from "next/image";
import { useLoader } from "@/context/LoaderContext";
import { useParams, useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import Modal from "@/components/(sheared)/Modal";
import ErrorMessage from "@/components/(sheared)/ErrorMessage";
import SuccessMessage from "@/components/(sheared)/SuccessMessage";
import JoditEditor from "jodit-react";
import ProtectedRoute from "@/components/(sheared)/ProtectedRoute";
import { TiInfoLargeOutline } from "react-icons/ti";
import { createSubcategory, deleteSubcategory, getSubcategories, updateSubcategory } from "../../../../../../../utils/subcategory";
import { fetchAttributes } from "../../../../../../../utils/attribute";
import ImageCropperModal from "@/components/(frontend)/ImageCropperModal";
import { Attribute, Subcategory } from "@/common/interface";
import { FaArrowLeft } from "react-icons/fa";

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const SUPPORTED_FORMATS = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/avif"];

const schema = yup.object({
  name: yup.string().required("Name is required").min(2).max(50),
  description: yup.string().nullable().max(3000),
  link: yup.string().nullable().max(300),
  attributes: yup
    .array()
    .of(
      yup.object({
        AttributeId: yup.number().typeError("Attribute is required").required("Attribute is required"),
        HasImages: yup.boolean().default(false),
        IsPrimary: yup.boolean().default(false)
      })
    )
    .max(2, "You can only add up to 2 attributes"),
  image: yup
    .mixed()
    .test("fileSize", "Image must be less than 8MB.", (file) => !file || typeof file === "string" || (file instanceof File && file.size <= MAX_FILE_SIZE))
    .test("fileType", "Unsupported format", (file) => !file || typeof file === "string" || (file instanceof File && SUPPORTED_FORMATS.includes(file.type))),
  secondary_image: yup
    .mixed()
    .test("fileSize", "Secondary image must be less than 8MB.", (file) => !file || typeof file === "string" || (file instanceof File && file.size <= MAX_FILE_SIZE))
    .test("fileType", "Unsupported format", (file) => !file || typeof file === "string" || (file instanceof File && SUPPORTED_FORMATS.includes(file.type))),
  status: yup.boolean().required(),
}).required();

type FormData = yup.InferType<typeof schema>;

export default function SubcategoriesManagement() {
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [availableAttributes, setAvailableAttributes] = useState<Attribute[]>([]);
  const [parentCategory, setParentCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<Subcategory | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
  const [previewPrimary, setPreviewPrimary] = useState<string | null>(null);
  const [previewSecondary, setPreviewSecondary] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [subcategoryToDelete, setSubcategoryToDelete] = useState<Subcategory | null>(null);

  const router = useRouter();
  const params = useParams();
  const categoryId = params?.id as string;
  const basePath = process.env.NEXT_PUBLIC_UPLOAD_BASE;

  const { showLoader, hideLoader } = useLoader();

  const config = useMemo(
    () => ({
      "uploader": { "insertImageAsBase64URI": true },
      showPlaceholder: false,
      readonly: false,
      buttons: "bold,italic,underline,strikethrough,ul,ol,font,fontsize,paragraph,image,video,hr,table,link,indent,outdent,left,undo,redo",
    }),
    []
  );

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors }
  } = useForm<any>({
    resolver: yupResolver(schema),
    defaultValues: { name: "", description: "", attributes: [], status: true },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "attributes" });

  useEffect(() => {
    fetchSubcategories();
    getAttributes();
  }, [categoryId]);

  const fetchSubcategories = async () => {
    showLoader();
    try {
      const res = await getSubcategories(categoryId);
      setSubcategories(res.subcategories || []);
      setParentCategory(res.parent_category || null);
    } catch {
      setErrorMessage("Failed to load subcategories");
    } finally {
      hideLoader();
    }
  };

  const getAttributes = async () => {
    showLoader();
    try {
      const res = await fetchAttributes();
      setAvailableAttributes(res || []);
    } catch {
      setErrorMessage("Failed to load attributes");
    } finally {
      hideLoader();
    }
  };

  const openModal = (subcategory: Subcategory | null = null) => {
    setSelectedSubcategory(subcategory);

    remove();

    if (subcategory) {
      setValue("name", subcategory.name);
      setValue("description", subcategory.description ?? "");
      setValue("link", subcategory.link ?? "");
      setValue("status", Boolean(subcategory.status));

      const normalize = (path?: string | null) =>
        path ? path.replace(/\\/g, "/") : null;

      setPreviewPrimary(normalize(subcategory.image));
      setPreviewSecondary(normalize(subcategory.secondary_image));
      if (subcategory.image) setValue("image", subcategory.image);
      if (subcategory.secondary_image) setValue("secondary_image", subcategory.secondary_image);

      if (subcategory.attributes && subcategory.attributes.length > 0) {
        subcategory.attributes.forEach((attr) => {
          append({
            AttributeId: attr.id,
            HasImages: attr.pivot?.has_images ?? false,
            IsPrimary: attr.pivot?.is_primary ?? false
          });
        });
      }
    } else {
      reset({ name: "", description: "", link: "", attributes: [], status: true });
      setPreviewPrimary(null);
      setPreviewSecondary(null);
    }

    setIsModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    showLoader();
    setErrorMessage(null);
    setSuccessMessage(null);

    const payload = {
      ...data,
      parent_id: categoryId,
    };

    try {
      if (selectedSubcategory) {
        await updateSubcategory(selectedSubcategory.id, payload as any);
        setSuccessMessage("Subcategory updated successfully!");
      } else {
        await createSubcategory(payload as any);
        setSuccessMessage("Subcategory created successfully!");
      }
      fetchSubcategories();
      reset();
      setPreviewPrimary(null);
      setPreviewSecondary(null);
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      setErrorMessage(selectedSubcategory ? "Failed to update Subcategory" : "Failed to create Subcategory");
    } finally {
      hideLoader();
    }
  };

  const onDetail = (subcategory: Subcategory) => {
    router.push(`/dashboard/categories/${subcategory.id}/products`);
  };

  const confirmDelete = (subcategory: Subcategory) => {
    setSubcategoryToDelete(subcategory);
    setIsDeleteModalOpen(true);
  };

  const openDescriptionModal = (subcategory: Subcategory | null = null) => {
    setSelectedSubcategory(subcategory);
    if (subcategory) {
      setIsDescriptionModalOpen(true);
    }
  };

  const handleDelete = async () => {
    if (!subcategoryToDelete) return;

    showLoader();
    try {
      await deleteSubcategory(subcategoryToDelete.id);
      setSuccessMessage("Subcategory deleted successfully!");
      fetchSubcategories();
    } catch {
      setErrorMessage("Failed to delete subcategory");
    } finally {
      hideLoader();
      setIsDeleteModalOpen(false);
      setSubcategoryToDelete(null);
    }
  };

  return (
    <ProtectedRoute role="Admin">
      <div className="z-[999]">
        {errorMessage && <ErrorMessage message={errorMessage} onClose={() => setErrorMessage(null)} />}
        {successMessage && <SuccessMessage message={successMessage} onClose={() => setSuccessMessage(null)} />}

        {/* Header */}
        <div className="p-5 bg-white/70 backdrop-blur border border-gray-200 rounded-2xl shadow-lg mb-5">
          <div className="flex items-center justify-between">

            {/* Title */}
            <h2 className="lg:text-3xl text-xl font-bold px-5 text-gray-900 tracking-tight">
              {parentCategory ? `${parentCategory} | Subcategories` : "Subcategories"}
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
                + Create Subcategory
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto scrollbar rounded-2xl shadow border border-gc-300/30 bg-transparent">
          <table className="w-full min-w-[800px] text-sm text-left">
            <thead className="  uppercase text-xs font-semibold text-gray-700">
              <tr>
                <th className="px-6 py-4">S.No.</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Attributes</th>
                <th className="px-6 py-4">Primary Image</th>
                <th className="px-6 py-4">Secondary Image</th>
                <th className="px-6 py-4">Link</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-end">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-white-700">
              {subcategories.length ? (
                subcategories.map((subcategory, index) => {
                  const image = subcategory.image
                    ? `${basePath}${subcategory.image.replace(/\\/g, "/")}`
                    : null;
                  const secondary_image = subcategory.secondary_image
                    ? `${basePath}${subcategory.secondary_image.replace(/\\/g, "/")}`
                    : null;
                  return (
                    <tr key={subcategory.id} className="bg-white/5 hover:bg-white/10 transition">
                      <td className="px-6 py-4">{index + 1}</td>
                      <td className="px-6 py-4">{subcategory.name}</td>
                      <td className="px-6 py-5">
                        {subcategory.attributes && subcategory.attributes.length > 0 ? (
                          <div className="space-y-2">
                            {subcategory.attributes.map((attr, index) => (
                              <div
                                key={index}
                                className="border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-sm"
                              >
                                <p className="text-gray-800 font-bold">
                                  {attr.name.charAt(0).toUpperCase() + attr.name.slice(1)}
                                </p>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-xs text-gray-600 mt-1">
                                  <span>
                                    <strong>Has Images:</strong>{" "}
                                    {attr.pivot!.has_images ? (
                                      <span className="text-green-600 font-semibold">Yes</span>
                                    ) : (
                                      <span className="text-red-500 font-semibold">No</span>
                                    )}
                                  </span>

                                  <span>
                                    <strong>Is Primary:</strong>{" "}
                                    {attr.pivot!.is_primary ? (
                                      <span className="text-green-600 font-semibold">Yes</span>
                                    ) : (
                                      <span className="text-red-500 font-semibold">No</span>
                                    )}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">No Attributes</span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {image ? (
                          <Image
                            src={image}
                            alt={subcategory.name}
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
                        {secondary_image ? (
                          <Image
                            src={secondary_image}
                            alt={subcategory.name}
                            width={80}
                            height={80}
                            className="object-cover rounded"
                            unoptimized
                          />
                        ) : (
                          <span className="text-xs text-zinc-400 italic">No Image</span>
                        )}
                      </td>
                      <td className="px-6 py-4">{subcategory.link}</td>
                      <td className="px-6 py-4">
                        {subcategory.status ? (
                          <span className="px-2 py-1 rounded bg-green-500 text-xs">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded bg-red-500 text-xs">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right flex gap-2 justify-end">
                        <button
                          title="View Description"
                          className="px-4 py-2 text-xs rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 font-semibold shadow transition"
                          onClick={() => openDescriptionModal(subcategory)}
                        >
                          Description
                        </button>
                        <button
                          title="Edit Subcategory"
                          onClick={() => openModal(subcategory)}
                          className="size-10 bg-gc-300/30 hover:bg-orange-400 rounded-full flex items-center justify-center"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          title="Delete Subcategory"
                          onClick={() => confirmDelete(subcategory)}
                          className="size-10 bg-gc-300/30 hover:bg-orange-400 rounded-full flex items-center justify-center"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button
                          title="View Products"
                          onClick={() => onDetail(subcategory)}
                          className="size-10 bg-gc-300/30 hover:bg-orange-400 rounded-full flex items-center justify-center"
                        >
                          <TiInfoLargeOutline className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="text-center text-zinc-400 py-8 italic">
                    No Subcategories Found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            reset({ status: true });
            setPreviewPrimary(null);
            setPreviewSecondary(null);
            remove();
          }}
          width="max-w-5xl"
          title={selectedSubcategory ? "Edit Subcategory" : "Add Subcategory"}
        >
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid gap-8 bg-gradient-to-br from-white to-white text-gray-100 p-6 rounded-2xl border border-black/10 backdrop-blur-lg"
          >
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Name <span className="text-red-400">*</span>
                </label>
                <input
                  {...register("name")}
                  type="text"
                  placeholder="Enter Subcategory Name"
                  className="w-full min-h-12 py-2 px-4 rounded-xl bg-white/10 border border-black/10 placeholder-gray-400 text-black focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all duration-200"
                />
                <p className="text-sm text-red-400 mt-1">{errors.name?.message as any}</p>
              </div>

              {/* Link */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Link
                </label>
                <input
                  {...register("link")}
                  type="text"
                  placeholder="Enter Link (optional)"
                  className="w-full min-h-12 py-2 px-4 rounded-xl bg-white/10 border border-black/10 placeholder-gray-400 text-black focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all duration-200"
                />
                <p className="text-sm text-red-400 mt-1">{errors.link?.message as any}</p>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Description <span className="text-red-500">*</span>
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
                        readonly: false,
                      }}
                      onBlur={(newContent) => onChange(newContent)}
                    />
                  )}
                />
              </div>
              <p className="text-sm text-red-500 mt-1">{errors.description?.message as any}</p>
            </div>

            <hr className="border-white/10" />

            {/* Image Uploads */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Primary Image */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Primary Image
                </label>
                <div className="flex items-center gap-4">
                  <ImageCropperModal
                    onSelect={(img: string | string[]) => {
                      const selected = Array.isArray(img) ? img[0] : img;
                      setValue("image", selected);
                      setPreviewPrimary(selected);
                    }}
                    buttonLabel="Select Image"
                    directory="categories"
                  />
                  <div>
                    {previewPrimary ? (
                      <img
                        src={`${basePath}${previewPrimary}`}
                        alt="Primary Preview"
                        className="mt-1 h-24 w-24 rounded-xl object-cover border border-black/10 shadow-md"
                      />
                    ) : (
                      <div className="mt-1 h-24 w-24 rounded-xl border border-black/10 flex items-center justify-center text-xs text-gray-400 bg-white/5">
                        No Image
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Secondary Image */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Secondary Image
                </label>
                <div className="flex items-center gap-4">
                  <ImageCropperModal
                    onSelect={(img: string | string[]) => {
                      const selected = Array.isArray(img) ? img[0] : img;
                      setValue("secondary_image", selected);
                      setPreviewSecondary(selected);
                    }}
                    buttonLabel="Select Secondary Image"
                    directory="categories"
                  />
                  <div>
                    {previewSecondary ? (
                      <img
                        src={`${basePath}${previewSecondary}`}
                        alt="Secondary Preview"
                        className="mt-1 h-24 w-24 rounded-xl object-cover border border-black/10 shadow-md"
                      />
                    ) : (
                      <div className="mt-1 h-24 w-24 rounded-xl border border-black/10 flex items-center justify-center text-xs text-gray-400 bg-white/5">
                        No Image
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-black/10" />

            {/* Attributes */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Attributes</label>
              {fields.map((field: any, index: any) => {
                const selectedAttrId = field.AttributeId;

                return (
                  <div
                    key={field.id}
                    className="flex flex-wrap md:flex-nowrap items-center gap-4 mb-3 p-4 rounded-xl border border-black/10 bg-white/5"
                  >
                    {/* Attribute Select */}
                    <div className="flex-1">
                      <select
                        {...register(`attributes.${index}.AttributeId` as const)}
                        defaultValue={selectedAttrId}
                        className="w-full px-4 py-2 rounded-lg bg-white text-black border border-gray-300"
                      >
                        <option value="">-- Select Attribute --</option>
                        {availableAttributes.map((attr: any) => (
                          <option key={attr.id} value={attr.id}>
                            {attr.name}
                          </option>
                        ))}
                      </select>
                      {(errors.attributes && Array.isArray(errors.attributes) && errors.attributes[index]?.AttributeId) && (
                        <p className="text-sm text-red-500 mt-1">
                          {errors.attributes[index]?.AttributeId?.message as string}
                        </p>
                      )}
                    </div>

                    {/* Has Images */}
                    <label className="flex items-center gap-2 text-gray-900">
                      <input
                        type="checkbox"
                        {...register(`attributes.${index}.HasImages` as const)}
                        defaultChecked={field.HasImages}
                      />
                      Has Images
                    </label>

                    {/* Is Primary */}
                    <label className="flex items-center gap-2 text-gray-900">
                      <input
                        type="checkbox"
                        checked={watch(`attributes.${index}.IsPrimary`) || false}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          const allAttributes = watch("attributes");

                          if (!checked) {
                            const primaryCount = allAttributes.filter((a: any) => a.IsPrimary).length;
                            if (primaryCount === 1) return;
                          }

                          fields.forEach((_, i) => {
                            setValue(`attributes.${i}.IsPrimary`, i === index ? checked : false);
                          });
                        }}
                      />
                      Primary
                    </label>

                    {/* Remove Button */}
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all"
                    >
                      Remove
                    </button>
                  </div>
                );
              })}

              {/* Add Attribute Button */}
              {fields.length < 2 && (
                <button
                  type="button"
                  onClick={() => {
                    const isFirst = fields.length === 0;
                    append({
                      AttributeId: 0,
                      HasImages: false,
                      IsPrimary: isFirst,
                    });

                    if (isFirst) {
                      setValue(`attributes.0.IsPrimary`, true);
                    }
                  }}
                  className="px-5 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-full font-semibold transition-all duration-200"
                >
                  + Add Attribute
                </button>
              )}
            </div>

            <hr className="border-white/10" />

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
                className="px-10 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold rounded-full transition-all duration-300 shadow-lg hover:shadow-orange-500/30 w-full sm:w-auto"
              >
                {selectedSubcategory ? "Update Subcategory" : "Save Subcategory"}
              </button>
            </div>
          </form>
        </Modal>


        {/* delete Modal */}
        <Modal
          width="max-w-xl"
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Confirm Delete"
        >
          <p className="text-gray-900">Are you sure you want to delete {subcategoryToDelete?.name}?</p>
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

        {/* Description Modal */}
        <Modal isOpen={isDescriptionModalOpen} onClose={() => setIsDescriptionModalOpen(false)} width="max-w-4xl" title="Description">
          <div className="text-gray-700" dangerouslySetInnerHTML={{ __html: selectedSubcategory?.description || "<p>No Description</p>" }} />
        </Modal>

      </div>
    </ProtectedRoute>
  );
}
