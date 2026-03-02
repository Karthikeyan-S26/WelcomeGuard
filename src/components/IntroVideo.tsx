import { useState, useRef } from 'react';
import introVideo from '@/assets/intro-video.mp4';

interface IntroVideoProps {
  onComplete: () => void;
}

export function IntroVideo({ onComplete }: IntroVideoProps) {
  const [fading, setFading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleEnd = () => {
    setFading(true);
    setTimeout(onComplete, 600);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black transition-opacity duration-600 ${fading ? 'opacity-0' : 'opacity-100'}`}
    >
      <video
        ref={videoRef}
        src={introVideo}
        autoPlay
        muted
        playsInline
        onEnded={handleEnd}
        className="h-full w-full object-cover"
      />
      <button
        onClick={onComplete}
        className="absolute bottom-8 right-8 text-xs text-white/40 hover:text-white/70 transition-colors"
      >
        Skip
      </button>
    </div>
  );
}
