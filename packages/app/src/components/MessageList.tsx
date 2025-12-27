import { useEffect, useRef } from 'react';
import { Trash2 } from 'lucide-react';
import type { Message } from '../types';
import { SpoilerText } from './SpoilerText';

interface MessageListProps {
  messages: Message[];
  currentUserId?: string;
  canDelete?: boolean; // Whether current user can delete messages (host or mod)
  onDeleteMessage?: (messageId: string) => void;
  revealedMessageIds?: Set<string>; // Message IDs with revealed spoilers
  phaseVisibility?: Record<string, 'normal' | 'hidden' | 'revealed'>;
}

export function MessageList({
  messages,
  currentUserId,
  canDelete = false,
  onDeleteMessage,
  revealedMessageIds = new Set(),
  phaseVisibility = {},
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="space-y-6">
      {messages.map((message) => {
        const isOwnMessage = currentUserId === message.userId;
        const isSystemMessage = message.userId === 'system';

        const phaseSetting = message.phase ? phaseVisibility[message.phase] : (phaseVisibility['untagged'] || 'normal');
        const isForceHidden = phaseSetting === 'hidden';
        const isForceRevealed = phaseSetting === 'revealed';

        // Phase visibility takes precedence over individual message reveal state:
        // - 'hidden': Always hide spoilers (force entire message as spoiler)
        // - 'revealed': Always show spoilers
        // - 'normal' (auto): Respect individual message reveal state (revealedMessageIds)
        const shouldRevealSpoilers = isForceRevealed || (phaseSetting === 'normal' && revealedMessageIds.has(message.id));
        const shouldForceHide = isForceHidden;

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
          <div
            key={message.id}
            className={`flex gap-4 group ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold ${isOwnMessage ? 'bg-orange-600' : 'bg-[var(--bg-input)]'
              }`}>
              {(message.user.displayName || 'A')[0].toUpperCase()}
            </div>

            <div className={`flex flex-col gap-1 max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
              <div className="flex items-center gap-2 px-1">
                {!isOwnMessage && (
                  <span className="text-[10px] font-bold text-[var(--text-secondary)]">
                    {message.user.displayName || 'Anonymous'}
                  </span>
                )}
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

              {/* Message bubble with delete button - button always toward center */}
              <div className={`flex items-start gap-2 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`px-4 py-3 rounded-lg text-sm leading-relaxed ${isOwnMessage
                  ? 'bg-orange-600/90 text-white'
                  : 'bg-[var(--bg-input)] border border-[var(--border-primary)] text-[var(--text-secondary)]'
                  }`}>
                  <SpoilerText
                    text={message.content}
                    forceReveal={shouldRevealSpoilers}
                    forceHide={shouldForceHide}
                  />
                </div>

                {/* Delete button - appears toward center of chat (right of bubble for others, left of bubble for own) */}
                {canDelete && (
                  <button
                    onClick={() => onDeleteMessage?.(message.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-all flex-shrink-0"
                    title="Delete message"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}

