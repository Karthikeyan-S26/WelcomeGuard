import React, { useEffect, useRef } from 'react';
import { useVoiceAssistant } from '@/hooks/useVoiceAssistant';
import type { Profile } from '@/types/profile';
import { Button } from '@/components/ui/button';
import { Mic, Loader2, Volume2, Square } from 'lucide-react';
import dragonLogo from '@/assets/it-logo.jpg';

interface AIChatbotProps {
    detectedProfile: Profile | null;
    allProfiles: Profile[];
}

export function AIChatbot({ detectedProfile, allProfiles }: AIChatbotProps) {
    const { messages, status, startListening, stopSpeaking, error, isActive } = useVoiceAssistant(detectedProfile, allProfiles);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom of messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, status, isActive]);

    if (!isActive) {
        return (
            <div className="mt-4 flex flex-col items-center justify-center rounded-xl border border-border/40 bg-card shadow-sm h-[400px] relative overflow-hidden group">
                <div className="absolute top-4 left-4">
                    <h3 className="text-sm font-semibold text-foreground">Nova AI Assistant</h3>
                </div>
                <div className="absolute top-4 right-4 flex h-2 w-2">
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-muted-foreground/30"></span>
                </div>

                <button
                    onClick={startListening}
                    aria-label="Start voice conversation with Nova"
                    title="Tap Dragon to start Chatbot or safely say 'Hey Nova'"
                    className="relative flex items-center justify-center h-28 w-28 shrink-0 rounded-full border-4 border-[#22c55e] bg-white overflow-hidden transition-all duration-300 hover:shadow-[0_0_25px_rgba(34,197,94,0.6)] cursor-pointer hover:scale-105 active:scale-95 group-hover:animate-pulse shadow-md"
                >
                    <img
                        src={dragonLogo}
                        alt="IT Dragon Logo"
                        className="h-full w-full object-cover grayscale-0"
                    />
                </button>
                <div className="mt-8 text-center space-y-1">
                    <p className="text-sm text-foreground font-medium">Say <b>"Hey Nova"</b></p>
                    <p className="text-xs text-muted-foreground">or Tap Dragon to Wake</p>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-4 flex flex-col rounded-xl border border-border/40 bg-card shadow-sm h-[400px]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/40 bg-muted/30 px-4 py-3">
                <div>
                    <h3 className="text-sm font-semibold text-foreground">Nova AI Assistant</h3>
                    <p className="text-xs text-muted-foreground">Voice-enabled</p>
                </div>
                <div className="flex h-2 w-2">
                    {status === 'listening' ? (
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                    ) : status === 'speaking' ? (
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                    ) : (
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-muted-foreground/30"></span>
                    )}
                </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                {messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-center opacity-50">
                        <img src={dragonLogo} alt="Dragon Logo" className="h-12 w-12 mb-3 rounded-full object-cover grayscale opacity-50" />
                        <p className="text-sm text-muted-foreground">Nova is actively listening...</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${msg.role === 'user'
                                    ? 'bg-primary text-primary-foreground rounded-tr-sm'
                                    : 'bg-muted text-foreground border border-border/50 rounded-tl-sm'
                                    }`}
                            >
                                {msg.content}
                            </div>
                        </div>
                    ))
                )}

                {/* Status Indicators appearing as part of the chat */}
                {status === 'thinking' && (
                    <div className="flex justify-start">
                        <div className="max-w-[85%] rounded-2xl bg-muted px-4 py-2 text-sm border border-border/50 rounded-tl-sm text-muted-foreground flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" /> Thinking...
                        </div>
                    </div>
                )}
                {status === 'speaking' && (
                    <div className="flex justify-start">
                        <div className="text-xs text-muted-foreground flex items-center gap-1 animate-pulse ml-2">
                            <Volume2 className="h-3 w-3" /> Speaking
                        </div>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="border-t border-border/40 p-4 bg-muted/10 flex items-center justify-between">
                {error ? (
                    <span className="text-xs text-destructive">{error}</span>
                ) : (
                    <span className="text-xs text-muted-foreground transition-all">
                        {status === 'listening' ? '🎤 Listening...' : status === 'thinking' ? 'Thinking...' : status === 'speaking' ? 'Speaking...' : 'Ready'}
                    </span>
                )}

                <div className="flex gap-3">
                    {status === 'speaking' && (
                        <Button
                            size="icon"
                            variant="outline"
                            onClick={stopSpeaking}
                            className="h-14 w-14 shrink-0 text-muted-foreground hover:text-foreground rounded-full"
                            title="Stop Speaking"
                        >
                            <Square className="h-5 w-5" />
                        </Button>
                    )}
                    <button
                        onClick={startListening}
                        disabled={status !== 'idle'}
                        aria-label="Start voice conversation with Nova"
                        title="Tap Dragon to speak with Nova"
                        style={{
                            boxShadow: status === 'listening' ? '0 0 15px rgba(34, 197, 94, 0.6)' : 'none',
                        }}
                        className={`
                            relative flex items-center justify-center 
                            h-14 w-14 shrink-0 rounded-full border-2 bg-white 
                            overflow-hidden transition-all duration-300
                            ${status !== 'idle' ? 'opacity-50 cursor-not-allowed border-muted' : 'border-[#22c55e] hover:shadow-[0_0_15px_rgba(34,197,94,0.6)] cursor-pointer hover:scale-105 active:scale-95'}
                        `}
                    >
                        {status === 'listening' && (
                            <span className="absolute inset-0 rounded-full border-[3px] border-green-500 animate-ping opacity-75"></span>
                        )}
                        <img
                            src={dragonLogo}
                            alt="IT Dragon Logo"
                            className="h-full w-full object-cover"
                        />
                    </button>
                </div>
            </div>
        </div>
    );
}
