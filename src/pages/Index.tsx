import { useEffect, useRef, useState } from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { CameraFeed } from '@/components/CameraFeed';
import { ProfileCard } from '@/components/ProfileCard';
import { WelcomeBanner } from '@/components/WelcomeBanner';
import { useFaceDetection } from '@/hooks/useFaceDetection';
import { useProfiles } from '@/hooks/useProfiles';
import { useVoiceGreeting } from '@/hooks/useVoiceGreeting';

const Index = () => {
  const { data: profiles = [] } = useProfiles();
  const { videoRef, canvasRef, modelsLoaded, detectedPerson, cameraError, clearDetection } =
    useFaceDetection(profiles);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  
  // Voice greeting when face is detected
  useVoiceGreeting(detectedPerson?.profile ?? null, audioUnlocked);
  
  const hideTimerRef = useRef<number | null>(null);

  // Unlock audio on first user interaction
  useEffect(() => {
    const unlockAudio = () => {
      if (!audioUnlocked) {
        // Create and play a silent audio to unlock
        const silentAudio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=');
        silentAudio.play().then(() => {
          console.log('🔊 Audio unlocked!');
          setAudioUnlocked(true);
        }).catch(() => {
          console.log('⚠️ Audio still locked, click to unlock');
        });
      }
    };

    document.addEventListener('click', unlockAudio);
    document.addEventListener('touchstart', unlockAudio);
    
    return () => {
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };
  }, [audioUnlocked]);

  // Auto-clear detection after 8s
  useEffect(() => {
    if (detectedPerson) {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      hideTimerRef.current = window.setTimeout(() => {
        clearDetection();
      }, 8000);
    }

    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [detectedPerson, clearDetection]);

  return (
    <>
      <div className="flex min-h-screen flex-col bg-background">
        <WelcomeBanner name={detectedPerson?.profile.name ?? null} />
        <DashboardHeader />

        <main className="flex flex-1 gap-4 p-4">
          {/* Left — Camera (60%) */}
          <section className="flex-[3] min-h-[500px]">
            <CameraFeed
              videoRef={videoRef}
              canvasRef={canvasRef}
              modelsLoaded={modelsLoaded}
              cameraError={cameraError}
            />
          </section>

          {/* Right — Profile (40%) */}
          <aside className="flex-[2] flex flex-col gap-4">
            <ProfileCard profile={detectedPerson?.profile ?? null} />
          </aside>
        </main>

        {/* Footer stats bar */}
        <footer className="flex items-center justify-between border-t border-border bg-card px-6 py-2 text-xs text-muted-foreground">
          <span>Registered Profiles: {profiles.length}</span>
          <span>Status: {modelsLoaded ? '● System Active' : '○ Loading...'}</span>
          <span className={audioUnlocked ? 'text-green-500' : 'text-yellow-500'}>
            {audioUnlocked ? '🔊 Voice Ready' : '🔇 Click to enable voice'}
          </span>
        </footer>
      </div>
    </>
  );
};

export default Index;
