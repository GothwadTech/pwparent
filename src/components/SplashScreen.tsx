import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { PWLogo } from './PWLogo';

interface SplashScreenProps {
  onContinue: () => void;
  customLogoUrl: string | null;
  onOpenLogoCustomizer: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onContinue,
  customLogoUrl,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onContinue();
    }, 2800);
    return () => clearTimeout(timer);
  }, [onContinue]);

  return (
    <div
      onClick={onContinue}
      className="relative w-full h-full min-h-full bg-[#005677] flex flex-col items-center justify-center overflow-hidden select-none cursor-pointer"
    >
      {/* Main Center Content: PW Emblem + Family Silhouette */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="flex flex-col items-center"
      >
        <div className="text-white">
          <PWLogo
            size={76}
            customLogoUrl={customLogoUrl}
            showFamily={true}
          />
        </div>
      </motion.div>
    </div>
  );
};
