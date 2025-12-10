"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import axios from "../../../../../../utils/axios";
import { ChevronLeft, ChevronRight, Search, Grid3X3 } from "lucide-react";
import ProductShow from "@/components/ProductShow";
import Modal from "../../../../../components/(sheared)/Modal";

type SubCategory = {
    id: number;
    name: string;
    description?: string;
    secondary_image: string | null;
    link: string | null;
    image: string | null;
};

const imageUrl = `${process.env.NEXT_PUBLIC_UPLOAD_BASE}`;

export default function SubCategoriesPage() {
    const params = useParams();
    const parentId = Number(params?.id);
    const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
    const [parentName, setParentName] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [selectedSubcategory, setSelectedSubcategory] = useState<number | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Dropdown states
    const [showModal, setShowModal] = useState(false);
    const [allSubcategories, setAllSubcategories] = useState<SubCategory[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [modalLoading, setModalLoading] = useState(false);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const scroll = (direction: "left" | "right") => {
        const scrollAmount = 300;
        if (scrollRef.current) {
            scrollRef.current.scrollBy({
                left: direction === "left" ? -scrollAmount : scrollAmount,
                behavior: "smooth",
            });
        }
    };

    const fetchSubCategories = async () => {
        try {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/subcategories`, {
                params: { parent_id: parentId },
            });

            if (res.data.res === "success") {
                const subs = res.data.subcategories || [];
                setParentName(res.data.parent_category || "Essentials");
                setSubcategories(subs);

                // ✅ Automatically select first subcategory (if available)
                if (subs.length > 0) {
                    setSelectedSubcategory(subs[0].id);
                }
            } else {
                console.warn("Unexpected API response:", res.data);
            }
        } catch (error) {
            console.error("Failed to fetch subcategories:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (parentId) fetchSubCategories();
    }, [parentId]);

    // Fetch all subcategories for modal
    const fetchAllSubcategories = async (searchQuery: string = "") => {
        setModalLoading(true);
        try {
            const params: any = {
                parent_id: parentId,
                limit: 1000
            };

            // Only add search parameter if there's a search term
            if (searchQuery && searchQuery.trim() !== "") {
                params.search = searchQuery.trim();
            }

            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/subcategories`, {
                params
            });

            if (res.data.res === "success") {
                setAllSubcategories(res.data.subcategories || []);
            } else {
                console.warn("Unexpected API response:", res.data);
                setAllSubcategories([]);
            }
        } catch (error) {
            console.error("Failed to fetch all subcategories:", error);
            setAllSubcategories([]);
        } finally {
            setModalLoading(false);
        }
    };

    // Handle show all button click
    const handleShowAllClick = () => {
        setSearchTerm(""); // Reset search when opening
        fetchAllSubcategories("");
        setShowModal(true);
    };

    // Handle modal subcategory click
    const handleModalSubcategoryClick = (subcategoryId: number) => {
        setSelectedSubcategory(subcategoryId);
        setShowModal(false);
        setSearchTerm("");
        setTimeout(() => {
            window.scrollTo({
                behavior: "smooth",
            });
        }, 20);
    };

    // Handle search in modal with debounce
    const handleSearch = (value: string) => {
        setSearchTerm(value);

        // Clear existing timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        // Set new timeout for debounced search
        searchTimeoutRef.current = setTimeout(() => {
            fetchAllSubcategories(value);
        }, 500); // 500ms debounce
    };

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

    const handleSubcategoryClick = (subcategoryId: number) => {
        setSelectedSubcategory(subcategoryId);
        // ✅ Optional: scroll down smoothly to product section on click
        setTimeout(() => {
            window.scrollTo({
                // top: document.body.scrollHeight - 20,
                behavior: "smooth",
            });
        }, 20);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
                <div className="container mx-auto px-4 py-16">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading subcategories...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!subcategories.length) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
                <div className="container mx-auto px-4 py-16">
                    <div className="text-center">
                        <div className="w-24 h-24 text-gray-400 mx-auto mb-6">
                            <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">{parentName}</h2>
                        <h3 className="text-xl font-semibold text-gray-700 mb-4">No Subcategories Found</h3>
                        <p className="text-gray-600 mb-8">This category doesn't have any subcategories available at the moment</p>
                        <button
                            onClick={() => window.history.back()}
                            className="px-8 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-semibold rounded-full hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <section className="py-5 bg-white container mx-auto relative px-10">
                {/* Title and Show All Button */}
                <div className="flex items-center justify-between mb-10">
                    <div className="flex-1"></div>
                    <h2 className="text-2xl md:text-3xl font-semibold italic text-center">
                        {parentName}
                    </h2>
                    <div className="flex-1 flex justify-end">
                        <button
                            onClick={handleShowAllClick}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-medium rounded-full hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                        >
                            <Grid3X3 className="w-4 h-4" />
                            <span className="hidden sm:inline">Show All</span>
                        </button>

                        {/* Modal */}
                        <Modal
                            isOpen={showModal}
                            onClose={() => setShowModal(false)}
                            title={`All Subcategories - ${parentName}`}
                            width="max-w-5xl"
                        >
                            {/* Search Bar */}
                            <div className="mb-6">
                                <div className="relative w-full">
                                    <input
                                        type="text"
                                        placeholder="Search subcategories by name or description..."
                                        value={searchTerm}
                                        onChange={(e) => handleSearch(e.target.value)}
                                        className="w-full px-4 py-3 pl-11 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900"
                                    />
                                    <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                                    {searchTerm && (
                                        <button
                                            onClick={() => {
                                                setSearchTerm("");
                                                fetchAllSubcategories("");
                                            }}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                                <div className="flex items-center justify-between mt-2">
                                    {searchTerm ? (
                                        <p className="text-sm text-gray-600">
                                            {modalLoading ? (
                                                <span className="flex items-center gap-2">
                                                    <svg className="animate-spin h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Searching...
                                                </span>
                                            ) : (
                                                <>
                                                    Found <span className="font-semibold text-blue-600">{allSubcategories.length}</span> result{allSubcategories.length !== 1 ? 's' : ''} for "{searchTerm}"
                                                </>
                                            )}
                                        </p>
                                    ) : (
                                        <p className="text-sm text-gray-500">
                                            Showing all subcategories ({allSubcategories.length})
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Content */}
                            {modalLoading ? (
                                <div className="flex items-center justify-center py-20">
                                    <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
                                    <span className="ml-3 text-gray-600">Loading subcategories...</span>
                                </div>
                            ) : allSubcategories.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {allSubcategories.map((sub) => (
                                        <div
                                            key={sub.id}
                                            onClick={() => handleModalSubcategoryClick(sub.id)}
                                            className={`group cursor-pointer p-4 rounded-lg transition-all duration-200 border-2 ${selectedSubcategory === sub.id
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className="flex flex-col items-center text-center">
                                                <div className="w-16 h-16 mb-3 rounded-lg overflow-hidden bg-gray-100">
                                                    <img
                                                        src={sub.image ? `${imageUrl}${sub.image}` : "/placeholder-image.jpg"}
                                                        alt={sub.name}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                                                    />
                                                </div>
                                                <h4 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                                                    {sub.name}
                                                </h4>
                                                {selectedSubcategory === sub.id && (
                                                    <span className="mt-2 text-xs text-blue-600 font-medium">✓ Selected</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20">
                                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Search className="w-10 h-10 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No subcategories found</h3>
                                    <p className="text-gray-600 mb-6">
                                        {searchTerm
                                            ? `No results found for "${searchTerm}". Try a different search term.`
                                            : "No subcategories are available in this category."}
                                    </p>
                                    {searchTerm && (
                                        <button
                                            onClick={() => {
                                                setSearchTerm("");
                                                fetchAllSubcategories();
                                            }}
                                            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                        >
                                            Clear Search
                                        </button>
                                    )}
                                </div>
                            )}
                        </Modal>
                    </div>
                </div>

                <div className="relative">
                    {/* Left Arrow */}
                    <button
                        onClick={() => scroll("left")}
                        className="absolute -left-12 top-16 -translate-y-1/2 bg-white shadow-md hover:bg-gray-100 text-gray-700 p-2 rounded-full z-10"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>

                    {/* Scrollable Subcategories */}
                    <div
                        ref={scrollRef}
                        className="flex justify-start space-x-6 px-2 overflow-x-hidden scrollbar-hide scroll-smooth"
                    >
                        {subcategories.map((sub) => (
                            <div
                                key={sub.id}
                                className="flex flex-col items-center text-center w-28 md:w-36 flex-shrink-0 cursor-pointer"
                                onClick={() => handleSubcategoryClick(sub.id)}
                            >
                                <div
                                    className={`w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden shadow-md border transition-all duration-300 ${selectedSubcategory === sub.id
                                        ? "border-blue-500 scale-105"
                                        : "border-gray-200 hover:scale-105"
                                        }`}
                                >
                                    <img
                                        src={sub.image ? `${imageUrl}${sub.image}` : "/placeholder-image.jpg"}
                                        alt={sub.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <p className="mt-3 text-xs md:text-sm font-medium text-gray-700 uppercase">
                                    {sub.name}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Right Arrow */}
                    <button
                        onClick={() => scroll("right")}
                        className="absolute -right-12 top-16 -translate-y-1/2 bg-white shadow-md hover:bg-gray-100 text-gray-700 p-2 rounded-full z-10"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </section>

            {/* ✅ Automatically show first subcategory's products */}
            {selectedSubcategory && (
                <div className="container mx-auto mt-10">
                    <ProductShow subcategoryId={selectedSubcategory}
                        subcategoryName={subcategories.find(sub => sub.id === selectedSubcategory)?.name} />
                </div>
            )}
        </>
    );
}
