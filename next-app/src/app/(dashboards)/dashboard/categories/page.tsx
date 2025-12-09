"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import Modal from "@/components/(sheared)/Modal";
import ErrorMessage from "@/components/(sheared)/ErrorMessage";
import SuccessMessage from "@/components/(sheared)/SuccessMessage";
import { useLoader } from "@/context/LoaderContext";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Pencil, Trash2 } from "lucide-react";
import { TiInfoLargeOutline } from "react-icons/ti";
import ProtectedRoute from "@/components/(sheared)/ProtectedRoute";
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "../../../../../utils/category";
import JoditEditor from "jodit-react";
import ImageCropperModal from "@/components/(frontend)/ImageCropperModal";
import { Category } from "@/common/interface";

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const SUPPORTED_FORMATS = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/avif",
];

const schema = yup
  .object({
    name: yup.string().required("Name is required").min(2).max(50),
    description: yup.string().nullable().max(3000),
    link: yup.string().nullable().max(300),
    image: yup.mixed().test("fileSize", "Image must be less than 8MB.",
      (file) => !file || typeof file === "string" || (file instanceof File && file.size <= MAX_FILE_SIZE)
    ).test("fileType", "Unsupported format", (file) => !file || typeof file === "string" ||
      (file instanceof File && SUPPORTED_FORMATS.includes(file.type))
    ),
    secondary_image: yup.mixed().test("fileSize", "Secondary image must be less than 8MB.",
      (file) => !file || typeof file === "string" || (file instanceof File && file.size <= MAX_FILE_SIZE)
    ).test("fileType", "Unsupported format", (file) => !file || typeof file === "string" ||
      (file instanceof File && SUPPORTED_FORMATS.includes(file.type))
    ),
    status: yup.boolean().required(),
  })
  .required();

type FormData = yup.InferType<typeof schema>;

export default function CategoriesManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null
  );
  const [previewPrimary, setPreviewPrimary] = useState<string | null>(null);
  const [previewSecondary, setPreviewSecondary] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { showLoader, hideLoader } = useLoader();
  const router = useRouter();
  const basePath = process.env.NEXT_PUBLIC_UPLOAD_BASE || "https://api.zelton.co.in";

  const config = useMemo(
    () => ({
      uploader: { insertImageAsBase64URI: true },
      showPlaceholder: false,
      readonly: false,
      buttons:
        "bold,italic,underline,strikethrough,ul,ol,font,fontsize,paragraph,image,video,hr,table,link,indent,outdent,left,undo,redo",
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
    formState: { errors },
  } = useForm<any>({
    resolver: yupResolver(schema),
    defaultValues: { status: true },
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    showLoader();
    try {
      const res = await getCategories();
      setCategories(res || []);
    } catch {
      setErrorMessage("Failed to load categories");
    } finally {
      hideLoader();
    }
  };

  const openModal = (category: Category | null = null) => {
    setSelectedCategory(category);

    if (category) {
      setValue("name", category.name);
      setValue("description", category.description ?? "");
      setValue("link", category.link ?? "");
      setValue("status", Boolean(category.status));

      const normalize = (path?: string | null) =>
        path ? path.replace(/\\/g, "/") : null;

      setPreviewPrimary(normalize(category.image));
      setPreviewSecondary(normalize(category.secondary_image));
      if (category.image) setValue("image", category.image);
      if (category.secondary_image) setValue("secondary_image", category.secondary_image);
    } else {
      reset({ status: true });
      setPreviewPrimary(null);
      setPreviewSecondary(null);
    }
    setIsModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    showLoader();
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      if (selectedCategory) {
        await updateCategory(selectedCategory.id, data as any);
        setSuccessMessage("Category updated successfully!");
      } else {
        await createCategory(data as any);
        setSuccessMessage("Category created successfully!");
      }
      loadCategories();
      reset();
      setPreviewPrimary(null);
      setPreviewSecondary(null);
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      setErrorMessage(selectedCategory ? "Failed to update category" : "Failed to create category");
    } finally {
      hideLoader();
    }
  };

  const confirmDelete = (category: Category) => {
    setCategoryToDelete(category);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    showLoader();
    try {
      await deleteCategory(categoryToDelete.id);
      setSuccessMessage("Category deleted successfully!");
      loadCategories();
    } catch {
      setErrorMessage("Failed to delete category");
    } finally {
      hideLoader();
      setIsDeleteModalOpen(false);
      setCategoryToDelete(null);
    }
  };

  const onDetail = (category: Category) => {
    router.push(`categories/sub-categories/${category.id}`)
  }

  return (
    <ProtectedRoute role="Admin">
      <div className="z-[999]">
        {errorMessage && (
          <ErrorMessage message={errorMessage} onClose={() => setErrorMessage(null)} />
        )}
        {successMessage && (
          <SuccessMessage
            message={successMessage}
            onClose={() => setSuccessMessage(null)}
          />
        )}

        {/* Header */}
        <div className="p-2 border border-gc-300/30 rounded-3xl shadow flex items-center justify-between mb-3">
          <h2 className="lg:text-2xl text-lg px-5 font-semibold text-gray-600 tracking-tight">
            Categories
          </h2>
          <button
            className="flex items-center px-10 py-3 bg-orange-400 hover:bg-orange-500 rounded-full font-semibold text-white transition"
            onClick={() => openModal(null)}
          >
            + Create Category
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto scrollbar rounded-2xl shadow border border-gc-300/30 bg-transparent">
          <table className="w-full min-w-[800px] text-sm text-left">
            <thead className="  uppercase text-xs font-semibold text-gray-700">
              <tr>
                <th className="px-6 py-4">S.No.</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Primary Image</th>
                <th className="px-6 py-4">Secondary Image</th>
                <th className="px-6 py-4">Link</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-end">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-white-700">
              {categories.length ? (
                categories.map((category, index) => {
                  // ✅ Build safe URL
                  const image = category.image
                    ? `${basePath}${category.image.replace(/\\/g, "/")}`
                    : null;
                  const secondary_image = category.secondary_image
                    ? `${basePath}${category.secondary_image.replace(/\\/g, "/")}`
                    : null;
                  return (
                    <tr key={category.id} className="bg-white/5 hover:bg-white/10 transition">
                      <td className="px-6 py-4">{index + 1}</td>
                      <td className="px-6 py-4">{category.name}</td>
                      <td className="px-6 py-4" dangerouslySetInnerHTML={{ __html: category?.description || "<p>No Description</p>" }} ></td>

                      <td className="px-6 py-4">
                        {image ? (
                          <Image
                            src={image}
                            alt={category.name}
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
                            alt={category.name}
                            width={80}
                            height={80}
                            className="object-cover rounded"
                            unoptimized
                          />
                        ) : (
                          <span className="text-xs text-zinc-400 italic">No Image</span>
                        )}
                      </td>
                      <td className="px-6 py-4">{category.link}</td>
                      <td className="px-6 py-4">
                        {category.status ? (
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
                          title="Edit Category"
                          onClick={() => openModal(category)}
                          className="size-10 bg-gc-300/30 hover:bg-orange-400 rounded-full flex items-center justify-center"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          title="Delete Category"
                          onClick={() => confirmDelete(category)}
                          className="size-10 bg-gc-300/30 hover:bg-orange-400 rounded-full flex items-center justify-center"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button
                          title="View Subcategories"
                          onClick={() => onDetail(category)}
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
                    No Categories Found
                  </td>
                </tr>
              )}
            </tbody>

          </table>
        </div>

        {/* Add/Edit Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            reset({ status: true });
            setPreviewPrimary(null);
            setPreviewSecondary(null);
          }}
          width="max-w-5xl"
          title={selectedCategory ? "Edit Category" : "Add Category"}
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
                  placeholder="Enter Category Name"
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
                          color: "#000", // make editor text black
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
                {selectedCategory ? "Update Category" : "Save Category"}
              </button>
            </div>
          </form>
        </Modal>

        {/* Delete Confirm Modal */}
        <Modal
          width="max-w-xl"
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Confirm Delete"
        >
          <p>Are you sure you want to delete {categoryToDelete?.name}?</p>
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
