import { useEffect, useRef, useCallback } from 'react';
import type { Profile } from '@/types/profile';
import dynamicVoiceMap from '@/voiceMap.json';

export function useVoiceGreeting(detectedProfile: Profile | null) {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const lastPlayedTimeRef = useRef<number>(0);

    // Helper function to find voice by name
    const findVoiceUrl = useCallback((name: string): string | null => {
        const voiceMap: Record<string, string> = dynamicVoiceMap;
        const nameLower = name.toLowerCase().trim();
        
        console.log('🔍 Looking for voice:', nameLower);
        
        // Direct match
        if (voiceMap[nameLower]) {
            console.log('✅ Found direct voice match:', nameLower, '→', voiceMap[nameLower]);
            return voiceMap[nameLower];
        }
        
        // Check if any key in voiceMap matches part of the name
        for (const [key, value] of Object.entries(voiceMap)) {
            if (nameLower.includes(key.toLowerCase()) || key.toLowerCase().includes(nameLower)) {
                console.log('✅ Found partial voice match:', key, '→', value);
                return value;
            }
        }
        
        console.log('❌ No voice found for:', nameLower);
        return null;
    }, []);

    const playVoice = useCallback((voiceUrl: string) => {
        // Stop any currently playing audio
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current = null;
        }

        const audioPath = voiceUrl.startsWith('/') ? voiceUrl : '/' + voiceUrl;
        console.log('🎵 Attempting to play:', audioPath);
        
        const audio = new Audio(audioPath);
        audioRef.current = audio;
        audio.volume = 1.0;
        
        audio.onloadeddata = () => {
            console.log('✅ Audio loaded successfully');
        };
        
        audio.onplay = () => {
            console.log('▶️ Audio is playing!');
        };
        
        audio.onended = () => {
            console.log('✅ Audio playback completed');
        };
        
        audio.onerror = (e) => {
            console.error('❌ Audio error:', e);
        };
        
        // Try to play
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    console.log('✅ Voice playback started successfully!');
                })
                .catch(err => {
                    console.error('❌ Play failed:', err.name, err.message);
                });
        }
    }, []);

    useEffect(() => {
        if (detectedProfile) {
            const now = Date.now();
            // Play voice every time face is detected (with 3 second cooldown to avoid spam)
            if (now - lastPlayedTimeRef.current > 3000) {
                lastPlayedTimeRef.current = now;
                
                console.log('👤 Face detected:', detectedProfile.name);
                
                // Try to find voice for this person
                const voiceUrl = findVoiceUrl(detectedProfile.name);
                
                if (voiceUrl) {
                    console.log('🎤 Playing recorded greeting for:', detectedProfile.name);
                    playVoice(voiceUrl);
                } else {
                    console.log('⚠️ No recorded voice for:', detectedProfile.name);
                }
            }
        }
    }, [detectedProfile, findVoiceUrl, playVoice]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);
}
