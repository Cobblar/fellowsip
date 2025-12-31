import { useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';
import { useFriends, useFriendsSessions, useMyJoinRequests, useRequestToJoin, useSendFriendRequest, usePendingRequests, useAcceptFriendRequest, useRejectFriendRequest } from '../api/friends';
import { useAllSummaries, useUserSessions } from '../api/sessions';
import { useState, useEffect } from 'react';
import { useCurrentUser } from '../api/auth';
import { OnboardingModal } from '../components/OnboardingModal';

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

    const { data: friendsData, isLoading: friendsLoading } = useFriends();
    const { data: friendsSessionsData } = useFriendsSessions();
    const { data: myJoinRequestsData } = useMyJoinRequests();
    const { data: summariesData } = useAllSummaries();
    const { data: sessionsData } = useUserSessions();
    const requestToJoin = useRequestToJoin();

    const [requestedSessions, setRequestedSessions] = useState<Set<string>>(new Set());
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [joinSessionId, setJoinSessionId] = useState('');
    const [showJoinInput, setShowJoinInput] = useState(false);
    const [isAddingFriend, setIsAddingFriend] = useState(false);
    const [friendEmail, setFriendEmail] = useState('');
    const [showPendingRequests, setShowPendingRequests] = useState(false);
    const sendFriendRequest = useSendFriendRequest();
    const { data: pendingData } = usePendingRequests();
    const acceptRequest = useAcceptFriendRequest();
    const rejectRequest = useRejectFriendRequest();
    const pendingRequests = pendingData?.requests || [];

    const friends = friendsData?.friends || [];
    const friendsSessions = friendsSessionsData?.sessions || [];
    const myJoinRequests = myJoinRequestsData?.requests || [];
    const summaries = summariesData?.summaries || [];
    const allSessions = sessionsData?.sessions || [];

    const activeSessions = allSessions.filter(s => s.status === 'active');

    // Get IDs of friends who are currently in an active session (hosting)
    const activeFriendIds = new Set(friendsSessions.map(s => s.host?.id).filter(Boolean));

    // Split friends into active and inactive
    const activeFriends = friends.filter(f => activeFriendIds.has(f.friend.id));
    const inactiveFriends = friends.filter(f => !activeFriendIds.has(f.friend.id));

    // Helper to get join request status for a session
    const getJoinStatus = (sessionId: string): 'none' | 'pending' | 'approved' | 'rejected' => {
        const request = myJoinRequests.find(r => r.sessionId === sessionId);
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

    const handleFriendClick = (friendId: string) => {
        navigate(`/profile/${friendId}/public`);
        setIsSidebarOpen(false);
    };

    return (
        <div className="h-full flex overflow-hidden relative">
            {/* Mobile Sidebar Toggle */}
            <button
                onClick={() => setIsSidebarOpen(true)}
                className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-orange-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-orange-600 transition-colors md:hidden"
            >
                <Users size={24} />
            </button>

            <FriendsSidebar
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
                friends={friends}
                friendsLoading={friendsLoading}
                isAddingFriend={isAddingFriend}
                setIsAddingFriend={setIsAddingFriend}
                friendEmail={friendEmail}
                setFriendEmail={setFriendEmail}
                onSendFriendRequest={(email) => sendFriendRequest.mutate(email, { onSuccess: () => setFriendEmail('') })}
                sendFriendRequestPending={sendFriendRequest.isPending}
                sendFriendRequestError={sendFriendRequest.error}
                sendFriendRequestSuccess={sendFriendRequest.isSuccess}
                pendingRequests={pendingRequests}
                showPendingRequests={showPendingRequests}
                setShowPendingRequests={setShowPendingRequests}
                onAcceptRequest={(id) => acceptRequest.mutate(id)}
                onRejectRequest={(id) => rejectRequest.mutate(id)}
                acceptRequestPending={acceptRequest.isPending}
                rejectRequestPending={rejectRequest.isPending}
                activeFriends={activeFriends}
                inactiveFriends={inactiveFriends}
                onFriendClick={handleFriendClick}
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
                        friendsSessions={friendsSessions}
                        getJoinStatus={getJoinStatus}
                        onJoinSession={(sessionId) => navigate(`/session/${sessionId}`)}
                        onRequestToJoin={handleRequestToJoin}
                        requestToJoinPending={requestToJoin.isPending}
                    />

                    <RecentSummaries
                        summaries={summaries}
                        onViewAll={() => navigate('/my-cellar')}
                        onViewSummary={(sessionId) => navigate(`/session/${sessionId}/summary`)}
                    />
                </div>
            </div>
            <OnboardingModal isOpen={showOnboarding} onClose={() => setShowOnboarding(false)} />
        </div>
    );
}
