import { useEffect, useRef, useState } from 'react';
import { Trash2, Pencil, Check, X, FileText } from 'lucide-react';
import type { Message } from '../types';
import { SpoilerText } from './SpoilerText';

interface MessageListProps {
  messages: Message[];
  currentUserId?: string;
  canDelete?: boolean; // Whether current user can delete messages (host or mod)
  onDeleteMessage?: (messageId: string) => void;
  revealedMessageIds?: Set<string>; // Message IDs with revealed spoilers
  phaseVisibility?: Record<string, 'normal' | 'hidden' | 'revealed'>;
  onEditMessage?: (messageId: string, content: string) => void;
  summaryId?: string | null;
}

export function MessageList({
  messages,
  currentUserId,
  canDelete = false,
  onDeleteMessage,
  revealedMessageIds = new Set(),
  phaseVisibility = {},
  onEditMessage,
  summaryId,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

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
        const shouldRevealSpoilers = isForceRevealed || revealedMessageIds.has(message.id);
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
                {summaryId && (
                  <a
                    href={`/session/${message.sessionId}/summary`}
                    className="text-[var(--text-muted)] hover:text-orange-500 transition-colors"
                    title="View Session Summary"
                  >
                    <FileText size={10} />
                  </a>
                )}
              </div>

              {/* Message bubble with delete button - button always toward center */}
              <div className={`flex items-start gap-2 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`px-4 py-3 rounded-lg text-sm leading-relaxed ${isOwnMessage
                  ? 'bg-orange-600/90 text-white'
                  : 'bg-[var(--bg-input)] border border-[var(--border-primary)] text-[var(--text-secondary)]'
                  }`}>
                  {editingMessageId === message.id ? (
                    <div className="flex flex-col gap-2 min-w-[200px]">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full bg-[var(--bg-input)] text-[var(--text-primary)] border border-[var(--border-primary)] rounded p-2 text-sm focus:outline-none focus:border-orange-500 resize-none"
                        rows={3}
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditingMessageId(null)}
                          className="p-1 hover:bg-[var(--bg-hover)] rounded transition-colors"
                          title="Cancel"
                        >
                          <X size={16} />
                        </button>
                        <button
                          onClick={() => {
                            onEditMessage?.(message.id, editContent);
                            setEditingMessageId(null);
                          }}
                          className="p-1 hover:bg-[var(--bg-hover)] rounded transition-colors"
                          title="Save"
                        >
                          <Check size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <SpoilerText
                      text={message.content}
                      forceReveal={shouldRevealSpoilers}
                      forceHide={shouldForceHide}
                    />
                  )}
                </div>

                {/* Action buttons - appear toward center of chat */}
                <div className={`flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                  {isOwnMessage && editingMessageId !== message.id && (
                    <button
                      onClick={() => {
                        setEditingMessageId(message.id);
                        setEditContent(message.content);
                      }}
                      className="p-1 text-[var(--text-muted)] hover:text-orange-400 hover:bg-orange-500/10 rounded transition-all flex-shrink-0"
                      title="Edit message"
                    >
                      <Pencil size={14} />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => onDeleteMessage?.(message.id)}
                      className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-all flex-shrink-0"
                      title="Delete message"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
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

