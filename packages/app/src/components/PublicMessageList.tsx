import { useRef, useEffect, useState } from 'react';
import type { Message } from '../types';
import { SpoilerText } from './SpoilerText';

interface PublicMessageListProps {
    messages: Message[];
}

export function PublicMessageList({ messages }: PublicMessageListProps) {
    const bottomRef = useRef<HTMLDivElement>(null);
    const [revealedMessageIds, setRevealedMessageIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const toggleSpoiler = (messageId: string) => {
        setRevealedMessageIds(prev => {
            const next = new Set(prev);
            if (next.has(messageId)) {
                next.delete(messageId);
            } else {
                next.add(messageId);
            }
            return next;
        });
    };

    return (
        <div className="space-y-6">
            {messages.map((message) => {
                const isSystemMessage = message.userId === 'system';
                const isRevealed = revealedMessageIds.has(message.id);

                // System messages have special styling
                if (isSystemMessage) {
                    return (
                        <div key={message.id} className="flex justify-center">
                            <span className="text-[10px] text-[var(--text-secondary)] bg-[var(--bg-main)]/50 px-3 py-1 rounded-full border border-[var(--border-primary)]">
                                {message.content}
                            </span>
                        </div>
                    );
                }

                return (
                    <div key={message.id} className="flex gap-4 group flex-row">
                        {/* Avatar */}
                        <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold bg-[var(--bg-input)]">
                            {(message.user.displayName || 'A')[0].toUpperCase()}
                        </div>

                        <div className="flex flex-col gap-1 max-w-[85%] items-start">
                            <div className="flex items-center gap-2 px-1">
                                <span className="text-[10px] font-bold text-[var(--text-secondary)]">
                                    {message.user.displayName || 'Anonymous'}
                                </span>
                                {message.phase && (
                                    <span className={`text-[8px] font-bold uppercase tracking-widest px-1 py-0.5 rounded border ${message.phase === 'nose' ? 'bg-orange-500/10 border-orange-500/30 text-orange-500' :
                                        message.phase === 'palate' ? 'bg-blue-500/10 border-blue-500/30 text-blue-500' :
                                            message.phase === 'texture' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' :
                                                'bg-purple-500/10 border-purple-500/30 text-purple-500'
                                        }`}>
                                        {message.phase}
                                    </span>
                                )}
                                <span className="text-[10px] text-[var(--text-muted)]">
                                    {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>

                            {/* Message bubble */}
                            <div className="px-4 py-3 rounded-lg text-sm leading-relaxed bg-[var(--bg-input)] border border-[var(--border-primary)] text-[var(--text-secondary)]">
                                <div onClick={() => toggleSpoiler(message.id)}>
                                    <SpoilerText
                                        text={message.content}
                                        forceReveal={isRevealed}
                                        forceHide={false}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
            <div ref={bottomRef} />
        </div>
    );
}
