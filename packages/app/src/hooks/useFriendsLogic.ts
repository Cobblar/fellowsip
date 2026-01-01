import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    useFriends,
    useFriendsSessions,
    useMyJoinRequests,
    useSendFriendRequest,
    usePendingRequests,
    useAcceptFriendRequest,
    useRejectFriendRequest
} from '../api/friends';

export function useFriendsLogic() {
    const navigate = useNavigate();
    const { data: friendsData, isLoading: friendsLoading } = useFriends();
    const { data: friendsSessionsData } = useFriendsSessions();
    const { data: myJoinRequestsData } = useMyJoinRequests();
    const { data: pendingData } = usePendingRequests();

    const sendFriendRequest = useSendFriendRequest();
    const acceptRequest = useAcceptFriendRequest();
    const rejectRequest = useRejectFriendRequest();

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isAddingFriend, setIsAddingFriend] = useState(false);
    const [friendEmail, setFriendEmail] = useState('');
    const [showPendingRequests, setShowPendingRequests] = useState(false);

    const friends = friendsData?.friends || [];
    const friendsSessions = friendsSessionsData?.sessions || [];
    const myJoinRequests = myJoinRequestsData?.requests || [];
    const pendingRequests = pendingData?.requests || [];

    // Get IDs of friends who are currently in an active session (hosting)
    const activeFriendIds = new Set(friendsSessions.map(s => s.host?.id).filter(Boolean));

    // Split friends into active and inactive
    const activeFriends = friends.filter(f => activeFriendIds.has(f.friend.id));
    const inactiveFriends = friends.filter(f => !activeFriendIds.has(f.friend.id));

    const handleFriendClick = (friendId: string) => {
        navigate(`/profile/${friendId}/public`);
        setIsSidebarOpen(false);
    };

    const handleSendFriendRequest = (email: string) => {
        sendFriendRequest.mutate(email, {
            onSuccess: () => setFriendEmail('')
        });
    };

    return {
        friends,
        friendsLoading,
        friendsSessions,
        myJoinRequests,
        pendingRequests,
        activeFriends,
        inactiveFriends,
        isSidebarOpen,
        setIsSidebarOpen,
        isAddingFriend,
        setIsAddingFriend,
        friendEmail,
        setFriendEmail,
        showPendingRequests,
        setShowPendingRequests,
        handleFriendClick,
        handleSendFriendRequest,
        sendFriendRequest,
        acceptRequest,
        rejectRequest,
    };
}
