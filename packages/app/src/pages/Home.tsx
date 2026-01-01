import { useNavigate } from 'react-router-dom';
import { useAllSummaries, useUserSessions } from '../api/sessions';
import { useState, useEffect } from 'react';
import { useCurrentUser } from '../api/auth';
import { OnboardingModal } from '../components/OnboardingModal';
import { useRequestToJoin } from '../api/friends';
import { useFriendsLogic } from '../hooks/useFriendsLogic';

// Sub-components
import { FriendsSidebar } from '../components/Home/FriendsSidebar';
import { ActiveSessions } from '../components/Home/ActiveSessions';
import { RecentSummaries } from '../components/Home/RecentSummaries';
import { HomeHeader } from '../components/Home/HomeHeader';

export function Home() {
    const navigate = useNavigate();
    const { data: currentUserData } = useCurrentUser();
    const [showOnboarding, setShowOnboarding] = useState(false);

    useEffect(() => {
        if (currentUserData?.user && currentUserData.user.displayName === null) {
            setShowOnboarding(true);
        }
    }, [currentUserData]);

    const { data: summariesData } = useAllSummaries();
    const { data: sessionsData } = useUserSessions();
    const requestToJoin = useRequestToJoin();

    const friendsLogic = useFriendsLogic();

    const [requestedSessions, setRequestedSessions] = useState<Set<string>>(new Set());
    const [joinSessionId, setJoinSessionId] = useState('');
    const [showJoinInput, setShowJoinInput] = useState(false);

    const summaries = summariesData?.summaries || [];
    const allSessions = sessionsData?.sessions || [];

    const activeSessions = allSessions.filter(s => s.status === 'active');

    // Helper to get join request status for a session
    const getJoinStatus = (sessionId: string): 'none' | 'pending' | 'approved' | 'rejected' => {
        const request = friendsLogic.myJoinRequests.find(r => r.sessionId === sessionId);
        if (request) return request.status;
        if (requestedSessions.has(sessionId)) return 'pending';
        return 'none';
    };

    const handleRequestToJoin = async (sessionId: string) => {
        try {
            await requestToJoin.mutateAsync(sessionId);
            setRequestedSessions(prev => new Set(prev).add(sessionId));
        } catch (error) {
            console.error('Failed to request join:', error);
        }
    };

    const handleJoinById = () => {
        if (joinSessionId.trim()) {
            navigate(`/join/${joinSessionId.trim()}`);
        }
    };

    return (
        <div className="h-full flex overflow-hidden relative">
            <FriendsSidebar
                isSidebarOpen={friendsLogic.isSidebarOpen}
                setIsSidebarOpen={friendsLogic.setIsSidebarOpen}
                friends={friendsLogic.friends}
                friendsLoading={friendsLogic.friendsLoading}
                isAddingFriend={friendsLogic.isAddingFriend}
                setIsAddingFriend={friendsLogic.setIsAddingFriend}
                friendEmail={friendsLogic.friendEmail}
                setFriendEmail={friendsLogic.setFriendEmail}
                onSendFriendRequest={friendsLogic.handleSendFriendRequest}
                sendFriendRequestPending={friendsLogic.sendFriendRequest.isPending}
                sendFriendRequestError={friendsLogic.sendFriendRequest.error}
                sendFriendRequestSuccess={friendsLogic.sendFriendRequest.isSuccess}
                pendingRequests={friendsLogic.pendingRequests}
                showPendingRequests={friendsLogic.showPendingRequests}
                setShowPendingRequests={friendsLogic.setShowPendingRequests}
                onAcceptRequest={(id) => friendsLogic.acceptRequest.mutate(id)}
                onRejectRequest={(id) => friendsLogic.rejectRequest.mutate(id)}
                acceptRequestPending={friendsLogic.acceptRequest.isPending}
                rejectRequestPending={friendsLogic.rejectRequest.isPending}
                activeFriends={friendsLogic.activeFriends}
                inactiveFriends={friendsLogic.inactiveFriends}
                onFriendClick={friendsLogic.handleFriendClick}
            />

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="max-w-5xl mx-auto space-y-8">
                    <HomeHeader
                        showJoinInput={showJoinInput}
                        setShowJoinInput={setShowJoinInput}
                        joinSessionId={joinSessionId}
                        setJoinSessionId={setJoinSessionId}
                        onJoinById={handleJoinById}
                        onCreateSession={() => navigate('/create')}
                    />

                    <ActiveSessions
                        activeSessions={activeSessions}
                        friendsSessions={friendsLogic.friendsSessions}
                        getJoinStatus={getJoinStatus}
                        onJoinSession={(sessionId) => navigate(`/session/${sessionId}`)}
                        onRequestToJoin={handleRequestToJoin}
                        requestToJoinPending={requestToJoin.isPending}
                    />

                    <RecentSummaries
                        summaries={summaries}
                        onViewAll={() => navigate('/tasting-notes')}
                        onViewSummary={(sessionId, productIndex) => navigate(`/session/${sessionId}/summary?product=${productIndex ?? 0}`)}
                    />
                </div>
            </div>
            <OnboardingModal isOpen={showOnboarding} onClose={() => setShowOnboarding(false)} />
        </div>
    );
}
