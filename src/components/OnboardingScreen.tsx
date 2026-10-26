import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppHeader } from './AppHeader';
import { IllustrationStudyProgress } from './illustrations/IllustrationStudyProgress';
import { IllustrationSubjectAnalysis } from './illustrations/IllustrationSubjectAnalysis';

interface OnboardingScreenProps {
  onComplete: () => void;
  customLogoUrl?: string | null;
  onOpenLogoCustomizer: () => void;
  initialSlide?: number;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  onComplete,
  customLogoUrl,
  onOpenLogoCustomizer,
  initialSlide = 0,
}) => {
  const [slide, setSlide] = useState(initialSlide);

  const slides = [
    {
      title: "Track your child's Progress",
      description:
        "Track progress of your child's Lecture Videos, Attendance, DPPs and Test Series at one place.",
      illustration: <IllustrationStudyProgress />,
    },
    {
      title: 'Get Subject Wise Analysis',
      description:
        "Detailed subject-wise performance analysis is now available for both Tests and DPP's providing students a better understanding of their strengths and weaknesses.",
      illustration: <IllustrationSubjectAnalysis />,
    },
  ];

  const handleNext = () => {
    if (slide < slides.length - 1) {
      setSlide(slide + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="relative w-full h-full min-h-full bg-[#0a0b10] text-white flex flex-col justify-between overflow-hidden select-none">
      {/* App Header: PW Logo + Parent's App */}
      <AppHeader
        customLogoUrl={customLogoUrl}
        onLogoClick={onOpenLogoCustomizer}
      />

      {/* Main Slide Carousel Area */}
      <div className="flex-1 flex flex-col justify-center px-6 pt-4 pb-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="flex flex-col"
          >
            {/* Top Illustration with generous padding */}
            <div className="w-full flex items-center justify-center my-4">
              {slides[slide].illustration}
            </div>

            {/* Content Text */}
            <div className="mt-8">
              <h1 className="text-[26px] sm:text-[28px] font-bold text-white tracking-tight leading-snug">
                {slides[slide].title}
              </h1>
              <p className="mt-3 text-[#9ca3af] text-[15px] leading-relaxed max-w-[340px]">
                {slides[slide].description}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Area: Carousel Indicators + Get Started CTA Button */}
      <div className="w-full px-5 pb-8 pt-4 flex flex-col items-center">
        {/* Carousel Pagination Dots */}
        <div className="flex items-center space-x-2 mb-7">
          {slides.map((_, idx) => {
            const isActive = slide === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSlide(idx)}
                aria-label={`Slide ${idx + 1}`}
                className={`transition-all duration-300 rounded-full h-2 ${
                  isActive
                    ? 'w-7 bg-[#6b7280]'
                    : 'w-2 bg-[#272938] hover:bg-[#3b3e54]'
                }`}
              />
            );
          })}
        </div>

        {/* Get Started Button (PW exact lavender/light purple) */}
        <button
          type="button"
          onClick={handleNext}
          className="w-full py-4 rounded-xl bg-[#D4C7FF] hover:bg-[#c6b6fc] active:bg-[#b8a4f9] text-[#111218] font-bold text-[16px] text-center tracking-tight transition-all duration-150 active:scale-[0.99] shadow-lg shadow-purple-950/20"
        >
          Get Started
        </button>
      </div>
    </div>
  );
};
