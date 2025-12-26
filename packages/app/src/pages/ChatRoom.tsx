import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Zap, Tag, Info, MoreVertical, Loader2, BarChart3, User, Users, Check, X, Crown, AlertCircle, Copy, Link2, Hash, Shield, Eye, EyeOff, Star } from 'lucide-react';
import { useSession, useEndSession, useTransferHost } from '../api/sessions';
import { useSessionJoinRequests, useApproveJoinRequest, useRejectJoinRequest } from '../api/friends';
import { useChatContext } from '../contexts/ChatContext';
import { MessageList } from '../components/MessageList';
import { MessageInput } from '../components/MessageInput';
import { api } from '../api/client';

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'this', 'that', 'from', 'have', 'been', 'was', 'were', 'are', 'you', 'your', 'our', 'their', 'they', 'them',
  'but', 'not', 'what', 'all', 'any', 'can', 'out', 'how', 'who', 'which', 'when', 'where', 'why', 'about', 'into', 'over', 'after',
  'some', 'more', 'most', 'than', 'then', 'just', 'like', 'well', 'only', 'very', 'even', 'back', 'also', 'will', 'would', 'could', 'should',
  'get', 'got', 'has', 'had', 'did', 'does', 'done', 'make', 'made', 'take', 'took', 'come', 'came', 'give', 'gave', 'find', 'found',
  'think', 'thought', 'know', 'knew', 'look', 'looked', 'want', 'wanted', 'give', 'given', 'tell', 'told', 'work', 'worked', 'call', 'called',
  'try', 'tried', 'ask', 'asked', 'need', 'needed', 'feel', 'felt', 'become', 'became', 'leave', 'left', 'put', 'mean', 'meant', 'keep', 'kept',
  'let', 'begin', 'began', 'seem', 'seemed', 'help', 'helped', 'talk', 'talked', 'turn', 'turned', 'start', 'started', 'show', 'showed',
  'hear', 'heard', 'play', 'played', 'run', 'ran', 'move', 'moved', 'live', 'lived', 'believe', 'believed', 'bring', 'brought', 'happen', 'happened',
  'write', 'wrote', 'sit', 'sat', 'stand', 'stood', 'lose', 'lost', 'pay', 'paid', 'meet', 'met', 'include', 'included', 'continue', 'continued',
  'set', 'learn', 'learned', 'change', 'changed', 'lead', 'led', 'understand', 'understood', 'watch', 'watched', 'follow', 'followed', 'stop', 'stopped',
  'create', 'created', 'speak', 'spoke', 'read', 'allow', 'allowed', 'add', 'added', 'spend', 'spent', 'grow', 'grew', 'open', 'opened', 'walk', 'walked',
  'win', 'won', 'offer', 'offered', 'remember', 'remembered', 'love', 'loved', 'consider', 'considered', 'appear', 'appeared', 'buy', 'bought', 'wait', 'waited',
  'serve', 'served', 'die', 'died', 'send', 'sent', 'expect', 'expected', 'build', 'built', 'stay', 'stayed', 'fall', 'fell', 'cut', 'reach', 'reached',
  'kill', 'killed', 'remain', 'remained', 'suggest', 'suggested', 'raise', 'raised', 'pass', 'passed', 'sell', 'sold', 'require', 'required', 'report', 'reported',
  'decide', 'decided', 'pull', 'pulled', 'really', 'very', 'quite', 'rather', 'just', 'almost', 'nearly', 'enough', 'too', 'much', 'little', 'less', 'least', 'more', 'most'
]);

export function ChatRoom() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [copied, setCopied] = useState<'id' | 'link' | null>(null);
  const { data: sessionData, isLoading, refetch: refetchSession } = useSession(id!);
  const {
    messages,
    activeUsers,
    moderators,
    sendMessage,
    deleteMessage,
    makeModerator,
    revealAllSpoilers,
    revealMySpoilers,
    injectDebugHistory,
    isConnected,
    sessionEnded,
    sessionEndedBy,
    hostId: socketHostId,
    revealedMessageIds,
    globallyRevealedMessageIds,
    updateRating,
    averageRating,
    phaseVisibility,
    setPhaseVisibility,
    setAllPhaseVisibility,
  } = useChatContext();
  const { mutate: endSession, isPending: isEnding } = useEndSession();
  const { mutate: transferHost, isPending: isTransferring } = useTransferHost();

  // Join request hooks (poll every 5 seconds for hosts to see incoming requests)
  const { data: joinRequestsData } = useSessionJoinRequests(id!);
  const approveJoinRequest = useApproveJoinRequest();
  const rejectJoinRequest = useRejectJoinRequest();
  const joinRequests = joinRequestsData?.requests || [];

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get<{ user: { id: string } }>('/auth/session');
        setCurrentUserId(response.user.id);
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    };
    fetchUser();
  }, []);

  const copySessionId = async () => {
    if (!id) return;
    await navigator.clipboard.writeText(id);
    setCopied('id');
    setTimeout(() => setCopied(null), 2000);
  };

  const copyJoinLink = async () => {
    if (!id) return;
    const link = `${window.location.origin}/join/${id}`;
    await navigator.clipboard.writeText(link);
    setCopied('link');
    setTimeout(() => setCopied(null), 2000);
  };

  const wordFrequencies = useMemo(() => {
    const counts: Record<string, number> = {};
    messages.forEach(msg => {
      const words = msg.content.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length >= 3 && !STOP_WORDS.has(word));

      words.forEach(word => {
        counts[word] = (counts[word] || 0) + 1;
      });
    });

    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([word, count]) => ({ word, count }));
  }, [messages]);

  const [showEndModal, setShowEndModal] = useState(false);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (actionsRef.current && !actionsRef.current.contains(event.target as Node)) {
        setIsActionsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAnalyze = () => {
    if (!id) return;
    endSession({ sessionId: id, shouldAnalyze: true }, {
      onSuccess: () => {
        navigate(`/session/${id}/summary?analyzing=true`);
      },
      onError: (err) => {
        console.error('Failed to analyze session:', err);
      }
    });
  };

  const handleEndSession = (shouldAnalyze: boolean) => {
    if (!id) return;
    setShowEndModal(false);
    endSession({ sessionId: id, shouldAnalyze }, {
      onSuccess: () => {
        navigate(`/session/${id}/summary${shouldAnalyze ? '?analyzing=true' : ''}`);
      },
      onError: (err) => {
        console.error('Failed to end session:', err);
      }
    });
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const session = sessionData?.session;
  const isSessionEnded = sessionEnded || session?.status === 'ended';
  const effectiveSessionEndedBy = sessionEndedBy || (session?.status === 'ended' ? 'The host' : null);

  // Use socket-based hostId if available (for real-time updates), fallback to session data
  const effectiveHostId = socketHostId || session?.hostId;
  const isHost = effectiveHostId === currentUserId;
  const isModerator = currentUserId ? moderators.includes(currentUserId) : false;
  const canModerate = isHost || isModerator; // Can delete messages

  const handleTransferHost = (newHostId: string) => {
    transferHost(
      { sessionId: id!, newHostId },
      {
        onSuccess: () => {
          refetchSession();
        },
      }
    );
  };

  return (
    <div className="h-full flex overflow-hidden relative">
      {/* End Session Modal */}
      {showEndModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="card w-full max-w-md p-8 border-orange-500/30 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-500">
                <Zap size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">End Tasting Session?</h3>
                <p className="text-sm text-[var(--text-secondary)]">Choose how you'd like to wrap up this session.</p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => handleEndSession(true)}
                className="w-full btn-orange flex items-center justify-between group"
              >
                <div className="flex items-center gap-2">
                  <Zap size={16} />
                  <span>End & Synthesize Profile</span>
                </div>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded uppercase font-bold">Recommended</span>
              </button>

              <button
                onClick={() => handleEndSession(false)}
                className="w-full py-3 px-4 bg-[var(--bg-input)] hover:opacity-90 text-[var(--text-primary)] border border-[var(--border-primary)] rounded-md text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Info size={16} className="text-[var(--text-secondary)]" />
                End Session Only
              </button>

              <button
                onClick={() => setShowEndModal(false)}
                className="w-full py-3 px-4 bg-transparent border border-[var(--border-primary)] hover:bg-[var(--bg-main)] text-[var(--text-secondary)] rounded-md text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Left Sidebar: Active Tasters & Join Requests */}
      <aside className="w-[220px] bg-[var(--bg-sidebar)] border-r border-[var(--border-primary)] flex flex-col overflow-hidden">
        {/* Active Tasters */}
        <div className="p-4 flex-1 overflow-y-auto">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-4 flex items-center gap-2">
            <Users size={12} />
            Active Tasters
          </h3>
          <div className="space-y-2">
            {activeUsers.map((user) => {
              const isUserHost = user.userId === effectiveHostId;
              const isUserMod = moderators.includes(user.userId);
              const canTransfer = isHost && !isUserHost && user.userId !== currentUserId;
              const canMakeMod = isHost && !isUserHost && !isUserMod && user.userId !== currentUserId;
              return (
                <div
                  key={user.socketId}
                  className={`flex items-center gap-2 p-2 rounded-md border group ${isUserHost
                    ? 'bg-orange-500/5 border-orange-500/30'
                    : isUserMod
                      ? 'bg-blue-500/5 border-blue-500/30'
                      : 'bg-[var(--bg-main)]/30 border-[var(--border-primary)]/50'
                    }`}
                >
                  <div className="relative">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.displayName || ''} className="w-7 h-7 rounded-full" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-[var(--bg-input)] flex items-center justify-center">
                        <User size={14} className="text-[var(--text-secondary)]" />
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 border-2 border-[var(--bg-sidebar)] rounded-full"></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-medium text-[var(--text-primary)] truncate">
                        {user.displayName || 'Anonymous'}
                      </span>
                      {isUserHost && (
                        <Crown size={10} className="text-orange-500 flex-shrink-0" />
                      )}
                      {isUserMod && !isUserHost && (
                        <Shield size={10} className="text-blue-400 flex-shrink-0" />
                      )}
                    </div>
                    {isUserHost && (
                      <p className="text-[9px] text-orange-500/70">Host</p>
                    )}
                    {isUserMod && !isUserHost && (
                      <p className="text-[9px] text-blue-400/70">Moderator</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {user.rating && (
                      <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-orange-500/10 rounded text-[10px] font-bold text-orange-500">
                        <Star size={8} fill="currentColor" />
                        {user.rating}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      {canMakeMod && (
                        <button
                          onClick={() => makeModerator(user.userId)}
                          className="opacity-0 group-hover:opacity-100 text-[9px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded hover:bg-blue-500/20 transition-all"
                          title="Make Moderator"
                        >
                          <Shield size={10} />
                        </button>
                      )}
                      {canTransfer && (
                        <button
                          onClick={() => handleTransferHost(user.userId)}
                          disabled={isTransferring}
                          className="opacity-0 group-hover:opacity-100 text-[9px] px-1.5 py-0.5 bg-orange-500/10 text-orange-500 rounded hover:bg-orange-500/20 transition-all"
                          title="Make Host"
                        >
                          <Crown size={10} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {activeUsers.length === 0 && (
              <p className="text-[10px] text-[var(--text-muted)] italic">No other tasters...</p>
            )}
          </div>
        </div>

        {/* Join Requests (Host Only) */}
        {isHost && joinRequests.length > 0 && (
          <div className="p-4 border-t border-[var(--border-primary)]">
            <h3 className="text-xs font-bold uppercase tracking-widest text-yellow-500 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></span>
              Join Requests ({joinRequests.length})
            </h3>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {joinRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-2 rounded-md bg-yellow-500/5 border border-yellow-500/20">
                  <div className="flex items-center gap-2 min-w-0">
                    {request.requester?.avatarUrl ? (
                      <img src={request.requester.avatarUrl} alt="" className="w-6 h-6 rounded-full" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-[var(--bg-input)] flex items-center justify-center">
                        <User size={12} className="text-[var(--text-secondary)]" />
                      </div>
                    )}
                    <span className="text-xs text-[var(--text-primary)] truncate">
                      {request.requester?.displayName || request.requester?.email || 'User'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => approveJoinRequest.mutate({ requestId: request.id, sessionId: id! })}
                      disabled={approveJoinRequest.isPending}
                      className="p-1 bg-green-500/10 text-green-500 rounded hover:bg-green-500/20 transition-colors"
                      title="Approve"
                    >
                      <Check size={12} />
                    </button>
                    <button
                      onClick={() => rejectJoinRequest.mutate({ requestId: request.id, sessionId: id! })}
                      disabled={rejectJoinRequest.isPending}
                      className="p-1 bg-red-500/10 text-red-500 rounded hover:bg-red-500/20 transition-colors"
                      title="Reject"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-[var(--border-primary)]">
        {/* Chat Header */}
        <header className="border-bottom border-[var(--border-primary)] flex items-center justify-between px-6 py-3 bg-[var(--bg-main)]">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="heading-lg">{session?.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  <span className="text-xs text-[var(--text-secondary)]">{activeUsers.length} Taster{activeUsers.length !== 1 ? 's' : ''}</span>
                </div>
                <span className="text-[var(--text-muted)]">•</span>
                <div className="flex items-center gap-1.5">
                  <Hash size={10} className="text-[var(--text-muted)]" />
                  <span className="text-xs text-[var(--text-secondary)] font-mono">{id?.slice(0, 8)}...</span>
                  <button
                    onClick={copySessionId}
                    className="text-[var(--text-secondary)] hover:text-orange-500 transition-colors"
                    title="Copy Session ID"
                  >
                    {copied === 'id' ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                  </button>
                </div>
                {averageRating !== null && (
                  <>
                    <span className="text-[var(--text-muted)]">•</span>
                    <div className="flex items-center gap-1.5">
                      <Star size={12} className="text-orange-500 fill-orange-500" />
                      <span className="text-xs font-bold text-[var(--text-primary)]">{averageRating.toFixed(1)} Avg</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Share & Personal Actions (Icon Buttons) */}
            <button
              onClick={copyJoinLink}
              className="p-2 text-[var(--text-secondary)] hover:text-orange-500 hover:bg-[var(--bg-input)]/50 rounded-lg transition-all"
              title={copied === 'link' ? 'Copied!' : 'Copy Join Link'}
            >
              {copied === 'link' ? <Check size={18} className="text-green-500" /> : <Link2 size={18} />}
            </button>


            {/* Host Primary Action */}
            {isHost && (
              <button
                onClick={handleAnalyze}
                disabled={isEnding}
                className="btn-orange text-xs py-2 px-4 shadow-lg shadow-orange-500/10"
              >
                {isEnding ? (
                  <Loader2 size={14} className="animate-spin mr-2" />
                ) : (
                  <Zap size={14} className="mr-2" />
                )}
                {isEnding ? 'Synthesizing...' : 'Synthesize Profile'}
              </button>
            )}

            {/* Host Dropdown Actions */}
            {isHost && (
              <div className="relative" ref={actionsRef}>
                <button
                  onClick={() => setIsActionsOpen(!isActionsOpen)}
                  className={`p-2 rounded-lg transition-all ${isActionsOpen ? 'bg-[var(--bg-input)] text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-input)]/50'}`}
                  title="Session Actions"
                >
                  <MoreVertical size={20} />
                </button>

                {isActionsOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-2 space-y-1">
                      <button
                        onClick={() => {
                          revealAllSpoilers();
                          setIsActionsOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-input)] rounded-md transition-colors"
                      >
                        <Eye size={16} />
                        Reveal All Spoilers
                      </button>

                      {currentUserId === '108758497007070939011' && (
                        <button
                          onClick={() => {
                            injectDebugHistory();
                            setIsActionsOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-md transition-colors"
                        >
                          <Zap size={16} />
                          Inject Debug History
                        </button>
                      )}

                      <div className="h-px bg-[var(--border-primary)] my-1" />

                      <button
                        onClick={() => {
                          setShowEndModal(true);
                          setIsActionsOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-md transition-colors"
                      >
                        <X size={16} />
                        End Session
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Session Ended Banner */}
        {isSessionEnded && (
          <div className="bg-red-500/10 border-b border-red-500/30 px-6 py-4">
            <div className="max-w-3xl mx-auto flex items-center gap-3">
              <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-400">
                  {effectiveSessionEndedBy} has ended the session
                </p>
                <p className="text-xs text-red-400/70">
                  Chat is now closed. You can still view the conversation.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto bg-[var(--bg-main)] p-6">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="text-center">
              <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-main)]/50 px-3 py-1 rounded-full border border-[var(--border-primary)]">
                Session started {session ? new Date(session.startedAt).toLocaleDateString([], {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric'
                }) + ' at ' + new Date(session.startedAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                }) : ''}
              </span>
            </div>
            <MessageList
              messages={messages}
              currentUserId={currentUserId || undefined}
              canDelete={canModerate}
              onDeleteMessage={deleteMessage}
              revealedMessageIds={new Set([...revealedMessageIds, ...globallyRevealedMessageIds])}
              phaseVisibility={phaseVisibility}
            />
          </div>
        </div>

        {/* Input */}
        <div className="p-6 bg-[var(--bg-main)]">
          <div className="max-w-3xl mx-auto">
            {isSessionEnded ? (
              <div className="text-center py-3 text-sm text-[var(--text-secondary)] bg-[var(--bg-main)]/30 rounded-lg border border-[var(--border-primary)]">
                This session has ended. Chat is disabled.
              </div>
            ) : (
              <MessageInput onSend={sendMessage} disabled={!isConnected} />
            )}
          </div>
        </div>
      </div>

      {/* Right Sidebar: Tasting Summary */}
      <aside className="w-[380px] bg-[var(--bg-main)] overflow-y-auto p-6 space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 size={18} className="text-orange-500" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-primary)]">Tasting Summary</h2>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Tag size={16} className="text-green-500" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Common Descriptors</h3>
          </div>
          <div className="space-y-4">
            {wordFrequencies.length > 0 ? (
              wordFrequencies.map(({ word, count }) => (
                <div key={word} className="animate-fade-in-up">
                  <div className="flex justify-between text-[10px] mb-1.5">
                    <span className="text-[var(--text-secondary)] capitalize">{word}</span>
                    <span
                      key={`${word}-${count}`}
                      className="text-green-500 font-bold animate-pulse-highlight"
                    >
                      {count} mention{count !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="progress-container h-1.5">
                    <div
                      className="progress-bar bg-green-500"
                      style={{ width: `${Math.min(100, (count / Math.max(...wordFrequencies.map(f => f.count))) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-[var(--text-muted)] italic">Start chatting to see common descriptors emerge...</p>
            )}
          </div>
        </div>


        <div className="card p-5 bg-orange-500/5 border-orange-500/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Star size={16} className="text-orange-500" />
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Your Score</h3>
            </div>
            <span className="text-lg font-bold text-orange-500">
              {activeUsers.find(u => u.userId === currentUserId)?.rating || '--'}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={activeUsers.find(u => u.userId === currentUserId)?.rating || 0}
            onChange={(e) => updateRating(parseInt(e.target.value))}
            className="w-full h-1.5 bg-[var(--bg-input)] rounded-lg appearance-none cursor-pointer accent-orange-500 mb-2"
          />
          <div className="flex justify-between text-[10px] text-[var(--text-muted)] font-medium">
            <span>0</span>
            <span>50</span>
            <span>100</span>
          </div>
        </div>

        {/* Spoiler Controls */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Eye size={16} className="text-purple-500" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Spoiler Controls</h3>
          </div>
          <div className="space-y-4">
            {[
              { id: 'nose', label: 'Nose', color: 'orange' },
              { id: 'palate', label: 'Palate', color: 'blue' },
              { id: 'texture', label: 'Texture', color: 'emerald' },
              { id: 'finish', label: 'Finish', color: 'purple' },
              { id: 'untagged', label: 'Untagged', color: 'gray' }
            ].map((p) => (
              <div key={p.id} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${p.id === 'nose' ? 'text-orange-500' :
                    p.id === 'palate' ? 'text-blue-500' :
                      p.id === 'texture' ? 'text-emerald-500' :
                        p.id === 'finish' ? 'text-purple-500' :
                          'text-[var(--text-secondary)]'
                    }`}>{p.label}</span>
                  <span className="text-[9px] text-[var(--text-muted)] uppercase">Visibility</span>
                </div>
                <div className="grid grid-cols-3 gap-1 p-1 bg-[var(--bg-input)] rounded-md border border-[var(--border-primary)]">
                  {[
                    { id: 'hidden', label: 'Hide', icon: EyeOff },
                    { id: 'normal', label: 'Auto', icon: Hash },
                    { id: 'revealed', label: 'Show', icon: Eye }
                  ].map((v) => {
                    const isActive = phaseVisibility[p.id] === v.id;
                    const Icon = v.icon;
                    return (
                      <button
                        key={v.id}
                        onClick={() => setPhaseVisibility(p.id, v.id as any)}
                        className={`flex items-center justify-center gap-1.5 py-1.5 rounded text-[9px] font-bold uppercase transition-all ${isActive
                          ? (p.id === 'nose' ? 'bg-orange-500 text-white shadow-sm' :
                            p.id === 'palate' ? 'bg-blue-500 text-white shadow-sm' :
                              p.id === 'texture' ? 'bg-emerald-500 text-white shadow-sm' :
                                p.id === 'finish' ? 'bg-purple-500 text-white shadow-sm' :
                                  'bg-[var(--text-secondary)] text-white shadow-sm')
                          : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-main)]'
                          }`}
                      >
                        <Icon size={10} />
                        {v.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-[var(--border-primary)] space-y-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-primary)]">All Categories</span>
                <span className="text-[9px] text-[var(--text-muted)] uppercase">Master Control</span>
              </div>
              <div className="grid grid-cols-3 gap-1 p-1 bg-[var(--bg-input)] rounded-md border border-[var(--border-primary)]">
                {[
                  { id: 'hidden', label: 'Hide', icon: EyeOff },
                  { id: 'normal', label: 'Auto', icon: Hash },
                  { id: 'revealed', label: 'Show', icon: Eye }
                ].map((v) => {
                  const allMatch = Object.values(phaseVisibility).every(val => val === v.id);
                  const Icon = v.icon;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setAllPhaseVisibility(v.id as any)}
                      className={`flex items-center justify-center gap-1.5 py-1.5 rounded text-[9px] font-bold uppercase transition-all ${allMatch
                        ? 'bg-orange-500 text-white shadow-sm'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-main)]'
                        }`}
                    >
                      <Icon size={10} />
                      {v.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <p className="mt-4 text-[9px] text-[var(--text-muted)] leading-relaxed italic">
            "Auto" respects individual message spoilers. "Hide" forces all messages of that phase into spoilers. "Show" reveals everything.
          </p>
        </div>
      </aside>
    </div>
  );
}
