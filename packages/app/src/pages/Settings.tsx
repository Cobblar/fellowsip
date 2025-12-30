import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Settings as SettingsIcon } from 'lucide-react';
import { api } from '../api/client';
import { useFriends, usePendingRequests, useSendFriendRequest, useAcceptFriendRequest, useRejectFriendRequest, useRemoveFriend, useUpdateAutoMod } from '../api/friends';
import { useCurrentUser, useUpdateProfile } from '../api/auth';
import type { Session } from '../types';

// Sub-components
import { SettingsSidebar } from '../components/Settings/SettingsSidebar';
import { FriendsTab } from '../components/Settings/FriendsTab';
import { ProfileSettingsTab } from '../components/Settings/ProfileSettingsTab';

export function Settings() {
    const navigate = useNavigate();
    const [sessions, setSessions] = useState<Session[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [friendEmail, setFriendEmail] = useState('');
    const [activeTab, setActiveTab] = useState<'friends' | 'settings'>('friends');
    const [showPendingRequests, setShowPendingRequests] = useState(false);
    const [newDisplayName, setNewDisplayName] = useState('');

    const { data: friendsData } = useFriends();
    const { data: pendingData } = usePendingRequests();
    const sendRequest = useSendFriendRequest();
    const acceptRequest = useAcceptFriendRequest();
    const rejectRequest = useRejectFriendRequest();
    const removeFriend = useRemoveFriend();
    const updateAutoMod = useUpdateAutoMod();
    const { data: currentUserData } = useCurrentUser();
    const updateProfile = useUpdateProfile();

    const currentUser = currentUserData?.user;

    const friends = friendsData?.friends || [];
    const pendingRequests = pendingData?.requests || [];

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const sessionRes = await api.get<{ sessions: Session[] }>('/auth/profile/sessions');
                setSessions(sessionRes.sessions);
            } catch (error) {
                console.error('Failed to fetch sessions:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSessions();
    }, []);

    useEffect(() => {
        if (currentUser?.displayName) {
            setNewDisplayName(currentUser.displayName);
        }
    }, [currentUser]);

    const handleLogout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            window.location.href = import.meta.env.VITE_LANDING_URL || 'http://localhost:4321';
        }
    };

    const handleUpdateDisplayName = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDisplayName.trim()) return;

        try {
            await updateProfile.mutateAsync({ displayName: newDisplayName.trim() });
        } catch (error) {
            console.error('Failed to update display name:', error);
        }
    };

    const handleSendFriendRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!friendEmail.trim()) return;

        try {
            await sendRequest.mutateAsync(friendEmail.trim());
            setFriendEmail('');
        } catch (error) {
            console.error('Failed to send friend request:', error);
        }
    };

    if (isLoading) {
        return <div className="p-8 text-[var(--text-secondary)]">Loading profile...</div>;
    }

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto">
            <div className="mb-8">
                <h1 className="heading-xl mb-2">Account Settings</h1>
                <p className="text-sm text-[var(--text-secondary)]">Manage your display name, friends, and account security.</p>
            </div>

            <div className="flex flex-col lg:grid lg:grid-cols-3 gap-8">
                {/* Left: User Info */}
                <SettingsSidebar
                    currentUser={currentUser}
                    sessionsCount={sessions.length}
                    synthesizedCount={sessions.filter(s => s.summaryId).length}
                    friendsCount={friends.length}
                    onNavigate={navigate}
                    onLogout={handleLogout}
                />

                {/* Right: Tabs */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Tab Navigation */}
                    <div className="flex gap-4 border-b border-[var(--border-primary)] overflow-x-auto no-scrollbar">
                        <button
                            onClick={() => setActiveTab('friends')}
                            className={`pb-3 text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'friends'
                                ? 'text-orange-500 border-b-2 border-orange-500'
                                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                }`}
                        >
                            <Users size={14} />
                            Friends
                            {pendingRequests.length > 0 && (
                                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-2">
                                    {pendingRequests.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('settings')}
                            className={`pb-3 text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'settings'
                                ? 'text-orange-500 border-b-2 border-orange-500'
                                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                }`}
                        >
                            <SettingsIcon size={14} />
                            Settings
                        </button>
                    </div>


                    {/* Friends Tab */}
                    {activeTab === 'friends' && (
                        <FriendsTab
                            friends={friends}
                            pendingRequests={pendingRequests}
                            showPendingRequests={showPendingRequests}
                            setShowPendingRequests={setShowPendingRequests}
                            friendEmail={friendEmail}
                            setFriendEmail={setFriendEmail}
                            onSendRequest={handleSendFriendRequest}
                            onAcceptRequest={(id) => acceptRequest.mutate(id)}
                            onRejectRequest={(id) => rejectRequest.mutate(id)}
                            onRemoveFriend={(id) => removeFriend.mutate(id)}
                            onUpdateAutoMod={(data) => updateAutoMod.mutate(data)}
                            onProfileClick={(userId) => navigate(`/profile/${userId}/public`)}
                            sendRequestStatus={{
                                isPending: sendRequest.isPending,
                                isSuccess: sendRequest.isSuccess,
                                isError: sendRequest.isError,
                                error: sendRequest.error
                            }}
                            acceptRequestPending={acceptRequest.isPending}
                            rejectRequestPending={rejectRequest.isPending}
                            removeFriendPending={removeFriend.isPending}
                            updateAutoModPending={updateAutoMod.isPending}
                        />
                    )}

                    {/* Settings Tab */}
                    {activeTab === 'settings' && (
                        <ProfileSettingsTab
                            newDisplayName={newDisplayName}
                            setNewDisplayName={setNewDisplayName}
                            currentUser={currentUser}
                            onUpdateDisplayName={handleUpdateDisplayName}
                            updateProfileStatus={{
                                isPending: updateProfile.isPending,
                                isSuccess: updateProfile.isSuccess,
                                isError: updateProfile.isError,
                                error: updateProfile.error
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
