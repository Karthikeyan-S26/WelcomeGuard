import { useEffect, useRef, useCallback } from 'react';
import type { Profile } from '@/types/profile';
import dynamicVoiceMap from '@/voiceMap.json';

// Singleton audio element for better browser compatibility
let globalAudio: HTMLAudioElement | null = null;

export function useVoiceGreeting(detectedProfile: Profile | null, audioUnlocked: boolean) {
    const lastPlayedTimeRef = useRef<number>(0);
    const lastNameRef = useRef<string>('');

    // Helper function to find voice by name
    const findVoiceUrl = useCallback((name: string): string | null => {
        const voiceMap: Record<string, string> = dynamicVoiceMap;
        const nameLower = name.toLowerCase().trim();
        
        console.log('🔍 Looking for voice:', nameLower);
        
        // Direct match
        if (voiceMap[nameLower]) {
            console.log('✅ Direct match:', voiceMap[nameLower]);
            return voiceMap[nameLower];
        }
        
        // Check partial matches
        for (const [key, value] of Object.entries(voiceMap)) {
            if (nameLower.includes(key.toLowerCase()) || key.toLowerCase().includes(nameLower)) {
                console.log('✅ Partial match:', key, '→', value);
                return value;
            }
        }
        
        console.log('❌ No voice for:', nameLower);
        return null;
    }, []);

    const playVoice = useCallback((voiceUrl: string) => {
        // Stop any existing audio
        if (globalAudio) {
            globalAudio.pause();
            globalAudio.currentTime = 0;
        }

        const audioPath = voiceUrl.startsWith('/') ? voiceUrl : '/' + voiceUrl;
        console.log('🎵 Playing:', audioPath);
        
        // Create or reuse audio element
        if (!globalAudio) {
            globalAudio = new Audio();
        }
        globalAudio.src = audioPath;
        globalAudio.volume = 1.0;
        
        globalAudio.play()
            .then(() => console.log('▶️ Playing!'))
            .catch(err => console.error('❌ Play failed:', err.message));
    }, []);

    useEffect(() => {
        if (!detectedProfile || !audioUnlocked) {
            if (!audioUnlocked && detectedProfile) {
                console.log('⚠️ Click page to enable voice!');
            }
            return;
        }

        const now = Date.now();
        const name = detectedProfile.name;
        
        // Play on new detection or after 3 second cooldown
        const isNewPerson = lastNameRef.current !== name;
        const cooldownPassed = now - lastPlayedTimeRef.current > 3000;
        
        if (isNewPerson || cooldownPassed) {
            lastPlayedTimeRef.current = now;
            lastNameRef.current = name;
            
            console.log('👤 Detected:', name);
            
            const voiceUrl = findVoiceUrl(name);
            if (voiceUrl) {
                playVoice(voiceUrl);
            }
        }
    }, [detectedProfile, audioUnlocked, findVoiceUrl, playVoice]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (globalAudio) {
                globalAudio.pause();
            }
        };
    }, []);
}
