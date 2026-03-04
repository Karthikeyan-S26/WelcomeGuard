/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useRef, useCallback } from 'react';
import type { Profile } from '@/types/profile';
import { toast } from 'sonner';

export type ChatMessage = {
    id: string;
    role: 'user' | 'assistant';
    content: string;
};

export type AssistantStatus = 'idle' | 'listening' | 'thinking' | 'speaking';

const WAKE_WORD = 'hey nova';
const SYSTEM_PROMPT = `You are Nova, the official AI assistant for the Information Technology Department. Answer questions about the department, courses, staff, research, labs, and placements clearly and professionally in a friendly and professional tone. Keep answers concise.`;

export function useVoiceAssistant(detectedProfile: Profile | null) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [status, setStatus] = useState<AssistantStatus>('idle');

    // Track continuous listening
    const recognitionRef = useRef<any>(null);
    const synthRef = useRef<SpeechSynthesis | null>(null);
    const isListeningRef = useRef(false);
    const [error, setError] = useState<string | null>(null);

    // Profile-based greeting tracking
    const hasGreetedProfileRef = useRef<string | null>(null);

    // Initialize Speech Recognition & Synthesis
    useEffect(() => {
        if (typeof window !== 'undefined') {
            synthRef.current = window.speechSynthesis;
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

            if (SpeechRecognition) {
                recognitionRef.current = new SpeechRecognition();
                recognitionRef.current.continuous = false; // We use false so it stops after a phrase
                recognitionRef.current.interimResults = false;
                recognitionRef.current.lang = 'en-US';

                recognitionRef.current.onstart = () => {
                    isListeningRef.current = true;
                    // Only show 'listening' if we actually pressed the button, otherwise we might be silently waiting for wake word
                    // We will manage status manually below
                };

                recognitionRef.current.onresult = (event: any) => {
                    const transcript = event.results[0][0].transcript.trim();
                    handleSpeechResult(transcript);
                };

                recognitionRef.current.onerror = (event: any) => {
                    if (event.error !== 'no-speech' && event.error !== 'aborted') {
                        console.error('Speech recognition error:', event.error);
                    }
                    isListeningRef.current = false;
                    if (status === 'listening') {
                        setStatus('idle');
                    }
                };

                recognitionRef.current.onend = () => {
                    isListeningRef.current = false;
                    // If we manually started listening for a single query and it ended
                    if (status === 'listening') {
                        setStatus('idle');
                    }
                };
            } else {
                setError('Speech recognition not supported in this browser.');
            }
        }

        return () => {
            stopSpeaking();
            if (recognitionRef.current && isListeningRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    const stopSpeaking = () => {
        if (synthRef.current && synthRef.current.speaking) {
            synthRef.current.cancel();
        }
        if (status === 'speaking') {
            setStatus('idle');
        }
    };

    const speakResponse = useCallback((text: string) => {
        if (!synthRef.current) return;
        stopSpeaking();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        setStatus('speaking');

        utterance.onend = () => {
            setStatus('idle');
        };

        utterance.onerror = () => {
            setStatus('idle');
        };

        synthRef.current.speak(utterance);
    }, []);

    // Profile auto-greeting
    useEffect(() => {
        if (detectedProfile) {
            // Don't greet if we already greeted this exact person this session
            if (hasGreetedProfileRef.current !== detectedProfile.id) {
                hasGreetedProfileRef.current = detectedProfile.id;

                let greeting = '';
                if (detectedProfile.role_type === 'staff') {
                    greeting = `Hello Professor ${detectedProfile.name}. How can I assist you today?`;
                } else {
                    greeting = `Hello ${detectedProfile.name}. How can I assist you today?`;
                }

                setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: greeting }]);
                speakResponse(greeting);
            }
        } else {
            // Profile cleared, reset greeted stat so they can be greeted again if they return 
            // (optional depending on UX preference)
            // hasGreetedProfileRef.current = null;
        }
    }, [detectedProfile, speakResponse]);


    const sendToLLM = async (userText: string) => {
        setStatus('thinking');

        try {
            // Use Gemini API directly
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            if (!apiKey) {
                toast.error('Gemini API Key missing', {
                    description: 'Please add VITE_GEMINI_API_KEY to your .env file'
                });
                const fallbackMsg = "I am unable to process your request because my AI key is missing.";
                setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: fallbackMsg }]);
                speakResponse(fallbackMsg);
                return;
            }

            // Format previous conversation history for context
            const contents = [
                {
                    role: "user",
                    parts: [{ text: SYSTEM_PROMPT }]
                },
                {
                    role: "model",
                    parts: [{ text: "Understood. I am Nova, the IT Department Assistant." }]
                }
            ];

            // Add recent messages to retain context (last 6 messages)
            const recentMessages = messages.slice(-6);
            recentMessages.forEach(msg => {
                contents.push({
                    role: msg.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: msg.content }]
                });
            });

            // Add the new user prompt
            contents.push({
                role: "user",
                parts: [{ text: userText }]
            });

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ contents })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error?.message || 'Failed to fetch LLM response');
            }

            const data = await response.json();
            const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (aiText) {
                // Clean up Markdown asterisks if any from Gemini
                const cleanText = aiText.replace(/\\*/g, '');
                setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: cleanText }]);
                speakResponse(cleanText);
            }

        } catch (err: any) {
            console.error('LLM Error:', err);
            toast.error('AI Error', { description: err.message });
            setStatus('idle');
        }
    };


    const handleSpeechResult = (transcript: string) => {
        const lowerTranscript = transcript.toLowerCase();

        // Check if it's the Wake Word
        if (lowerTranscript.startsWith(WAKE_WORD)) {
            // Strip out wake word
            const query = transcript.substring(WAKE_WORD.length).trim();
            if (query.length > 0) {
                // We have a full question
                setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: query }]);
                sendToLLM(query);
            } else {
                // They just said "Hey Nova"
                const reply = "Yes, how can I help you?";
                setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: reply }]);
                speakResponse(reply);
            }
        } else if (status === 'listening') {
            // If we explicitly pressed the mic button, we don't need the wake word
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: transcript }]);
            sendToLLM(transcript);
        }
    };

    const startListening = () => {
        if (recognitionRef.current) {
            stopSpeaking();
            setStatus('listening');

            try {
                recognitionRef.current.start();
            } catch (e) {
                console.error("Speech recognition is already running");
            }
        }
    };

    return {
        messages,
        status,
        startListening,
        stopSpeaking,
        error,
    };
}
