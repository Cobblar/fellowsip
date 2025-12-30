import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { MessageSquare } from 'lucide-react';
import { useSessionSummary, useUpdateSummary, useUpdateSharing, usePublicSummary } from '../api/sessions';
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
    const queryClient = useQueryClient();

    const { data: currentUserData } = useCurrentUser();
    const currentUser = currentUserData?.user;

    const { data: sessionSummaryData, isLoading: sessionSummaryLoading } = useSessionSummary(id || '');
    const { data: publicSessionData, isLoading: publicSessionLoading } = usePublicSummary(id || '');

    const summaryData = publicMode ? publicSessionData?.summary : sessionSummaryData?.summary;
    const isLoading = publicMode ? publicSessionLoading : sessionSummaryLoading;

    const updateSummary = useUpdateSummary();
    const updateSharing = useUpdateSharing();

    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
    const [isEditingNotes, setIsEditingNotes] = useState(false);
    const [editData, setEditData] = useState<Partial<TasterSummary> & { rating?: number }>({});

    const session = summaryData;
    const summary = summaryData as TastingSummary | undefined;
    const participants = (summaryData?.participants || []) as Participant[];

    const userParticipant = participants.find(p => p.userId === currentUser?.id);

    useEffect(() => {
        if (summary && currentUser?.id && !selectedMemberId) {
            const hasUserSummary = summary.tasterSummaries?.some(
                (s: TasterSummary) => s.userId === currentUser.id
            );
            if (hasUserSummary) {
                setSelectedMemberId(currentUser.id);
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

    if (isLoading) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-[var(--bg-main)]">
                <div className="w-16 h-16 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mb-6"></div>
                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Loading Summary...</h2>
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
                session={session}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
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
                />

                <GroupSynthesis
                    summary={summary}
                    publicMode={publicMode}
                    participants={participants}
                />
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
