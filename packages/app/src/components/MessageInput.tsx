import { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { Send, EyeOff, ChevronDown, Wand2, Wand, Plus, ChevronRight, Check } from 'lucide-react';
import { useChatContext } from '../contexts/ChatContext';
import { api } from '../api/client';

interface MessageInputProps {
  onSend: (content: string, phase?: string) => void;
  disabled?: boolean;
  isSolo?: boolean;
}

export function MessageInput({ onSend, disabled = false, isSolo = false }: MessageInputProps) {
  const [content, setContent] = useState('');
  const [phase, setPhase] = useState<string | undefined>(undefined);
  const [isManualPhase, setIsManualPhase] = useState(false);
  const [isAutoSelectEnabled, setIsAutoSelectEnabled] = useState(true);
  const [showPhaseMenu, setShowPhaseMenu] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [showRecentTags, setShowRecentTags] = useState(false);
  const [selectedRecentTags, setSelectedRecentTags] = useState<string[]>([]);
  const { customTags, canModerate, sessionId, recentTags, updateRecentTags } = useChatContext();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isAutoSelectEnabled || isManualPhase) return;

    const lowerContent = content.toLowerCase();
    if (lowerContent.includes('nose') || lowerContent.includes('smell')) {
      setPhase('nose');
    } else if (lowerContent.includes('palate') || lowerContent.includes('palette') || lowerContent.includes('flavor') || lowerContent.includes('taste') || lowerContent.includes('tasting')) {
      setPhase('palate');
    } else if (lowerContent.includes('finish') || lowerContent.includes('hui gan') || lowerContent.includes('huigan')) {
      setPhase('finish');
    } else if (lowerContent.includes('texture') || lowerContent.includes('mouthfeel') || lowerContent.includes('body') || lowerContent.includes('viscosity')) {
      setPhase('texture');
    } else {
      // Check custom tags
      const foundCustomTag = customTags.find(tag => lowerContent.includes(tag.toLowerCase()));
      if (foundCustomTag) {
        setPhase(foundCustomTag);
      } else {
        setPhase(undefined);
      }
    }
  }, [content, isManualPhase, isAutoSelectEnabled, customTags]);

  const handleSubmit = () => {
    if (!content.trim() || disabled || content.length > 300) return;
    onSend(content, phase);
    setContent('');
    setPhase(undefined);
    setIsManualPhase(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (content.length <= 300) {
        handleSubmit();
      }
    }
  };

  const handleSpoiler = () => {
    if (!textareaRef.current) return;

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const selectedText = content.substring(start, end);

    const newContent =
      content.substring(0, start) +
      `||${selectedText}||` +
      content.substring(end);

    setContent(newContent);

    // Refocus and set selection after state update
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newPos = end + 4; // +4 for the four pipes
        textareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  const handleAddTag = async () => {
    if (!newTag.trim() || !sessionId) return;
    const tag = newTag.trim();
    try {
      await api.post(`/sessions/${sessionId}/tags`, { tag });
      setNewTag('');
      setIsAddingTag(false);
      // Update recent tags
      updateRecentTags([...recentTags, tag]);
    } catch (err) {
      console.error('Failed to add tag:', err);
    }
  };

  const handleAddRecentTags = async () => {
    if (selectedRecentTags.length === 0 || !sessionId) return;
    try {
      for (const tag of selectedRecentTags) {
        if (!customTags.includes(tag)) {
          await api.post(`/sessions/${sessionId}/tags`, { tag });
        }
      }
      setSelectedRecentTags([]);
      setShowRecentTags(false);
    } catch (err) {
      console.error('Failed to add recent tags:', err);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPhaseMenu(!showPhaseMenu)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all border ${phase === 'nose' ? 'bg-orange-500/10 border-orange-500/30 text-orange-500' :
                phase === 'palate' ? 'bg-blue-500/10 border-blue-500/30 text-blue-500' :
                  phase === 'finish' ? 'bg-purple-500/10 border-purple-500/30 text-purple-500' :
                    phase === 'texture' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' :
                      customTags.includes(phase || '') ? 'bg-pink-500/10 border-pink-500/30 text-pink-500' :
                        'bg-[var(--bg-input)] border-[var(--border-primary)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                }`}
            >
              {phase || 'Select Phase'}
              <ChevronDown size={10} />
            </button>

            {showPhaseMenu && (
              <div className="absolute bottom-full left-0 mb-2 w-32 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                {[
                  { id: 'nose', label: 'Nose', color: 'text-orange-500' },
                  { id: 'palate', label: 'Palate', color: 'text-blue-500' },
                  { id: 'finish', label: 'Finish', color: 'text-purple-500' },
                  { id: 'texture', label: 'Texture', color: 'text-emerald-500' },
                  { id: undefined, label: 'None', color: 'text-[var(--text-muted)]' }
                ].map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => {
                      setPhase(p.id as any);
                      setIsManualPhase(true);
                      setShowPhaseMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider hover:bg-[var(--bg-input)] transition-colors ${p.color}`}
                  >
                    {p.label}
                  </button>
                ))}

                {customTags.length > 0 && (
                  <>
                    <div className="h-px bg-[var(--border-primary)] my-1" />
                    {customTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          setPhase(tag);
                          setIsManualPhase(true);
                          setShowPhaseMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider hover:bg-[var(--bg-input)] transition-colors text-pink-500"
                      >
                        {tag}
                      </button>
                    ))}
                  </>
                )}

                {canModerate && (
                  <>
                    <div className="h-px bg-[var(--border-primary)] my-1" />
                    {isAddingTag ? (
                      <div className="p-2 space-y-2">
                        <input
                          type="text"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          placeholder="Tag name..."
                          className="w-full bg-[var(--bg-main)] border border-[var(--border-primary)] rounded px-2 py-1 text-[10px] uppercase font-bold"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddTag();
                            } else if (e.key === 'Escape') {
                              setIsAddingTag(false);
                            }
                          }}
                        />
                        <div className="flex gap-1">
                          <button
                            onClick={handleAddTag}
                            className="flex-1 bg-orange-600 text-white py-1 rounded text-[8px] font-bold uppercase"
                          >
                            Add
                          </button>
                          <button
                            onClick={() => setIsAddingTag(false)}
                            className="flex-1 bg-[var(--bg-input)] text-[var(--text-secondary)] py-1 rounded text-[8px] font-bold uppercase"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        <div className="flex items-center border-b border-[var(--border-primary)] last:border-0">
                          <button
                            type="button"
                            onClick={() => setIsAddingTag(true)}
                            className="flex-1 text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider hover:bg-[var(--bg-input)] transition-colors text-orange-500 flex items-center gap-1.5"
                          >
                            <Plus size={10} />
                            Add Custom Tag
                          </button>
                          {recentTags.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setShowRecentTags(!showRecentTags)}
                              className={`px-2 py-2 transition-colors border-l border-[var(--border-primary)] ${showRecentTags ? 'text-orange-500 bg-[var(--bg-input)]' : 'text-[var(--text-muted)] hover:text-orange-500'}`}
                            >
                              <ChevronRight size={10} className={showRecentTags ? 'rotate-90 transition-transform' : 'transition-transform'} />
                            </button>
                          )}
                        </div>

                        {showRecentTags && recentTags.length > 0 && (
                          <div className="bg-[var(--bg-main)] p-2 space-y-2 animate-in slide-in-from-left-2 duration-200">
                            <div className="text-[8px] font-bold uppercase text-[var(--text-muted)] px-1">Recent Tags</div>
                            <div className="max-h-32 overflow-y-auto space-y-1 custom-scrollbar">
                              {recentTags.map(tag => (
                                <button
                                  key={tag}
                                  type="button"
                                  onClick={() => {
                                    setSelectedRecentTags(prev =>
                                      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                                    );
                                  }}
                                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[var(--bg-input)] transition-colors text-left"
                                >
                                  <div className={`w-3 h-3 rounded border flex items-center justify-center transition-colors ${selectedRecentTags.includes(tag) ? 'bg-orange-600 border-orange-600' : 'border-[var(--border-primary)] bg-[var(--bg-card)]'}`}>
                                    {selectedRecentTags.includes(tag) && <Check size={8} className="text-white" />}
                                  </div>
                                  <span className={`text-[9px] font-bold uppercase ${customTags.includes(tag) ? 'text-[var(--text-muted)] line-through' : 'text-[var(--text-secondary)]'}`}>
                                    {tag}
                                  </span>
                                </button>
                              ))}
                            </div>
                            {selectedRecentTags.length > 0 && (
                              <button
                                onClick={handleAddRecentTags}
                                className="w-full bg-orange-600 text-white py-1.5 rounded text-[8px] font-bold uppercase shadow-lg shadow-orange-600/20 hover:bg-orange-500 transition-all"
                              >
                                Add Selected ({selectedRecentTags.length})
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsAutoSelectEnabled(!isAutoSelectEnabled)}
            className={`p-1.5 rounded transition-colors ${isAutoSelectEnabled
              ? 'text-orange-500 bg-orange-500/10'
              : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] bg-[var(--bg-input)]'
              }`}
            title={isAutoSelectEnabled ? "Auto-detection enabled" : "Auto-detection disabled"}
          >
            {isAutoSelectEnabled ? <Wand2 size={14} /> : <Wand size={14} />}
          </button>

          {!isSolo && (
            <>
              <div className="w-px h-4 bg-[var(--border-primary)] mx-1" />

              <button
                type="button"
                onClick={handleSpoiler}
                className="p-1.5 rounded bg-[var(--bg-input)] border border-[var(--border-primary)] text-[var(--text-muted)] hover:text-orange-500 hover:border-orange-500/30 transition-colors"
                title="Mark as spoiler"
              >
                <EyeOff size={16} />
              </button>
            </>
          )}
        </div>

        {!isSolo && (
          <div className="flex gap-4">
            <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-tighter">||text|| for spoilers</span>
          </div>
        )}
      </div>

      <div className="relative group">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Share your tasting notes..."
          disabled={disabled}
          className={`w-full bg-[var(--bg-card)] border rounded-lg px-4 py-4 text-sm resize-none focus:border-[var(--border-secondary)] transition-all pr-14 ${content.length > 300 ? 'border-red-500 focus:border-red-500' : 'border-[var(--border-primary)]'
            }`}
          rows={1}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = Math.min(target.scrollHeight, 150) + 'px';
          }}
        />

        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <button
            onClick={handleSubmit}
            disabled={disabled || !content.trim() || content.length > 300}
            className="w-10 h-10 bg-orange-600 rounded-md flex items-center justify-center text-white hover:bg-orange-500 disabled:opacity-50 disabled:bg-[var(--bg-input)] transition-all"
          >
            <Send size={18} />
          </button>
        </div>
      </div>

      {content.length > 280 && (
        <div className="flex justify-end px-1">
          <span className={`text-[10px] font-bold ${content.length > 300 ? 'text-red-500' : 'text-orange-500'
            }`}>
            {content.length}/300
          </span>
        </div>
      )}
    </div>
  );
}
