import React, { memo, useState, useEffect } from 'react';
import { Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { BRAND, brandedText } from '../brand';

const Hero: React.FC = () => {
  const { siteSettings } = useSiteSettings();
  const [currentSlide, setCurrentSlide] = useState(0);

  const heroImages = siteSettings?.hero_slides && siteSettings.hero_slides.length > 0
    ? siteSettings.hero_slides
    : siteSettings?.hero_image
      ? [{ url: siteSettings.hero_image }, ...BRAND.heroSlides.slice(1)]
      : BRAND.heroSlides;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroImages.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroImages.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroImages.length) % heroImages.length);
  };

  const tagline = brandedText(siteSettings?.site_tagline, BRAND.tagline);
  const description = brandedText(siteSettings?.site_description, BRAND.description);

  return (
    <section className="relative min-h-[520px] md:h-[560px] flex flex-col md:flex-row overflow-hidden bg-black">
      <div className="w-full md:w-1/2 flex items-center justify-center px-8 py-12 md:py-0 z-20 order-2 md:order-1 bg-black">
        <div className="max-w-xl text-center md:text-left">
          <p className="text-[10px] uppercase tracking-[0.5em] text-teamax-gold mb-3">Classified Coffee House</p>
          <h1 className="font-display font-bold mb-2 animate-fade-in tracking-[0.28em] text-teamax-gold text-4xl md:text-6xl leading-none">
            MISSION
          </h1>
          <div className="gold-rule my-3 max-w-xs mx-auto md:mx-0">
            <span className="font-script italic text-3xl md:text-4xl text-teamax-gold tracking-[0.2em]">007</span>
          </div>
          <p className="text-sm md:text-base uppercase tracking-[0.28em] text-teamax-primary mb-4">
            {tagline}
          </p>
          <p className="text-sm md:text-base mb-8 text-teamax-secondary animate-slide-up font-sans leading-relaxed">
            {description}
          </p>

          <div className="inline-flex items-center gap-4 px-5 py-2.5 bg-black/40 backdrop-blur-md rounded-none border border-teamax-gold/40 animate-fade-in shadow-gold">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-teamax-gold rounded-full shadow-[0_0_8px_rgba(212,175,55,0.8)]"></div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-teamax-gold">Open Daily</span>
            </div>
            <div className="w-px h-4 bg-teamax-gold/40"></div>
            <div className="flex items-center gap-2 text-teamax-primary font-bold text-[10px] uppercase tracking-widest">
              <Clock className="w-3.5 h-3.5 text-teamax-gold" />
              <span>{siteSettings?.store_hours || '06:00 AM - 10:00 PM'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full md:w-1/2 relative h-[280px] md:h-auto order-1 md:order-2 overflow-hidden">
        {heroImages.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
          >
            <div
              className={`absolute inset-0 bg-cover bg-center transition-transform duration-[5000ms] ease-linear ${index === currentSlide ? 'scale-100' : 'scale-110'}`}
              style={{
                '--bg-image': `url(${slide.url})`
              } as React.CSSProperties}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-black/20" />
            <div className="absolute inset-0 ring-1 ring-inset ring-teamax-gold/20" />
          </div>
        ))}

        <div className="absolute inset-0 z-30 flex items-center justify-between px-4 pointer-events-none">
          <button
            onClick={prevSlide}
            className="p-3 rounded-full bg-black/50 hover:bg-teamax-gold hover:text-black backdrop-blur-md transition-all text-teamax-gold border border-teamax-gold/40 pointer-events-auto group"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <button
            onClick={nextSlide}
            className="p-3 rounded-full bg-black/50 hover:bg-teamax-gold hover:text-black backdrop-blur-md transition-all text-teamax-gold border border-teamax-gold/40 pointer-events-auto group"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 md:left-auto md:right-10 md:translate-x-0 z-30 flex gap-2">
          {heroImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-1.5 transition-all duration-300 ${index === currentSlide ? 'bg-teamax-gold w-8' : 'bg-white/30 w-4 hover:bg-teamax-gold/60'}`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default memo(Hero);
