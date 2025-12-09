"use client";

import React, { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import imgPlaceholder from "@/public/imagePlaceholder.png";
import axios from "../../../utils/axios";
import Testimonials from "./Testimonials/page";
import CategorySlider from "./categories/CategorySlider";
import ProductSlider from "./products/ProductSlider";
import PopularProductsSlider from "./Popular_Products/PopularProductsSlider";
import Contact_Us from "./contact_us/page";
import { fetchThemes } from "../../../utils/theme";
type Themes = {
  id: number;
  background_color: string;
  text_color: string;
  primary_color: string;
  gradient_start?: string | null;
  gradient_end?: string | null;
  gradient_direction: string;
};
type Variant = {
  id: number;
  title: string;
  mrp: string;
  sp: string;
  stock: number;
  image_url: string | null;
  image_json?: string;
};

type Product = {
  id: number;
  name: string;
  description?: string;
  image_url: string | null;
  variants: Variant[];
};

type Slider = {
  id: number;
  title: string;
  link?: string;
  description: string;
  image: string;
  status: boolean;
};


export default function HomeUI() {
  const [themes, setThemes] = useState<Themes | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [sliders, setSliders] = useState<Slider[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const ytIframeRef = React.useRef<HTMLIFrameElement>(null);
  const router = useRouter();

  const baseUrl = process.env.NEXT_PUBLIC_UPLOAD_BASE || "http://localhost:8000";

  useEffect(() => {
    fetchProducts();
  }, []);
  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const data = await fetchThemes();
      if (Array.isArray(data) && data.length > 0) {
        const latest = data[data.length - 1];
        setThemes(latest);
      } else {
        setErrorMessage("No themes available");
      }
    } catch {
      setErrorMessage("Failed to fetch theme. Please try again.");
    }
  };

  const fetchSliders = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/sliders`);
      if (Array.isArray(res.data)) {
        setSliders(res.data);
      } else if (res.data.success && Array.isArray(res.data.data)) {
        setSliders(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch sliders", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSliders();
  }, []);

  useEffect(() => {
    if (sliders.length === 0 || isVideoPlaying) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % sliders.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [sliders, isVideoPlaying]);

  useEffect(() => {
    const currentSlide = sliders.length > 0 ? sliders[currentIndex] : null;
    const isYouTubeVideo = currentSlide?.link && (currentSlide.link.includes("youtube.com") || currentSlide.link.includes("youtu.be"));
    if (!isYouTubeVideo) return;
    let player: any = null;
    function onPlayerStateChange(event: any) {
      if (event.data === 1) setIsVideoPlaying(true);
      if (event.data === 2) setIsVideoPlaying(false);
    }
    function onYouTubeIframeAPIReady() {
      const iframe = ytIframeRef.current;
      if (iframe && (window as any).YT && (window as any).YT.Player) {
        player = new (window as any).YT.Player(iframe, {
          events: {
            'onStateChange': onPlayerStateChange
          }
        });
      }
    }
    if (!(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
      (window as any).onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
    } else {
      onYouTubeIframeAPIReady();
    }
    return () => {
      if (player && player.destroy) player.destroy();
    };
  }, [currentIndex, sliders]);

  const handleSlideChange = (index: number) => {
    if (index === currentIndex) return;
    setCurrentIndex(index);
  };

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      setCurrentIndex((prev) => (prev + 1) % sliders.length);
    } else if (isRightSwipe) {
      setCurrentIndex((prev) => (prev === 0 ? sliders.length - 1 : prev - 1));
    }
  };

  const currentSlide = sliders.length > 0 ? sliders[currentIndex] : null;

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/products`);
      if (res.data.success) {
        const data = res.data.data.map((prod: Product) => {
          let productImage = prod.image_url
            ? `${baseUrl}${prod.image_url}`
            : prod.variants[0]?.image_url
              ? `${baseUrl}${prod.variants[0].image_url}`
              : imgPlaceholder.src;

          return {
            ...prod,
            image_url: productImage,
            variants: prod.variants.map((v) => ({
              ...v,
              image_url: v.image_url ? `${baseUrl}${v.image_url}` : null,
              image_json: v.image_json
                ? JSON.parse(v.image_json).map((img: string) => `${baseUrl}${img}`)
                : [],
            })),
          };
        });
        setProducts(data);
      }
    } catch (error) {
      console.error("Failed to fetch products", error);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div>
      <section
        className="hero-section relative bg-gray-50 h-[60vh] sm:h-[70vh] md:h-[80vh] lg:h-[90vh] overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {loading ? (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-300 to-gray-200 animate-pulse" />
            <div className="absolute inset-0 bg-gradient-to-r from-gray-800/40 to-gray-600/20" />
            <div className="container mx-auto px-3 sm:px-4 h-full flex items-center justify-start relative z-10">
              <div className="max-w-xs sm:max-w-md md:max-w-lg px-4 sm:px-6 md:px-8 space-y-3 sm:space-y-4 md:space-y-6">
                <div className="space-y-2 sm:space-y-3">
                  <div className="h-6 sm:h-7 md:h-8 bg-white/20 rounded-lg animate-pulse w-4/5" />
                  <div className="h-6 sm:h-7 md:h-8 bg-white/15 rounded-lg animate-pulse w-3/4" />
                  <div className="h-5 sm:h-6 bg-white/10 rounded-lg animate-pulse w-2/3" />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <div className="h-3 sm:h-4 bg-white/15 rounded animate-pulse w-full" />
                  <div className="h-3 sm:h-4 bg-white/10 rounded animate-pulse w-4/5" />
                  <div className="h-3 sm:h-4 bg-white/10 rounded animate-pulse w-3/4" />
                </div>
                <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4 pt-2 sm:pt-3 md:pt-4">
                  <div className="h-9 sm:h-10 md:h-12 w-24 sm:w-28 md:w-32 bg-white/20 rounded-full animate-pulse" />
                  <div className="h-9 sm:h-10 md:h-12 w-28 sm:w-32 md:w-36 bg-white/10 rounded-full animate-pulse border-2 border-white/20" />
                </div>
              </div>
            </div>
            <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 flex items-center space-x-2 sm:space-x-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div
                  key={idx}
                  className={`transition-all duration-300 animate-pulse ${idx === 0
                    ? "w-6 sm:w-8 h-2 sm:h-3 bg-white/30 rounded-full"
                    : "w-2 sm:w-3 h-2 sm:h-3 bg-white/20 rounded-full"
                    }`}
                />
              ))}
            </div>
            <div className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-white/10 backdrop-blur-sm rounded-full animate-pulse" />
            <div className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-white/10 backdrop-blur-sm rounded-full animate-pulse" />
          </>
        ) : (
          <>
            <div className="absolute inset-0">
              {sliders.map((slide, idx) => {
                const slideImageUrl = `${baseUrl}${slide.image}`;
                const isYouTubeVideo = slide.link && (slide.link.includes("youtube.com") || slide.link.includes("youtu.be"));
                // Extract YouTube video ID for embed
                let youtubeEmbedUrl = "";
                if (isYouTubeVideo && slide.link) {
                  const match = slide.link.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]+)/);
                  youtubeEmbedUrl = match ? `https://www.youtube.com/embed/${match[1]}` : slide.link.replace("watch?v=", "embed/");
                }
                return (
                  <div
                    key={slide.id}
                    className={`absolute inset-0 flex items-center justify-center transition-all duration-1000 ${idx === currentIndex
                      ? 'opacity-100 scale-100'
                      : 'opacity-0 scale-105'
                      }`}
                  >
                    <div
                      className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                      style={{ backgroundImage: `url(${slideImageUrl})` }}
                    />
                  </div>
                );
              })}
            </div>

            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/20 sm:from-black/60 sm:to-black/30" />

            <div className="container mx-auto px-3 sm:px-4 h-full flex items-center justify-center sm:justify-start relative z-10">
              <div
                key={currentIndex}
                className="w-full flex flex-col md:flex-row items-center justify-center md:justify-between animate-fade-in-up"
              >
                {/* Left: Title and Description */}
                <div className="flex-1 px-4 sm:px-6 md:px-8 text-center md:text-left">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 sm:mb-3 md:mb-4 leading-tight">
                    {currentSlide?.title || "Welcome to Our Store"}
                  </h1>
                  <p className="text-sm sm:text-base md:text-lg text-gray-200 mb-4 sm:mb-6 md:mb-8 leading-relaxed line-clamp-2 sm:line-clamp-3">
                    {currentSlide?.description || "Discover premium quality fashion for 2025."}
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-2 sm:gap-3 md:gap-4">
                    <button
                      onClick={() => router.push('/products')}
                      style={{
                        background: themes
                          ? `linear-gradient(${themes.gradient_direction}, ${themes.gradient_start || themes.primary_color}, ${themes.gradient_end || themes.primary_color})`
                          : "linear-gradient(to right, #f97316, #facc15)",
                        color: themes?.text_color || "#fff",
                      }}
                      className="w-full sm:w-auto py-2 sm:py-2.5 md:py-3 px-5 sm:px-6 text-sm sm:text-base font-semibold rounded-full transition-all duration-300 hover:scale-105 hover:shadow-lg whitespace-nowrap"
                    >
                      Shop Now
                    </button>
                    <button
                      onClick={() => router.push('/categories')}
                      className="w-full sm:w-auto py-2 sm:py-2.5 md:py-3 px-5 sm:px-6 bg-transparent text-white text-sm sm:text-base font-semibold rounded-full border-2 border-white hover:bg-white hover:text-gray-800 transition-all duration-300 hover:scale-105 whitespace-nowrap"
                    >
                      Explore Collection
                    </button>
                  </div>
                </div>
                {/* Right: YouTube video preview with play/pause detection */}
                {currentSlide?.link && (currentSlide.link.includes("youtube.com") || currentSlide.link.includes("youtu.be")) && (() => {
                  const match = currentSlide.link.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]+)/);
                  const youtubeEmbedUrl = match ? `https://www.youtube.com/embed/${match[1]}?enablejsapi=1` : currentSlide.link.replace("watch?v=", "embed/") + "?enablejsapi=1";
                  return (
                    <>
                      {/* Desktop: right side, large */}
                      <div className="hidden md:flex flex-1 items-center justify-center md:justify-end px-4 sm:px-6 md:px-8 mt-6 md:mt-0">
                        <div className="w-80 h-44 sm:w-96 sm:h-56 md:w-[480px] md:h-[270px] rounded-xl overflow-hidden shadow-2xl border border-white/80 bg-black/80 flex items-center justify-center">
                          <iframe
                            ref={ytIframeRef}
                            className="w-full h-full"
                            src={youtubeEmbedUrl}
                            title={currentSlide.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      </div>
                      {/* Mobile: bottom right, small */}
                      <div className="md:hidden">
                        <div className="absolute bottom-52 right-4 w-40 h-24 rounded-md overflow-hidden shadow-lg border border-white/70 bg-black z-50 flex items-center justify-center">
                          <iframe
                            ref={ytIframeRef}
                            className="w-full h-full"
                            src={youtubeEmbedUrl}
                            title={currentSlide.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 flex items-center space-x-2 sm:space-x-3">
              {sliders.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSlideChange(idx)}
                  className={`relative transition-all duration-300 hover:scale-110 ${idx === currentIndex
                    ? "w-6 sm:w-8 h-2 sm:h-3 bg-white rounded-full"
                    : "w-2 sm:w-3 h-2 sm:h-3 bg-white/50 rounded-full hover:bg-white/70"
                    }`}
                  aria-label={`Go to slide ${idx + 1}`}
                >
                  {idx === currentIndex && (
                    <div className="absolute inset-0 bg-white rounded-full animate-pulse" />
                  )}
                </button>
              ))}
            </div>

            {sliders.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentIndex(currentIndex === 0 ? sliders.length - 1 : currentIndex - 1)}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all duration-300 hover:scale-110 z-20"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentIndex((currentIndex + 1) % sliders.length)}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all duration-300 hover:scale-110 z-20"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
          </>
        )}
      </section>
      <CategorySlider />
      <ProductSlider />
      <PopularProductsSlider />
      <Testimonials />
      <Contact_Us />
    </div>
  );
}