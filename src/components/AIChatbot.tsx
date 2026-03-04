import React, { useEffect, useRef } from 'react';
import { useVoiceAssistant } from '@/hooks/useVoiceAssistant';
import type { Profile } from '@/types/profile';
import { Button } from '@/components/ui/button';
import { Mic, Loader2, Volume2, Square } from 'lucide-react';

interface AIChatbotProps {
    detectedProfile: Profile | null;
    allProfiles: Profile[];
}

export function AIChatbot({ detectedProfile, allProfiles }: AIChatbotProps) {
    const { messages, status, startListening, stopSpeaking, error } = useVoiceAssistant(detectedProfile, allProfiles);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom of messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, status]);

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
                        <Mic className="h-8 w-8 mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Click the <b>Dragon Microphone</b> below<br />and ask a question.</p>
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

                <div className="flex gap-2">
                    {status === 'speaking' && (
                        <Button
                            size="icon"
                            variant="outline"
                            onClick={stopSpeaking}
                            className="h-10 w-10 shrink-0 text-muted-foreground hover:text-foreground rounded-full"
                            title="Stop Speaking"
                        >
                            <Square className="h-4 w-4" />
                        </Button>
                    )}
                    <Button
                        size="icon"
                        variant={status === 'listening' ? "destructive" : "default"}
                        onClick={startListening}
                        disabled={status === 'thinking'}
                        className={`h-10 w-10 shrink-0 rounded-full transition-all ${status === 'listening' ? 'animate-pulse' : ''}`}
                        title="Press Dragon Button to Dictate"
                    >
                        {status === 'thinking' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
                    </Button>
                </div>
            </div>
        </div>
    );
}
