'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  RiArrowDownSLine,
  RiMenuLine,
  RiSearchLine,
  RiUserLine,
  RiShoppingBagLine,
  RiCloseLine,
  RiHeartLine,
  RiPhoneLine,
  RiMailLine,
  RiStarFill,
  RiShieldCheckLine,
  RiLoaderLine
} from 'react-icons/ri';
import { TbLayoutDashboardFilled } from 'react-icons/tb';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useLike } from '@/context/LikeContext';
import logoText from '@/public/ZeltonHorizontalBlack.png';
import axios from '../../../utils/axios';
import {
  fetchThemes,
} from "../../../utils/theme";

const basePath = process.env.NEXT_PUBLIC_UPLOAD_BASE || "https://api.zelton.co.in";

type Themes = {
  id: number;
  background_color: string;
  text_color: string;
  primary_color: string;
  gradient_start?: string | null;
  gradient_end?: string | null;
  gradient_direction: string;
};


const Navbar = () => {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const { likedProducts } = useLike();
  const router = useRouter();

  const [categories, setCategories] = useState<any[]>([]);
  const [topSubcategories, setTopSubcategories] = useState<any[]>([]);
  const [isSearchOpen, setSearchOpen] = useState(false);
  const [isCartOpen, setCartOpen] = useState(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobileShopOpen, setMobileShopOpen] = useState(false);
  const [isAccountMenuOpen, setAccountMenuOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [mobileSearchQuery, setMobileSearchQuery] = useState('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [themes, setThemes] = useState<Themes | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadTheme();
  }, []);

  const gradientDirection = themes?.gradient_direction || "to right";
  const gradientStart =
    themes?.gradient_start || themes?.primary_color || "#f97316";
  const gradientEnd =
    themes?.gradient_end || themes?.primary_color || "#facc15";

  const loadTheme = async () => {
    try {
      const data = await fetchThemes();
      if (Array.isArray(data) && data.length > 0) {
        // Pick the latest theme
        const latest = data[data.length - 1];
        setThemes(latest);
      } else {
        setErrorMessage("No themes available");
      }
    } catch {
      setErrorMessage("Failed to fetch theme. Please try again.");
    }
  };
  // Fetch categories and top subcategories
  useEffect(() => {
    const getCategories = async () => {
      try {
        const response = await axios.get('/api/categories');
        setCategories(response.data);
      } catch (error) {
        console.error(error);
      }
    };

    const getTopSubcategories = async () => {
      try {
        const response = await axios.get('/api/subcategories-with-products?limit=8&min_products=1&order_by=products_count&order_direction=desc');
        if (response.data.res === 'success') {
          setTopSubcategories(response.data.data.categories || []);
        } else {
          console.warn('API returned non-success response:', response.data);
          setTopSubcategories([]);
        }
      } catch (error) {
        console.error('Error fetching top subcategories:', error);
        // Fallback to hardcoded terms if API fails
        setTopSubcategories([
          { name: 'Electronics', products_count: 0 },
          { name: 'Fashion', products_count: 0 },
          { name: 'Books', products_count: 0 },
          { name: 'Home', products_count: 0 },
          { name: 'Sports', products_count: 0 }
        ]);
      }
    };

    getCategories();
    getTopSubcategories();
  }, []);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 400);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleDashboardRedirect = () => {
    if (user?.role === 'Admin') {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
    setAccountMenuOpen(false)
  };

  // Search functionality
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await axios.get(`/api/search-products?q=${encodeURIComponent(query)}&limit=8`);
      if (response.data.res === 'success') {
        setSearchResults(response.data.data.products || []);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  const handleMobileSearchChange = (value: string) => {
    setMobileSearchQuery(value);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const handleMobileSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mobileSearchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(mobileSearchQuery.trim())}`);
      setMobileMenuOpen(false);
      setMobileSearchQuery('');
      setSearchResults([]);
    }
  };

  const handleProductClick = (productId: number) => {
    router.push(`/products/${productId}`);
    setSearchOpen(false);
    setMobileMenuOpen(false);
    setSearchQuery('');
    setMobileSearchQuery('');
    setSearchResults([]);
  };

  const handleSubcategoryClick = (subcategory: any) => {
    // If subcategory has an ID, navigate to category page
    if (subcategory.id) {
      router.push(`/categories/subcategories/${subcategory.id}`);
      setSearchOpen(false);
      setMobileMenuOpen(false);
    } else {
      // Fallback to search for subcategory name
      handleSearchChange(subcategory.name);
    }
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Close search modal if clicking outside search container
      if (!target.closest('.search-container')) {
        setSearchOpen(false);
        setSearchResults([]);
        setSearchQuery('');
      }

      // Close account menu if clicking outside account container
      if (!target.closest('.account-container')) {
        setAccountMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close search modal on ESC key
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isSearchOpen) {
        setSearchOpen(false);
        setSearchQuery('');
        setSearchResults([]);
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [isSearchOpen]);

  return (

    <header className="sticky top-0 z-50 shadow-lg b" style={{ backgroundColor: themes?.background_color || "#fff" }}>
      {/* Top Bar */}
      <div
        className="hidden lg:block text-white"
        style={{
          background: themes
            ? `linear-gradient(${themes.gradient_direction}, ${themes.gradient_start || themes.primary_color}, ${themes.gradient_end || themes.primary_color})`
            : "linear-gradient(to right, #f97316, #facc15)",
          color: themes?.text_color || "#fff",
        }}
      >
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-6">
              <div className="flex items-center gap-1">
                <RiPhoneLine className="text-xs" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center gap-1">
                <RiMailLine className="text-xs" />
                <span>support@store.com</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center gap-1">
                <RiShieldCheckLine className="text-xs" />
                <span>Free Shipping on orders over $50</span>
              </div>
              <div className="flex items-center gap-1">
                <RiStarFill className="text-xs text-yellow-200" />
                <span>Trusted by 50,000+ customers</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-yellow-500 opacity-0 group-hover:opacity-20 rounded-full transition-opacity duration-300"></div>
            </div>
            <div className="flex flex-col">
              <span
                style={{
                  backgroundImage: `linear-gradient(${gradientDirection}, ${gradientStart}, ${gradientEnd})`,
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
                className="font-bold text-2xl"
              >
                <Image src={logoText} unoptimized alt="Zelton Logo" className="h-8 w-auto object-contain" />
              </span>
            </div>
          </Link>

          {/* Main Navigation */}
          <nav className="hidden lg:flex items-center space-x-8 mx-8">
            <Link href="/" className={"relative py-2 px-4 text-gray-700 font-medium hover:text-orange-600 transition-all duration-300 group"}
              style={{
                color: themes?.text_color || "#000", // fallback to black
              }}>
              <span>Home</span>
              <div
                className="absolute bottom-0 left-0 w-0 h-0.5 group-hover:w-full transition-all duration-300"
                style={{
                  backgroundImage: `linear-gradient(${gradientDirection}, ${gradientStart}, ${gradientEnd})`,
                }}
              ></div>
            </Link>

            {/* Categories Dropdown */}
            <div className="relative group" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
              <button style={{
                color: themes?.text_color || "#000", // fallback to black
              }} className="relative py-2 px-4 text-gray-700 font-medium hover:text-orange-600 transition-all duration-300 flex items-center gap-2">
                <span>Categories</span>
                <RiArrowDownSLine className={`transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
                <div className="absolute bottom-0 left-0 w-0 h-0.5 group-hover:w-full transition-all duration-300"
                  style={{
                    backgroundImage: `linear-gradient(${gradientDirection}, ${gradientStart}, ${gradientEnd})`,
                  }}
                ></div>
              </button>

              {open && (
                <div
                  style={{
                    backgroundColor: themes?.background_color || "#fff",
                    color: themes?.text_color || "#000",
                    borderColor: themes?.primary_color || "#e5e7eb",
                  }}
                  className="absolute left-[-300px] top-full mt-2 w-[900px] shadow-2xl rounded-2xl border overflow-hidden animate-in slide-in-from-top-2 duration-200"
                >
                  <div className="p-4">
                    <div className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Shop by Category</div>
                    <div className="grid grid-cols-4 gap-3">

                      {categories.length > 0 ? (

                        categories.map((cat) => {
                          const image = cat.image
                            ? `${basePath}${cat.image.replace(/\\/g, "/")}`
                            : null;
                          const plainDescription = cat?.description
                            ? cat.description.replace(/<[^>]+>/g, "").slice(0, 80)
                            : "No Description";

                          return (
                            <Link
                              key={cat.id}
                              href={`/categories/subcategories/${cat.id}`}
                              className="group flex items-center gap-3 p-3 rounded-xl hover:shadow-md transition-all duration-300"
                            >
                              {image ? (
                                <Image
                                  src={image}
                                  alt={cat.name}
                                  width={60}
                                  height={60}
                                  className="object-cover rounded"
                                  unoptimized
                                />
                              ) : (
                                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-lg flex items-center justify-center text-white font-bold text-base">
                                  {cat.name?.charAt(0).toUpperCase() || "C"}
                                </div>
                              )}

                              <div
                                style={{ color: themes?.text_color || "#000" }}
                                className="font-medium transition-colors"
                              >
                                {cat.name}
                                <p className="text-sm text-gray-500 line-clamp-2">{plainDescription}</p>
                              </div>
                            </Link>
                          );
                        })
                      ) : (
                        <div className="col-span-4 text-center py-8">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <RiSearchLine className="text-2xl text-gray-400" />
                          </div>
                          <p className="text-gray-500">No categories available</p>
                        </div>
                      )}
                    </div>

                  </div>
                  {categories.length > 0 && (
                    <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-4 border-t border-gray-100">
                      <Link href="/categories" className="text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors">
                        View all categories →
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            <Link href="/contact_us" style={{
              color: themes?.text_color || "#000", // fallback to black
            }} className="relative py-2 px-4 text-gray-700 font-medium hover:text-orange-600 transition-all duration-300 group">
              <span>Contact Us</span>
              <div className="absolute bottom-0 left-0 w-0 h-0.5 group-hover:w-full transition-all duration-300"
                style={{
                  backgroundImage: `linear-gradient(${gradientDirection}, ${gradientStart}, ${gradientEnd})`,
                }}
              ></div>
            </Link>

            {/* <Link href="/sale" className="relative py-2 px-4 text-red-600 font-medium hover:text-red-700 transition-all duration-300 group">
              <span className="flex items-center gap-1">
                Sale
                <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full animate-pulse">HOT</span>
              </span>
              <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-red-600 group-hover:w-full transition-all duration-300"></div>
            </Link> */}

            <Link href="/about_us" style={{
              color: themes?.text_color || "#000", // fallback to black
            }} className="relative py-2 px-4 text-gray-700 font-medium hover:text-orange-600 transition-all duration-300 group">
              <span>About</span>
              <div className="absolute bottom-0 left-0 w-0 h-0.5 group-hover:w-full transition-all duration-300"
                style={{
                  backgroundImage: `linear-gradient(${gradientDirection}, ${gradientStart}, ${gradientEnd})`,
                }}
              ></div>
            </Link>
          </nav>

          {/* Action Icons */}
          <div className="flex items-center space-x-3">
            {/* Search */}
            <div className="relative search-container">
              <button
                onClick={() => {
                  if (isSearchOpen) {
                    setSearchOpen(false);
                    setSearchQuery('');
                    setSearchResults([]);
                  } else {
                    setSearchOpen(true);
                  }
                }}
                className="w-11 h-11 flex items-center justify-center text-gray-600 hover:text-white hover:bg-gradient-to-r hover:from-orange-500 hover:to-yellow-500 transition-all duration-300 rounded-xl group"
              >
                <RiSearchLine className="text-xl group-hover:scale-110 transition-transform" style={{
                  color: themes?.text_color || "#000", // fallback to black
                }} />
              </button>
              {isSearchOpen && (
                <div className="absolute md:right-0 -right-[150px] top-full mt-3 w-96 bg-white shadow-2xl rounded-2xl border border-gray-100 overflow-hidden animate-in slide-in-from-top-2 duration-200 z-50">
                  <div className="p-6">
                    <form onSubmit={handleSearchSubmit}>
                      <div className="relative">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => handleSearchChange(e.target.value)}
                          placeholder="Search for products, brands, categories..."
                          className="w-full pl-12 pr-10 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm bg-gray-50"
                          autoFocus
                        />
                        <RiSearchLine className="absolute left-4 top-1/2 -translate-y-1/2  text-lg" />
                        {isSearching && (
                          <RiLoaderLine className="absolute right-4 top-1/2 -translate-y-1/2 text-orange-500 text-lg animate-spin" />
                        )}
                      </div>
                    </form>

                    {/* Search Results */}
                    {searchQuery && searchResults.length > 0 && (
                      <div className="mt-4">
                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Search Results</div>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {searchResults.map((product) => (
                            <div
                              key={product.id}
                              onClick={() => handleProductClick(product.id)}
                              className="flex items-center gap-3 p-3 hover:bg-orange-50 rounded-xl cursor-pointer transition-all group"
                            >
                              <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg overflow-hidden flex-shrink-0">
                                {product.image_url ? (
                                  <img
                                    src={`${basePath}${product.image_url}`}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs font-bold" >
                                    {product.name?.charAt(0).toUpperCase() || 'P'}
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 group-hover:text-orange-600 transition-colors truncate">
                                  {product.name}
                                </div>
                                <div className="text-sm text-gray-500 truncate">
                                  {product.category?.name} {product.brand?.name && `• ${product.brand.name}`}
                                </div>
                                {product.variants && product.variants.length > 0 && (
                                  <div className="text-xs text-orange-600 font-medium">
                                    From ₹{Math.min(...product.variants.map((v: any) => v.sp || v.mrp))}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        {searchQuery && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <button
                              onClick={() => handleSearchSubmit(new Event('submit') as any)}
                              className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                            >
                              View all results for "{searchQuery}" →
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* No Results */}
                    {searchQuery && !isSearching && searchResults.length === 0 && (
                      <div className="mt-4 text-center py-6">
                        <div className="text-gray-400 mb-2">
                          <RiSearchLine className="text-2xl mx-auto" />
                        </div>
                        <p className="text-sm text-gray-500">No results found for "{searchQuery}"</p>
                        <button
                          onClick={() => handleSearchSubmit(new Event('submit') as any)}
                          className="text-sm text-orange-600 hover:text-orange-700 font-medium mt-2"
                        >
                          Search anyway →
                        </button>
                      </div>
                    )}

                    {/* Popular Categories */}
                    {!searchQuery && (
                      <div className="mt-4">
                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Popular Categories</div>
                        <div className="flex flex-wrap gap-2">
                          {topSubcategories.length > 0 ? (
                            topSubcategories.map((subcategory, index) => (
                              <span
                                key={subcategory.id || index}
                                onClick={() => handleSubcategoryClick(subcategory)}
                                className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-xs cursor-pointer hover:bg-orange-100 hover:text-orange-600 transition-colors"
                              >
                                {subcategory.name}
                              </span>
                            ))
                          ) : (
                            // Fallback to hardcoded terms while loading
                            ['iPhone', 'Laptop', 'Headphones', 'Shoes', 'Clothing'].map((term) => (
                              <span
                                key={term}
                                onClick={() => handleSearchChange(term)}
                                className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-xs cursor-pointer hover:bg-orange-100 hover:text-orange-600 transition-colors"
                              >
                                {term}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Cart */}
            <button
              onClick={() => router.push('/cart')}

              className="w-11 h-11 flex items-center justify-center text-gray-600 hover:text-white hover:bg-gradient-to-r hover:from-orange-500 hover:to-yellow-500 transition-all duration-300 rounded-xl group relative"
            >
              <RiShoppingBagLine className="text-xl group-hover:scale-110 transition-transform" style={{
                color: themes?.text_color || "#000", // fallback to black
              }} />
              {count > 0 && (
                <span style={{
                  background: themes
                    ? `linear-gradient(${themes.gradient_direction}, ${themes.gradient_start || themes.primary_color}, ${themes.gradient_end || themes.primary_color})`
                    : "linear-gradient(to right, #f97316, #facc15)",
                  color: themes?.text_color || "#fff",
                }} className="absolute -top-1 -right-1  text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg">
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </button>

            {/* Wishlist */}
            <button
              onClick={() => router.push('/wishlist')}
              className="w-11 h-11 flex items-center justify-center text-gray-600 hover:text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-pink-500 transition-all duration-300 rounded-xl group relative"
            >
              <RiHeartLine className="text-xl group-hover:scale-110 transition-transform" style={{
                color: themes?.text_color || "#000", // fallback to black
              }} />
              {likedProducts.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium shadow-lg">
                  {likedProducts.length > 99 ? '99+' : likedProducts.length}
                </span>
              )}
            </button>

            {/* Account */}
            <div className="relative account-container">
              <button
                onClick={() => setAccountMenuOpen(!isAccountMenuOpen)}
                className="w-11 h-11 flex items-center justify-center hover:bg-gradient-to-r hover:from-orange-500 hover:to-yellow-500 transition-all duration-300 rounded-xl group"
              >
                {user ? (
                  <div className="w-11 h-11 rounded-xl overflow-hidden shadow-lg">
                    {user.profile_picture ? (
                      <img
                        src={`${basePath}/storage/${user.profile_picture}`}
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="bg-gradient-to-r from-orange-500 to-yellow-500 w-full h-full flex items-center justify-center font-bold text-white text-sm">
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                  </div>
                ) : (
                  <RiUserLine className="text-xl text-gray-600 group-hover:text-white group-hover:scale-110 transition-all" />
                )}
              </button>

              {isAccountMenuOpen && (
                <div className="absolute right-0 top-full mt-3 w-72 bg-white shadow-2xl rounded-2xl border border-gray-100 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                  {user ? (
                    <div>
                      <div style={{
                        background: themes
                          ? `linear-gradient(${themes.gradient_direction}, ${themes.gradient_start || themes.primary_color}, ${themes.gradient_end || themes.primary_color})`
                          : "linear-gradient(to right, #f97316, #facc15)",
                        color: themes?.text_color || "#fff",
                      }} className="">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20">
                            {user.profile_picture ? (
                              <img
                                src={`${basePath}/storage/${user.profile_picture}`}
                                alt={user.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-white/20 flex items-center justify-center font-bold text-lg">
                                {user.name?.charAt(0).toUpperCase() || 'U'}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold">{user.name}</div>
                            <div className="text-sm opacity-90">{user.email}</div>
                          </div>
                        </div>
                      </div>
                      <div className="p-2">
                        {user.role === 'Admin' && (
                          <button
                            onClick={handleDashboardRedirect}
                            className="flex items-center gap-3 w-full px-4 py-3 text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors rounded-xl"
                          >
                            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                              <TbLayoutDashboardFilled className="text-orange-600" />
                            </div>
                            <span className="font-medium">Dashboard</span>
                          </button>
                        )}
                        <Link
                          href="/profile"
                          onClick={() => setAccountMenuOpen(false)}
                          className="flex items-center gap-3 w-full px-4 py-3 text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors rounded-xl"
                        >
                          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                            <RiUserLine className="text-green-600" />
                          </div>
                          <span className="font-medium">My Profile</span>
                        </Link>
                        <Link

                          href="/orders"
                          onClick={() => setAccountMenuOpen(false)}
                          className="flex items-center gap-3 w-full px-4 py-3 text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors rounded-xl"
                        >
                          <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">

                            <RiShoppingBagLine className="text-yellow-600" />
                          </div>
                          <span className="font-medium">My Orders</span>
                        </Link>
                        <hr className="my-2" />
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 transition-colors rounded-xl"
                        >
                          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                            <RiCloseLine className="text-red-600" />
                          </div>
                          <span className="font-medium">Logout</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6">
                      <div className="text-center mb-4">
                        <div style={{
                          background: themes
                            ? `linear-gradient(${themes.gradient_direction}, ${themes.gradient_start || themes.primary_color}, ${themes.gradient_end || themes.primary_color})`
                            : "linear-gradient(to right, #f97316, #facc15)",
                          color: themes?.text_color || "#fff",
                        }} className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                          <RiUserLine className="text-2xl text-white" />
                        </div>
                        <h3 className="font-semibold text-gray-900">Welcome to Zelton</h3>
                        <p className="text-sm text-gray-500 mt-1">Sign in to access your account</p>
                      </div>
                      <div className="space-y-3">
                        <Link
                          href="/login"
                          style={{
                            background: themes
                              ? `linear-gradient(${themes.gradient_direction}, ${themes.gradient_start || themes.primary_color}, ${themes.gradient_end || themes.primary_color})`
                              : "linear-gradient(to right, #f97316, #facc15)",
                            color: themes?.text_color || "#fff",
                          }}
                          className="block w-full text-center py-3 px-4 rounded-xl font-medium hover:opacity-80 transition-opacity"
                        >
                          Sign In
                        </Link>
                        <Link
                          href="/register"
                          className="block w-full bg-gray-100 text-gray-700 text-center py-3 px-4 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                        >
                          Create Account
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden w-11 h-11 flex items-center justify-center text-gray-600 hover:text-white hover:bg-gradient-to-r hover:from-gray-700 hover:to-gray-900 transition-all duration-300 rounded-xl group"
            >
              <RiMenuLine className="text-xl group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>
      </div >

      {/* Mobile Menu */}
      {
        isMobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-100 shadow-lg animate-in slide-in-from-top-2 duration-300">
            <div className="container mx-auto px-4 py-6">
              {/* Mobile Search */}
              <div className="mb-6">
                <form onSubmit={handleMobileSearchSubmit}>
                  <div className="relative">
                    <input
                      type="text"
                      value={mobileSearchQuery}
                      onChange={(e) => handleMobileSearchChange(e.target.value)}
                      placeholder="Search products..."
                      className="w-full pl-12 pr-10 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-gray-50"
                    />
                    <RiSearchLine className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                    {isSearching && (
                      <RiLoaderLine className="absolute right-4 top-1/2 -translate-y-1/2 text-orange-500 text-lg animate-spin" />
                    )}
                  </div>
                </form>

                {/* Mobile Search Results */}
                {mobileSearchQuery && searchResults.length > 0 && (
                  <div className="mt-4 bg-white border border-gray-200 rounded-xl shadow-lg">
                    <div className="p-4">
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Search Results</div>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {searchResults.slice(0, 5).map((product) => (
                          <div
                            key={product.id}
                            onClick={() => handleProductClick(product.id)}
                            className="flex items-center gap-3 p-2 hover:bg-orange-50 rounded-lg cursor-pointer transition-all"
                          >
                            <div className="w-10 h-10 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg overflow-hidden flex-shrink-0">
                              {product.image_url ? (
                                <img
                                  src={product.image_url}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs font-bold">
                                  {product.name?.charAt(0).toUpperCase() || 'P'}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 text-sm truncate">
                                {product.name}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {product.category?.name}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {mobileSearchQuery && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <button
                            onClick={() => handleMobileSearchSubmit(new Event('submit') as any)}
                            className="text-sm text-orange-600 hover:text-orange-700 font-medium w-full text-center"
                          >
                            View all results →
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Navigation Links */}
              <div className="space-y-2 mb-6">
                <Link
                  href="/"
                  className="flex items-center gap-3 py-3 px-4 text-gray-900 font-medium hover:bg-orange-50 hover:text-orange-600 rounded-xl transition-all"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <span className="text-orange-600 text-sm">🏠</span>
                  </div>
                  Home
                </Link>

                {/* Mobile Categories Dropdown */}
                <div>
                  <button
                    onClick={() => setMobileShopOpen(!isMobileShopOpen)}
                    className="flex items-center justify-between w-full py-3 px-4 text-gray-900 font-medium hover:bg-orange-50 hover:text-orange-600 rounded-xl transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                        <span className="text-orange-600 text-sm">📱</span>
                      </div>
                      Categories
                    </div>
                    <RiArrowDownSLine className={`transition-transform ${isMobileShopOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isMobileShopOpen && (
                    <div className="ml-8 mt-2 space-y-1">
                      {categories.length > 0 ? (
                        categories.map((cat) => (
                          <Link
                            key={cat.id}
                            href={`/categories/subcategories/${cat.id}`}
                            className="block py-2 px-4 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            {cat.name}
                          </Link>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm py-2 px-4">No categories available</p>
                      )}
                    </div>
                  )}
                </div>

                <Link
                  href="/new-arrivals"
                  className="flex items-center gap-3 py-3 px-4 text-gray-900 font-medium hover:bg-orange-50 hover:text-orange-600 rounded-xl transition-all"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <span className="text-yellow-600 text-sm">✨</span>
                  </div>
                  New Arrivals
                </Link>

                <Link
                  href="/sale"
                  className="flex items-center gap-3 py-3 px-4 text-red-600 font-medium hover:bg-red-50 rounded-xl transition-all"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <span className="text-red-600 text-sm">🔥</span>
                  </div>
                  <span className="flex items-center gap-2">
                    Sale
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">HOT</span>
                  </span>
                </Link>

                <Link
                  href="/about_us"
                  className="flex items-center gap-3 py-3 px-4 text-gray-900 font-medium hover:bg-orange-50 hover:text-orange-600 rounded-xl transition-all"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <span className="text-orange-600 text-sm">ℹ️</span>
                  </div>
                  About
                </Link>
              </div>

              {/* Mobile Action Buttons */}
              <div className="space-y-3 pt-4 border-t border-gray-100">
                {!user ? (
                  <div className="space-y-2">
                    <Link
                      href="/login"
                      className="block w-full bg-gradient-to-r from-orange-500 to-yellow-500 text-white text-center py-3 px-4 rounded-xl font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/register"
                      className="block w-full bg-gray-100 text-gray-700 text-center py-3 px-4 rounded-xl font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Create Account
                    </Link>
                  </div>
                ) : (
                  <div className="bg-gradient-to-r from-orange-500 to-yellow-500 rounded-xl p-4 text-white">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/20">
                        {user.profile_picture ? (
                          <img
                            src={`${basePath}/storage/${user.profile_picture}`}
                            alt={user.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-white/20 flex items-center justify-center font-bold">
                            {user.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm opacity-90">{user.email}</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {user.role === 'Admin' && (
                        <button
                          onClick={handleDashboardRedirect}
                          className="w-full bg-white/20 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-white/30 transition-colors"
                        >
                          Dashboard
                        </button>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full bg-red-500/80 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      }
    </header >
  );
};

export default Navbar;