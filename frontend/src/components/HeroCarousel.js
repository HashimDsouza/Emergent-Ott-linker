import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { FaYoutube, FaReddit } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { toast } from "sonner";
import { openOTTApp, openSocialLink } from "@/utils/deepLinking";

const HeroCarousel = ({ launches }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (!launches || launches.length === 0) return;

    const timer = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(timer);
  }, [currentIndex, launches]);

  const nextSlide = () => {
    if (isTransitioning || !launches || launches.length === 0) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev + 1) % launches.length);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const prevSlide = () => {
    if (isTransitioning || !launches || launches.length === 0) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev - 1 + launches.length) % launches.length);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const goToSlide = (index) => {
    if (isTransitioning || !launches || launches.length === 0) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const handleSlideClick = (launch) => {
    toast.info(`Opening ${launch.platform}...`, {
      description: "Taking you to the content",
      duration: 2000
    });
    openOTTApp(launch.platform, launch.platform_content_id, launch.title);
  };

  if (!launches || launches.length === 0) {
    return null;
  }

  const currentLaunch = launches[currentIndex];

  return (
    <section className="relative w-full h-[500px] sm:h-[600px] overflow-hidden cursor-pointer" data-testid="hero-carousel" onClick={() => handleSlideClick(currentLaunch)}>
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img
          src={currentLaunch.thumbnail}
          alt={currentLaunch.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/80 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0f]/90 via-transparent to-[#0a0a0f]/90"></div>
      </div>

      {/* Content */}
      <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-end pb-16">
        <div className="max-w-2xl space-y-4">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#ff6b35]/20 to-[#ffa500]/20 border border-[#ff6b35]/30 backdrop-blur-sm">
            <span className="text-sm font-semibold text-[#ff6b35]" style={{ fontFamily: 'Inter, sans-serif' }}>
              🔥 HOT DROP #{currentIndex + 1}
            </span>
          </div>

          {/* Title */}
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {currentLaunch.title}
          </h2>

          {/* Tagline */}
          {currentLaunch.tagline && (
            <p className="text-xl sm:text-2xl text-[#ff6b35] font-medium italic" style={{ fontFamily: 'Inter, sans-serif' }}>
              "{currentLaunch.tagline}"
            </p>
          )}

          {/* Description */}
          <p className="text-base sm:text-lg text-gray-300 max-w-xl" style={{ fontFamily: 'Inter, sans-serif' }}>
            {currentLaunch.description}
          </p>

          {/* Meta Info */}
          <div className="flex items-center gap-4">
            <span className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-sm font-semibold text-white border border-white/20">
              {currentLaunch.platform}
            </span>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-[#ffa500] fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-lg font-bold text-white">{currentLaunch.rating}</span>
            </div>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-3 pt-2">
            <span className="text-sm text-gray-400 font-medium">Why Watch:</span>
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openSocialLink('youtube', currentLaunch.title, currentLaunch.social_links?.youtube);
                }}
                className="w-10 h-10 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center hover:bg-red-500/30 transition-colors"
              >
                <FaYoutube className="w-5 h-5 text-red-500" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openSocialLink('twitter', currentLaunch.title, currentLaunch.social_links?.twitter);
                }}
                className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <FaXTwitter className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openSocialLink('reddit', currentLaunch.title, currentLaunch.social_links?.reddit);
                }}
                className="w-10 h-10 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center hover:bg-orange-500/30 transition-colors"
              >
                <FaReddit className="w-5 h-5 text-orange-500" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          prevSlide();
        }}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all z-10"
        data-testid="carousel-prev"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          nextSlide();
        }}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all z-10"
        data-testid="carousel-next"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Dot Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10" data-testid="carousel-dots">
        {launches.map((_, index) => (
          <button
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              goToSlide(index);
            }}
            className={`transition-all duration-300 rounded-full ${
              index === currentIndex
                ? "w-8 h-3 bg-gradient-to-r from-[#ff6b35] to-[#ffa500]"
                : "w-3 h-3 bg-white/30 hover:bg-white/50"
            }`}
            data-testid={`carousel-dot-${index}`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroCarousel;