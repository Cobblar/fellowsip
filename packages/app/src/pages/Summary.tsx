import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Loader2 } from 'lucide-react';
import { useSessionSummary, useUpdateSummary, useUpdateSharing, usePublicSummary, useSession, useComparisonSummary } from '../api/sessions';
import { getProductIcon } from '../utils/productIcons';
import { useCurrentUser } from '../api/auth';
import type { Participant } from '../types';

// Sub-components
import { SummaryHeader } from '../components/Summary/SummaryHeader';
import { SharingControls } from '../components/Summary/SharingControls';
import { TastingNote } from '../components/Summary/TastingNote';
import { GroupSynthesis } from '../components/Summary/GroupSynthesis';

interface TasterSummary {
    userId: string;
    nose: string;
    palate: string;
    finish: string;
    observations: string;
}

interface TastingSummary {
    id: string;
    sessionId: string;
    nose: string;
    palate: string;
    finish: string;
    observations: string;
    metadata: {
        participants?: string[];
        [key: string]: any;
    };
    tasterSummaries?: TasterSummary[];
    participants?: Array<{
        userId: string;
        rating: number | null;
        displayName: string | null;
        avatarUrl: string | null;
        sharePersonalSummary?: boolean;
        shareGroupSummary?: boolean;
        shareSessionLog?: boolean;
    }>;
    sessionLogAvailable?: boolean;
    createdAt: string;
}

interface SummaryProps {
    publicMode?: boolean;
}

export function Summary({ publicMode = false }: SummaryProps) {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const isAnalyzingParam = searchParams.get('analyzing') === 'true';
    const productParam = searchParams.get('product');
    const queryClient = useQueryClient();

    const { data: currentUserData } = useCurrentUser();
    const currentUser = currentUserData?.user;

    // Initialize with product from URL params, or default to 0
    const initialProductIndex = productParam ? parseInt(productParam, 10) : 0;
    const [activeProductIndex, setActiveProductIndex] = useState(initialProductIndex);
    const { data: sessionData } = useSession(id || '');
    const session = sessionData?.session;

    // Enable polling if we're in analyzing mode and summary isn't found yet
    const [shouldPoll, setShouldPoll] = useState(isAnalyzingParam);

    const { data: sessionSummaryData, isLoading: sessionSummaryLoading } = useSessionSummary(
        id || '',
        activeProductIndex,
        shouldPoll ? 3000 : false
    );
    const { data: publicSessionData, isLoading: publicSessionLoading } = usePublicSummary(id || '');
    const { data: comparisonData } = useComparisonSummary(id || '');

    const summaryData = publicMode ? publicSessionData?.summary : sessionSummaryData?.summary;
    const isLoading = publicMode ? publicSessionLoading : sessionSummaryLoading;

    // Stop polling once summary is found
    useEffect(() => {
        if (summaryData && shouldPoll) {
            setShouldPoll(false);
        }
    }, [summaryData, shouldPoll]);

    const updateSummary = useUpdateSummary();
    const updateSharing = useUpdateSharing();

    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
    const [isEditingNotes, setIsEditingNotes] = useState(false);
    const [editData, setEditData] = useState<Partial<TasterSummary> & { rating?: number }>({});

    const summary = summaryData as TastingSummary | undefined;
    const comparison = comparisonData?.comparison;
    const participants = (summaryData?.participants || []) as Participant[];

    const userParticipant = participants.find(p => p.userId === currentUser?.id);

    useEffect(() => {
        if (summary && !selectedMemberId) {
            // 1. Try to select current user's summary
            const hasUserSummary = summary.tasterSummaries?.some(
                (s: TasterSummary) => s.userId === currentUser?.id
            );

            if (hasUserSummary && currentUser?.id) {
                setSelectedMemberId(currentUser.id);
            }
            // 2. If not logged in or no user summary, select the first available shared summary
            else if (summary.tasterSummaries && summary.tasterSummaries.length > 0) {
                setSelectedMemberId(summary.tasterSummaries[0].userId);
            }
        }
    }, [summary, currentUser, selectedMemberId]);

    const handleEdit = () => {
        if (!summary || publicMode) return;

        const userSummary = summary.tasterSummaries?.find((s: TasterSummary) => s.userId === currentUser?.id);
        const userRating = participants.find(p => p.userId === currentUser?.id)?.rating;

        setEditData({
            nose: userSummary?.nose || '',
            palate: userSummary?.palate || '',
            finish: userSummary?.finish || '',
            observations: userSummary?.observations || '',
            rating: userRating ?? undefined
        });
        setIsEditingNotes(true);
    };

    const handleSave = async () => {
        if (!id || publicMode) return;
        try {
            await updateSummary.mutateAsync({
                id,
                data: {
                    nose: editData.nose,
                    palate: editData.palate,
                    finish: editData.finish,
                    observations: editData.observations,
                    rating: editData.rating
                }
            });

            queryClient.invalidateQueries({ queryKey: ['session', id] });
            queryClient.invalidateQueries({ queryKey: ['publicSummary', id] });

            setIsEditingNotes(false);
        } catch (err) {
            console.error('Failed to update summary:', err);
        }
    };

    if (isLoading || (shouldPoll && !summary)) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-[var(--bg-main)]">
                <div className="w-20 h-20 relative mb-8">
                    <div className="absolute inset-0 border-4 border-orange-500/10 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="text-orange-500 animate-pulse" size={32} />
                    </div>
                </div>
                <h2 className="text-2xl font-black text-[var(--text-primary)] mb-3 tracking-tight">
                    {shouldPoll ? 'Generating Your Tasting Notes...' : 'Loading Summary...'}
                </h2>
                <p className="text-[var(--text-secondary)] max-w-sm mx-auto leading-relaxed">
                    {shouldPoll
                        ? session?.isSolo
                            ? 'Our AI is synthesizing your notes into a personal summary. This usually takes about 10-15 seconds.'
                            : 'Our AI is synthesizing everyone\'s perspectives into a collective summary. This usually takes about 10-15 seconds.'
                        : 'Fetching the latest session data for you.'}
                </p>
                {shouldPoll && (
                    <div className="mt-8 flex items-center gap-2 px-4 py-2 bg-orange-500/5 border border-orange-500/20 rounded-full">
                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-ping"></div>
                        <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">AI Synthesis in Progress</span>
                    </div>
                )}
            </div>
        );
    }

    if (!session || !summary) {
        return (
            <div className="p-8 text-center">
                <h2 className="heading-lg mb-2">Summary Not Found</h2>
                <p className="text-[var(--text-secondary)] mb-6">This session may not have a summary yet or it is private.</p>
                <button onClick={() => navigate('/')} className="btn-orange">Return Home</button>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <SummaryHeader
                session={session || summaryData}
                publicMode={publicMode}
                onViewSessionLog={() => navigate(`/session/${id}`)}
                onCopyPublicLink={() => {
                    const url = `${window.location.origin}/session/${id}/summary/public`;
                    navigator.clipboard.writeText(url);
                    alert('Public link copied to clipboard!');
                }}
            />

            {/* Sharing Controls */}
            {!publicMode && userParticipant && (
                <SharingControls
                    userParticipant={userParticipant}
                    onUpdateSharing={(data) => updateSharing.mutate({ sessionId: id!, data })}
                />
            )}

            {session?.products && session.products.length > 1 && (
                <div className="flex gap-2 p-1 bg-[var(--bg-sidebar)] rounded-lg border border-[var(--border-primary)] mb-8 max-w-2xl mx-auto">
                    {session.products.map((product, idx) => (
                        <button
                            key={idx}
                            onClick={() => setActiveProductIndex(idx)}
                            className={`flex-1 py-3 px-4 rounded-md text-sm font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${activeProductIndex === idx
                                ? 'bg-orange-500 text-white shadow-lg'
                                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-main)]'
                                }`}
                        >
                            <span>{getProductIcon(product.productType || '')}</span>
                            <span className="truncate">
                                {product.productName || `Product ${idx + 1}`}
                            </span>
                        </button>
                    ))}
                </div>
            )}

            {comparison && (
                <div className="mb-12 p-6 bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-500/20 rounded-2xl">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                            <MessageSquare size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-[var(--text-primary)] tracking-tight">Comparative Notes</h3>
                            <p className="text-xs text-[var(--text-secondary)]">Comparing {session?.products?.length || 2} products</p>
                        </div>
                    </div>
                    <p className="text-sm text-[var(--text-primary)] leading-relaxed">
                        {comparison.comparativeNotes}
                    </p>
                </div>
            )}

            <div className="mb-6">
                <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">
                    {session?.products?.[activeProductIndex]?.productName || 'Product Summary'}
                </h2>
            </div>

            <div className={`grid grid-cols-1 ${session?.isSolo ? '' : 'md:grid-cols-2'} gap-8 md:gap-12`}>
                <TastingNote
                    summary={summary}
                    currentUser={currentUser}
                    selectedMemberId={selectedMemberId}
                    setSelectedMemberId={setSelectedMemberId}
                    isEditingNotes={isEditingNotes}
                    setIsEditingNotes={setIsEditingNotes}
                    editData={editData}
                    setEditData={setEditData}
                    participants={participants}
                    publicMode={publicMode}
                    onEdit={handleEdit}
                    onSave={handleSave}
                    onTasterClick={(userId) => navigate(`/profile/${userId}/public`)}
                    isSolo={session?.isSolo}
                />

                {!session?.isSolo && (
                    <GroupSynthesis
                        summary={summary}
                        publicMode={publicMode}
                        participants={participants}
                    />
                )}
            </div>

            {/* Public Session Log Link */}
            {publicMode && summary?.sessionLogAvailable && (
                <div className="mt-12 pt-8 border-t border-[var(--border-primary)] text-center">
                    <div className="inline-block p-6 bg-[var(--bg-card)] rounded-xl border border-[var(--border-primary)]">
                        <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500 mx-auto mb-4">
                            <MessageSquare size={24} />
                        </div>
                        <h2 className="text-lg font-bold text-[var(--text-primary)] mb-2">Session Log Available</h2>
                        <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-md mx-auto">
                            The chat history for this session has been made public by all participants.
                        </p>
                        <button
                            onClick={() => navigate(`/session/${id}/log/public`)}
                            className="btn-primary flex items-center gap-2 mx-auto"
                        >
                            <MessageSquare size={18} />
                            View Public Session Log
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
