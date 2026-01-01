import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle, Star, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { getProductIcon } from '../utils/productIcons';
import { useSession, useEndSession, useTransferHost } from '../api/sessions';
import { useSessionJoinRequests, useApproveJoinRequest, useRejectJoinRequest } from '../api/friends';
import { useChatContext } from '../contexts/ChatContext';
import { MessageList } from '../components/MessageList';
import { MessageInput } from '../components/MessageInput';
import { LivestreamEmbed } from '../components/LivestreamEmbed';
import { PostSessionModal } from '../components/PostSessionModal';
import { api } from '../api/client';

// Sub-components
import { SpoilerDefaultsModal, SpoilerControlsPanel } from '../components/ChatRoom/SpoilerControls';
import { EndSessionModal, JoinRequestsPanel, ConfirmationDialog, ManageBansModal } from '../components/ChatRoom/HostControls';
import { ParticipantList } from '../components/ChatRoom/ParticipantList';
import { ChatHeader } from '../components/ChatRoom/ChatHeader';
import { SummaryPanel } from '../components/ChatRoom/SummaryPanel';

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'this', 'that', 'from', 'have', 'been', 'was', 'were', 'are', 'you', 'your', 'our', 'their', 'they', 'them',
  'but', 'not', 'what', 'all', 'any', 'can', 'out', 'how', 'who', 'which', 'when', 'where', 'why', 'about', 'into', 'over', 'after',
  'some', 'more', 'most', 'than', 'then', 'just', 'like', 'well', 'only', 'very', 'even', 'back', 'also', 'will', 'would', 'could', 'should',
  'get', 'got', 'has', 'had', 'did', 'does', 'done', 'make', 'made', 'take', 'took', 'come', 'came', 'give', 'gave', 'find', 'found',
  'think', 'thought', 'know', 'knew', 'look', 'looked', 'want', 'wanted', 'tell', 'told', 'work', 'worked', 'call', 'called',
  'try', 'tried', 'ask', 'asked', 'need', 'needed', 'feel', 'felt', 'become', 'became', 'leave', 'left', 'put', 'mean', 'meant', 'keep', 'kept',
  'let', 'begin', 'began', 'seem', 'seemed', 'help', 'helped', 'talk', 'talked', 'turn', 'turned', 'start', 'started', 'show', 'showed',
  'hear', 'heard', 'play', 'played', 'run', 'ran', 'move', 'moved', 'live', 'lived', 'believe', 'believed', 'bring', 'brought', 'happen', 'happened',
  'write', 'wrote', 'sit', 'sat', 'stand', 'stood', 'lose', 'lost', 'pay', 'paid', 'meet', 'met', 'include', 'included', 'continue', 'continued',
  'set', 'learn', 'learned', 'change', 'changed', 'lead', 'led', 'understand', 'understood', 'watch', 'watched', 'follow', 'followed', 'stop', 'stopped',
  'create', 'created', 'speak', 'spoke', 'read', 'allow', 'allowed', 'add', 'added', 'spend', 'spent', 'grow', 'grew', 'open', 'opened', 'walk', 'walked',
  'win', 'won', 'offer', 'offered', 'remember', 'remembered', 'love', 'loved', 'consider', 'considered', 'appear', 'appeared', 'buy', 'bought', 'wait', 'waited',
  'serve', 'served', 'die', 'died', 'send', 'sent', 'expect', 'expected', 'build', 'built', 'stay', 'stayed', 'fall', 'fell', 'cut', 'reach', 'reached',
  'kill', 'killed', 'remain', 'remained', 'suggest', 'suggested', 'raise', 'raised', 'pass', 'passed', 'sell', 'sold', 'require', 'required', 'report', 'reported',
  'decide', 'decided', 'pull', 'pulled', 'really', 'quite', 'rather', 'almost', 'nearly', 'enough', 'too', 'much', 'little', 'less', 'least'
]);

export function ChatRoom() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [copied, setCopied] = useState<'id' | 'link' | null>(null);
  const { data: sessionData, isLoading, refetch: refetchSession } = useSession(id!);
  const {
    messages,
    activeUsers,
    moderators,
    sendMessage,
    deleteMessage,
    editMessage,
    makeModerator,
    revealAllSpoilers,
    isConnected,
    error,
    sessionEnded,
    sessionEndedBy,
    sessionEndedLive,
    hostId: socketHostId,
    revealedMessageIds,
    globallyRevealedMessageIds,
    updateRating,
    updateValueGrade,
    averageRating,
    averageRatings,
    valueGradeDistributions,
    phaseVisibility,
    setPhaseVisibility,
    setAllPhaseVisibility,
    spoilerDefaults,
    setSpoilerDefault,
    livestreamUrl,
    customTags,
    currentUserId,
    injectDebugHistory,
    readyCheckActive,
    readyUsers,
    startReadyCheck,
    endReadyCheck,
    markReady,
    markUnready,
    isMuted,
    mutedUsers,
    kickedUsers,
    muteUser,
    unmuteUser,
    kickUser,
    unkickUser,
    getBannedUsers,
    unmodUser,
    summaryId,
  } = useChatContext();
  const { mutate: endSession, isPending: isEnding } = useEndSession();
  const { mutate: transferHost, isPending: isTransferring } = useTransferHost();

  const { data: joinRequestsData } = useSessionJoinRequests(id!);
  const approveJoinRequest = useApproveJoinRequest();
  const rejectJoinRequest = useRejectJoinRequest();
  const joinRequests = joinRequestsData?.requests || [];

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
  const [showPostSessionModal, setShowPostSessionModal] = useState(false);
  const [showSpoilerDefaults, setShowSpoilerDefaults] = useState(false);
  const [activeProductIndex, setActiveProductIndex] = useState(0);

  const session = sessionData?.session;
  const isSessionEnded = sessionEnded || session?.status === 'ended';
  const effectiveSessionEndedBy = sessionEndedBy || (session?.status === 'ended' ? 'The host' : null);

  const effectiveHostId = socketHostId || session?.hostId;
  const isHost = effectiveHostId === currentUserId;

  useEffect(() => {
    // Only show modal when session ended while user was present (not when joining already-ended session)
    if (sessionEndedLive && currentUserId) {
      setShowPostSessionModal(true);
    }
  }, [sessionEndedLive, currentUserId]);

  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [showStreamInput, setShowStreamInput] = useState(false);
  const [streamInputValue, setStreamInputValue] = useState('');
  const [activeSidebar, setActiveSidebar] = useState<'tasters' | 'summary' | null>(
    (window.innerWidth < 768) ? null : (currentUserId ? null : 'summary')
  );
  const [isTastersMenuOpen, setIsTastersMenuOpen] = useState(false);
  const [showManageBans, setShowManageBans] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'kick' | 'mute';
    userId: string;
    displayName: string | null;
  } | null>(null);
  const [expandedActionUserId, setExpandedActionUserId] = useState<string | null>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const tastersMenuRef = useRef<HTMLDivElement>(null);

  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false);

  const [sidebarWidth, setSidebarWidth] = useState(600);
  const [isResizing, setIsResizing] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const stopResizing = () => {
    setIsResizing(false);
  };

  const resize = (e: MouseEvent) => {
    if (isResizing) {
      const newWidth = e.clientX;
      if (newWidth >= 240 && newWidth <= 800) {
        setSidebarWidth(newWidth);
      }
    }
  };

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
    } else {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (actionsRef.current && !actionsRef.current.contains(event.target as Node)) {
        setIsActionsOpen(false);
      }
      if (tastersMenuRef.current && !tastersMenuRef.current.contains(event.target as Node)) {
        setIsTastersMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUpdateLivestream = async () => {
    if (!id) return;
    try {
      await api.patch(`/sessions/${id}`, { livestreamUrl: streamInputValue || null });
      setShowStreamInput(false);
      setStreamInputValue('');
      setIsActionsOpen(false);
    } catch (error) {
      console.error('Failed to update livestream:', error);
    }
  };

  const handleAnalyze = () => {
    if (!id) return;
    endSession({ sessionId: id, shouldAnalyze: true }, {
      onSuccess: () => {
        // No immediate redirect, wait for modal
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
        // No immediate redirect, wait for modal
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

  const isModerator = currentUserId ? moderators.includes(currentUserId) : false;
  const canModerate = isHost || isModerator;

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
      <SpoilerDefaultsModal
        showSpoilerDefaults={showSpoilerDefaults}
        setShowSpoilerDefaults={setShowSpoilerDefaults}
        spoilerDefaults={spoilerDefaults}
        setSpoilerDefault={setSpoilerDefault}
      />

      <EndSessionModal
        showEndModal={showEndModal}
        setShowEndModal={setShowEndModal}
        onEndSession={handleEndSession}
      />

      <div
        className={`sidebar-overlay ${activeSidebar ? 'open' : ''}`}
        onClick={() => setActiveSidebar(null)}
      />

      <aside
        className={`sidebar ${activeSidebar === 'tasters' ? 'open' : ''} bg-[var(--bg-sidebar)] border-r border-[var(--border-primary)] flex flex-col overflow-visible transition-all duration-300 relative group/sidebar`}
        style={{ width: leftSidebarCollapsed ? '48px' : (livestreamUrl ? `${sidebarWidth}px` : '240px') }}
      >
        <button
          onClick={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
          className={`hidden md:flex absolute top-20 -right-3 z-50 p-1 rounded-md bg-[var(--bg-card)] border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-orange-500 transition-all shadow-md ${leftSidebarCollapsed ? '' : 'opacity-0 group-hover/sidebar:opacity-100'}`}
          title={leftSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {leftSidebarCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
        </button>

        <div className="flex-1 flex flex-col overflow-hidden">
          {(isMobile || !leftSidebarCollapsed) && (
            <>
              {livestreamUrl && !isMobile && (
                <div className="hidden md:block p-4 border-b border-[var(--border-primary)]">
                  <LivestreamEmbed url={livestreamUrl} />
                </div>
              )}

              <ParticipantList
                activeUsers={activeUsers}
                moderators={moderators}
                effectiveHostId={effectiveHostId}
                currentUserId={currentUserId}
                isHost={isHost}
                canModerate={canModerate}
                readyCheckActive={readyCheckActive}
                readyUsers={readyUsers}
                onStartReadyCheck={startReadyCheck}
                onEndReadyCheck={endReadyCheck}
                onMarkReady={markReady}
                onMarkUnready={markUnready}
                onGetBannedUsers={getBannedUsers}
                onShowManageBans={setShowManageBans}
                onMakeModerator={makeModerator}
                onUnmodUser={unmodUser}
                onTransferHost={handleTransferHost}
                onMuteUser={(userId, displayName) => setConfirmAction({ type: 'mute', userId, displayName })}
                onKickUser={(userId, displayName) => setConfirmAction({ type: 'kick', userId, displayName })}
                mutedUsers={mutedUsers}
                unmuteUser={unmuteUser}
                isTastersMenuOpen={isTastersMenuOpen}
                setIsTastersMenuOpen={setIsTastersMenuOpen}
                tastersMenuRef={tastersMenuRef}
                expandedActionUserId={expandedActionUserId}
                setExpandedActionUserId={setExpandedActionUserId}
                isTransferring={isTransferring}
                onCloseSidebar={() => setActiveSidebar(null)}
                activeProductIndex={activeProductIndex}
              />

              <JoinRequestsPanel
                joinRequests={joinRequests}
                onApproveJoinRequest={(requestId) => approveJoinRequest.mutate({ requestId, sessionId: id! })}
                onRejectJoinRequest={(requestId) => rejectJoinRequest.mutate({ requestId, sessionId: id! })}
              />
            </>
          )}
        </div>
      </aside>

      {livestreamUrl && !isSessionEnded && !leftSidebarCollapsed && (
        <div
          className={`hidden md:flex w-1 hover:w-1.5 bg-transparent hover:bg-orange-500/50 cursor-col-resize transition-all z-10 items-center justify-center group ${isResizing ? 'bg-orange-500/50 w-1.5' : ''}`}
          onMouseDown={startResizing}
        >
          <div className={`w-0.5 h-8 bg-[var(--border-primary)] rounded-full group-hover:bg-orange-500/50 ${isResizing ? 'bg-orange-500/50' : ''}`} />
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 border-r border-[var(--border-primary)]">
        <ChatHeader
          session={session}
          id={id}
          activeUsers={activeUsers}
          averageRating={averageRating}
          onNavigateBack={() => navigate('/')}
          onOpenTastersSidebar={() => setActiveSidebar('tasters')}
          onCopySessionId={copySessionId}
          copied={copied}
          onCopyJoinLink={copyJoinLink}
          isHost={isHost}
          summaryId={summaryId}
          isSessionEnded={isSessionEnded}
          onAnalyze={handleAnalyze}
          isEnding={isEnding}
          onViewSummary={() => navigate(`/session/${id}/summary`)}
          isActionsOpen={isActionsOpen}
          setIsActionsOpen={setIsActionsOpen}
          actionsRef={actionsRef}
          showStreamInput={showStreamInput}
          setShowStreamInput={setShowStreamInput}
          streamInputValue={streamInputValue}
          setStreamInputValue={setStreamInputValue}
          onUpdateLivestream={handleUpdateLivestream}
          livestreamUrl={livestreamUrl}
          onRevealAllSpoilers={revealAllSpoilers}
          onShowSpoilerDefaults={() => setShowSpoilerDefaults(true)}
          onInjectDebugHistory={injectDebugHistory}
          onShowEndModal={() => setShowEndModal(true)}
          onOpenSummarySidebar={() => setActiveSidebar('summary')}
          currentUserId={currentUserId}
          activeProductIndex={activeProductIndex}
          averageRatings={averageRatings}
        />

        {isSessionEnded && (
          <div className="bg-red-500/10 border-b border-red-500/30 px-4 md:px-6 py-3 md:py-4">
            <div className="max-w-3xl mx-auto flex items-center gap-3">
              <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
              <div>
                <p className="text-xs md:text-sm font-medium text-red-400">
                  {effectiveSessionEndedBy} has ended the session
                </p>
                <p className="text-[10px] md:text-xs text-red-400/70">
                  Chat is now closed. You can still view the conversation.
                </p>
              </div>
            </div>
          </div>
        )}

        {livestreamUrl && isMobile && !isSessionEnded && (
          <div className="md:hidden bg-black border-b border-[var(--border-primary)]">
            <LivestreamEmbed url={livestreamUrl} className="rounded-none" />
          </div>
        )}

        {/* Chat Area - Conditional Layout based on product count */}
        {(session?.products?.length ?? 1) > 1 ? (
          // Multi-product: Carousel card layout
          <div className="flex-1 chat-carousel-container">
            {session!.products.map((product, idx) => {
              const total = session!.products.length;
              const isActive = activeProductIndex === idx;

              let cardClass = "chat-card";
              if (isActive) {
                cardClass += " active";
              } else {
                // Calculate relative position for looping/balanced feel
                const diff = (idx - activeProductIndex + total) % total;

                if (diff === 1 || (total === 2 && diff === 1)) {
                  cardClass += " right";
                } else if (diff === total - 1) {
                  cardClass += " left";
                } else if (diff <= total / 2) {
                  cardClass += " hidden-right";
                } else {
                  cardClass += " hidden-left";
                }
              }

              return (
                <div
                  key={idx}
                  className={cardClass}
                  onClick={() => !isActive && setActiveProductIndex(idx)}
                >
                  {/* Card Header (Desktop only) */}
                  {!isMobile && (
                    <div className="chat-card-header">
                      <div className="product-info">
                        <span className="product-icon">{getProductIcon(product.productType || '')}</span>
                        <span className="product-name">{product.productName || `Product ${idx + 1}`}</span>
                      </div>
                      {isActive && averageRatings[idx] !== null && (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-orange-500/10 rounded text-[10px] font-bold text-orange-500">
                          <Star size={10} fill="currentColor" />
                          {averageRatings[idx]?.toFixed(1)} Avg
                        </div>
                      )}
                    </div>
                  )}

                  <div className={`flex-1 overflow-y-auto bg-[var(--bg-main)] p-4 md:p-6 custom-scrollbar ${!isActive ? 'pointer-events-none' : ''}`}>
                    <div className="max-w-3xl mx-auto space-y-6">
                      {isActive && (
                        <div className="text-center">
                          <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-main)]/50 px-3 py-1 rounded-full border border-[var(--border-primary)]">
                            Session started {session ? new Date(session.startedAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : ''}
                          </span>
                        </div>
                      )}
                      <MessageList
                        messages={messages.filter(m => m.productIndex === idx)}
                        currentUserId={currentUserId || undefined}
                        canDelete={canModerate}
                        onDeleteMessage={deleteMessage}
                        onEditMessage={editMessage}
                        revealedMessageIds={new Set([...revealedMessageIds, ...globallyRevealedMessageIds])}
                        phaseVisibility={phaseVisibility}
                        summaryId={summaryId}
                      />
                    </div>
                  </div>

                  <div className={`p-3 md:px-6 md:pt-4 md:pb-2 bg-[var(--bg-main)] border-t border-[var(--border-primary)] ${!isActive ? 'pointer-events-none opacity-50' : ''}`}>
                    <div className="max-w-3xl mx-auto">
                      {isSessionEnded ? (
                        <div className="text-center py-3 text-sm text-[var(--text-secondary)] bg-[var(--bg-main)]/30 rounded-lg border border-[var(--border-primary)]">
                          This session has ended. Chat is disabled.
                        </div>
                      ) : isMuted ? (
                        <div className="text-center py-3 text-sm text-yellow-500 bg-yellow-500/5 rounded-lg border border-yellow-500/20 flex items-center justify-center gap-2">
                          <AlertCircle size={16} />
                          You have been muted in this session.
                        </div>
                      ) : (
                        <>
                          {isActive && error && error.includes('Rate limit') && (
                            <div className="mb-2 text-center py-2 text-xs text-orange-500 bg-orange-500/10 rounded-lg border border-orange-500/20 flex items-center justify-center gap-2">
                              <AlertCircle size={14} />
                              {error}
                            </div>
                          )}
                          <MessageInput
                            onSend={(content, phase) => sendMessage(content, phase, idx)}
                            disabled={!isConnected || !isActive || (error?.includes('Rate limit') ?? false)}
                          />
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Single-product: Normal full-width chat layout
          <>
            <div className="flex-1 overflow-y-auto bg-[var(--bg-main)] p-4 md:p-6 custom-scrollbar">
              <div className="max-w-3xl mx-auto space-y-6">
                <div className="text-center">
                  <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-main)]/50 px-3 py-1 rounded-full border border-[var(--border-primary)]">
                    Session started {session ? new Date(session.startedAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : ''}
                  </span>
                </div>
                <MessageList
                  messages={messages.filter(m => m.productIndex === 0 || m.productIndex === undefined || m.productIndex === null)}
                  currentUserId={currentUserId || undefined}
                  canDelete={canModerate}
                  onDeleteMessage={deleteMessage}
                  onEditMessage={editMessage}
                  revealedMessageIds={new Set([...revealedMessageIds, ...globallyRevealedMessageIds])}
                  phaseVisibility={phaseVisibility}
                  summaryId={summaryId}
                />
              </div>
            </div>

            <div className="p-3 md:px-6 md:pt-4 md:pb-2 bg-[var(--bg-main)] border-t border-[var(--border-primary)]">
              <div className="max-w-3xl mx-auto">
                {isSessionEnded ? (
                  <div className="text-center py-3 text-sm text-[var(--text-secondary)] bg-[var(--bg-main)]/30 rounded-lg border border-[var(--border-primary)]">
                    This session has ended. Chat is disabled.
                  </div>
                ) : isMuted ? (
                  <div className="text-center py-3 text-sm text-yellow-500 bg-yellow-500/5 rounded-lg border border-yellow-500/20 flex items-center justify-center gap-2">
                    <AlertCircle size={16} />
                    You have been muted in this session.
                  </div>
                ) : (
                  <>
                    {error && error.includes('Rate limit') && (
                      <div className="mb-2 text-center py-2 text-xs text-orange-500 bg-orange-500/10 rounded-lg border border-orange-500/20 flex items-center justify-center gap-2">
                        <AlertCircle size={14} />
                        {error}
                      </div>
                    )}
                    <MessageInput
                      onSend={(content, phase) => sendMessage(content, phase, 0)}
                      disabled={!isConnected || (error?.includes('Rate limit') ?? false)}
                    />
                  </>
                )}
              </div>
            </div>
          </>
        )}

        {session?.products && session.products.length > 1 && isMobile && (
          <div className="grid grid-cols-3 gap-2 px-4 py-2 bg-[var(--bg-sidebar)] border-t border-[var(--border-primary)]">
            {session.products.map((product, idx) => (
              <button
                key={idx}
                onClick={() => setActiveProductIndex(idx)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${activeProductIndex === idx
                  ? 'bg-orange-500/10 border-orange-500 text-orange-500'
                  : 'bg-[var(--bg-main)] border-[var(--border-primary)] text-[var(--text-muted)]'
                  }`}
              >
                <span className="text-lg">{getProductIcon(product.productType || '')}</span>
                <span className="text-[8px] font-bold uppercase truncate w-full text-center">
                  {product.productName || `P${idx + 1}`}
                </span>
              </button>
            ))}
          </div>
        )}

      </div>

      <aside
        className={`sidebar md:relative md:translate-x-0 right-0 md:left-auto ${activeSidebar === 'summary' ? 'open' : ''} bg-[var(--bg-main)] border-l border-[var(--border-primary)] transition-all duration-300 group/right-sidebar relative overflow-visible`}
        style={{ width: isMobile ? '320px' : (rightSidebarCollapsed ? '48px' : '380px') }}
      >
        <button
          onClick={() => setRightSidebarCollapsed(!rightSidebarCollapsed)}
          className={`hidden md:flex absolute top-20 -left-3 z-50 p-1 rounded-md bg-[var(--bg-card)] border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-orange-500 transition-all shadow-md ${rightSidebarCollapsed ? '' : 'opacity-0 group-hover/right-sidebar:opacity-100'}`}
          title={rightSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {rightSidebarCollapsed ? <PanelRightOpen size={14} /> : <PanelRightClose size={14} />}
        </button>

        <div className={`h-full overflow-y-auto p-6 space-y-6 ${(!isMobile && rightSidebarCollapsed) ? 'hidden' : 'block'}`}>
          <SummaryPanel
            wordFrequencies={wordFrequencies}
            currentUserId={currentUserId}
            activeUsers={activeUsers}
            updateRating={updateRating}
            updateValueGrade={updateValueGrade}
            onCloseSidebar={() => setActiveSidebar(null)}
            products={session?.products}
            activeProductIndex={activeProductIndex}
            averageRatings={averageRatings}
            valueGradeDistributions={valueGradeDistributions}
          />

          <SpoilerControlsPanel
            phaseVisibility={phaseVisibility}
            setPhaseVisibility={setPhaseVisibility}
            setAllPhaseVisibility={setAllPhaseVisibility}
            customTags={customTags}
            showSpoilerDefaults={showSpoilerDefaults}
            setShowSpoilerDefaults={setShowSpoilerDefaults}
            spoilerDefaults={spoilerDefaults}
            setSpoilerDefault={setSpoilerDefault}
          />
        </div>
      </aside>

      <PostSessionModal
        isOpen={showPostSessionModal}
        onClose={() => setShowPostSessionModal(false)}
      />

      <ConfirmationDialog
        confirmAction={confirmAction}
        setConfirmAction={setConfirmAction}
        onMuteUser={muteUser}
        onKickUser={kickUser}
      />

      <ManageBansModal
        showManageBans={showManageBans}
        setShowManageBans={setShowManageBans}
        mutedUsers={mutedUsers}
        kickedUsers={kickedUsers}
        onUnmuteUser={unmuteUser}
        onUnkickUser={unkickUser}
        isHost={isHost}
      />
    </div>
  );
}
