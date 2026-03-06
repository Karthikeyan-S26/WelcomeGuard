import { useEffect, useRef, useCallback } from 'react';
import type { Profile } from '@/types/profile';
import { toast } from 'sonner';
import dynamicVoiceMap from '@/voiceMap.json';

export function useVoiceGreeting(detectedProfile: Profile | null) {
    const lastGreetedIdRef = useRef<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

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
            audioRef.current = null;
        }

        const audioPath = voiceUrl.startsWith('/') ? voiceUrl : '/' + voiceUrl;
        console.log('🎵 Playing voice:', audioPath);
        
        try {
            const audio = new Audio(audioPath);
            audioRef.current = audio;
            
            audio.addEventListener('canplaythrough', () => {
                console.log('✅ Audio ready:', audioPath);
            });
            
            audio.onended = () => {
                console.log('✅ Audio playback completed');
            };
            
            audio.onerror = (e) => {
                console.error('❌ Audio error:', e);
                toast.error('Voice playback error');
            };
            
            audio.play()
                .then(() => {
                    console.log('✅ Voice playback started!');
                })
                .catch(e => {
                    console.error('❌ Play failed:', e.message);
                    // Try with user gesture workaround
                    toast.error('Click anywhere on the page to enable voice');
                });
        } catch (e) {
            console.error('❌ Failed to create audio:', e);
        }
    }, []);

    useEffect(() => {
        if (detectedProfile && detectedProfile.id !== lastGreetedIdRef.current) {
            lastGreetedIdRef.current = detectedProfile.id;
            
            console.log('👤 Face detected:', detectedProfile.name);
            
            // Try to find voice for this person
            const voiceUrl = findVoiceUrl(detectedProfile.name);
            
            if (voiceUrl) {
                console.log('🎤 Playing recorded greeting for:', detectedProfile.name);
                setTimeout(() => {
                    playVoice(voiceUrl);
                }, 500);
            } else {
                console.log('⚠️ No recorded voice for:', detectedProfile.name);
            }
        } else if (!detectedProfile) {
            lastGreetedIdRef.current = null;
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
