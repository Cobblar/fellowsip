import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X, CheckCheck, UserPlus, Users, Shield, Zap, MessageCircle } from 'lucide-react';
import { useNotifications, useMarkAsRead, useMarkAllAsRead, useDeleteNotification, type Notification } from '../api/notifications';

export function NotificationDropdown() {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const { data, isLoading } = useNotifications();
    const markAsRead = useMarkAsRead();
    const markAllAsRead = useMarkAllAsRead();
    const deleteNotification = useDeleteNotification();

    const notifications = data?.notifications || [];
    const unreadCount = data?.unreadCount || 0;

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNotificationClick = (notification: Notification) => {
        // Mark as read
        if (!notification.isRead) {
            markAsRead.mutate(notification.id);
        }
        // Navigate if there's a link
        if (notification.link) {
            navigate(notification.link);
            setIsOpen(false);
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'friend_request':
            case 'friend_accepted':
                return <UserPlus size={16} className="text-blue-400" />;
            case 'join_request':
            case 'join_approved':
            case 'join_rejected':
                return <Users size={16} className="text-green-400" />;
            case 'made_moderator':
                return <Shield size={16} className="text-purple-400" />;
            case 'session_synthesized':
                return <Zap size={16} className="text-orange-400" />;
            case 'session_started':
                return <MessageCircle size={16} className="text-cyan-400" />;
            default:
                return <Bell size={16} className="text-[var(--text-secondary)]" />;
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Icon */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-1 hover:bg-[var(--bg-input)]/50 rounded-lg transition-colors"
            >
                <Bell size={20} className={`transition-colors ${isOpen ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`} />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full border-2 border-[var(--bg-sidebar)] flex items-center justify-center text-[10px] font-bold">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-primary)]">
                        <h3 className="text-sm font-bold text-[var(--text-primary)]">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={() => markAllAsRead.mutate()}
                                className="text-xs text-[var(--text-secondary)] hover:text-orange-500 flex items-center gap-1 transition-colors"
                            >
                                <CheckCheck size={14} />
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-96 overflow-y-auto">
                        {isLoading ? (
                            <div className="px-4 py-8 text-center text-[var(--text-secondary)] text-sm">
                                Loading...
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="px-4 py-8 text-center">
                                <Bell size={32} className="text-[var(--text-muted)] mx-auto mb-3" />
                                <p className="text-[var(--text-secondary)] text-sm">No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    onClick={() => handleNotificationClick(notification)}
                                    className={`px-4 py-3 border-b border-[var(--border-primary)]/50 cursor-pointer transition-colors group ${notification.isRead
                                        ? 'bg-transparent hover:bg-[var(--bg-input)]/30'
                                        : 'bg-orange-500/5 hover:bg-orange-500/10'
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-full bg-[var(--bg-input)] flex items-center justify-center flex-shrink-0">
                                            {getNotificationIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className={`text-sm leading-snug ${notification.isRead ? 'text-[var(--text-secondary)]' : 'text-[var(--text-primary)]'}`}>
                                                    <span className="font-medium">{notification.title}</span>
                                                </p>
                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                    {!notification.isRead && (
                                                        <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                                                    )}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            deleteNotification.mutate(notification.id);
                                                        }}
                                                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[var(--bg-input)] rounded transition-all"
                                                    >
                                                        <X size={12} className="text-[var(--text-secondary)]" />
                                                    </button>
                                                </div>
                                            </div>
                                            <p className={`text-xs mt-0.5 ${notification.isRead ? 'text-[var(--text-muted)]' : 'text-[var(--text-secondary)]'}`}>
                                                {notification.message}
                                            </p>
                                            <p className="text-[10px] text-[var(--text-muted)] mt-1">
                                                {formatTime(notification.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="px-4 py-2 border-t border-[var(--border-primary)] text-center">
                            <button
                                onClick={() => {
                                    navigate('/profile');
                                    setIsOpen(false);
                                }}
                                className="text-xs text-[var(--text-secondary)] hover:text-orange-500 transition-colors"
                            >
                                View all activity
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
