import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Calendar, Wine, LogOut, ChevronRight, Settings, Star, ExternalLink, Search } from 'lucide-react';
import { api } from '../api/client';
import { useCurrentUser, useUpdateProfile } from '../api/auth';
import { useToggleHighlight, useUpdateSharing, useUserSessions } from '../api/sessions';

export function Profile() {
    const navigate = useNavigate();
    const [newBio, setNewBio] = useState('');
    const [isEditingBio, setIsEditingBio] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const { data: sessionsData, isLoading: sessionsLoading } = useUserSessions();
    const { data: currentUserData } = useCurrentUser();
    const updateProfile = useUpdateProfile();
    const toggleHighlight = useToggleHighlight();
    const updateSharing = useUpdateSharing();

    const currentUser = currentUserData?.user;

    useEffect(() => {
        if (currentUser) {
            setNewBio(currentUser.bio || '');
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

    const handleUpdateBio = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await updateProfile.mutateAsync({ bio: newBio.trim() });
            setIsEditingBio(false);
        } catch (error) {
            console.error('Failed to update bio:', error);
        }
    };

    const handleCopyPublicLink = () => {
        const url = `${window.location.origin}/profile/${currentUser?.id}`;
        navigator.clipboard.writeText(url);
        // Could add a toast here
    };

    const sessions = sessionsData?.sessions || [];
    const synthesizedSessions = sessions.filter(s => s.summaryId);
    const filteredSessions = synthesizedSessions.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.productName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.productType || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (sessionsLoading) {
        return <div className="p-8 text-[var(--text-secondary)]">Loading profile...</div>;
    }

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto">
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="heading-xl mb-2">My Profile</h1>
                    <p className="text-sm text-[var(--text-secondary)]">Manage your public presence and shared tastings.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleCopyPublicLink}
                        className="btn-secondary text-xs py-2 px-3"
                    >
                        Copy Public Link
                    </button>
                    <button
                        onClick={() => navigate(`/profile/${currentUser?.id}`)}
                        className="btn-orange text-xs py-2"
                    >
                        <ExternalLink size={14} />
                        View Public Profile
                    </button>
                </div>
            </div>

            <div className="flex flex-col lg:grid lg:grid-cols-3 gap-8">
                {/* Left: User Info */}
                <div className="space-y-6">
                    <div className="card p-6 md:p-8">
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-[var(--bg-input)] flex items-center justify-center mb-4 border-2 border-[var(--border-secondary)] overflow-hidden">
                                {currentUser?.avatarUrl ? (
                                    <img src={currentUser.avatarUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <User size={40} className="text-[var(--text-secondary)] md:size-12" />
                                )}
                            </div>
                            <h2 className="heading-lg mb-1">{currentUser?.displayName || 'User'}</h2>
                            <p className="text-xs text-[var(--text-secondary)] mb-4">{currentUser?.email}</p>

                            <div className="w-full grid grid-cols-2 gap-2 py-4 border-y border-[var(--border-primary)]">
                                <div>
                                    <p className="text-lg md:text-xl font-bold text-orange-500">{sessions.length}</p>
                                    <p className="text-[8px] md:text-[10px] text-[var(--text-muted)] uppercase font-bold">Total Sessions</p>
                                </div>
                                <div>
                                    <p className="text-lg md:text-xl font-bold text-green-500">{synthesizedSessions.length}</p>
                                    <p className="text-[8px] md:text-[10px] text-[var(--text-muted)] uppercase font-bold">Summaries</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">Bio</h3>
                                {!isEditingBio && (
                                    <button
                                        onClick={() => setIsEditingBio(true)}
                                        className="text-[10px] text-orange-500 hover:text-orange-400 font-bold uppercase"
                                    >
                                        Edit
                                    </button>
                                )}
                            </div>

                            {isEditingBio ? (
                                <form onSubmit={handleUpdateBio} className="space-y-3">
                                    <textarea
                                        value={newBio}
                                        onChange={(e) => setNewBio(e.target.value)}
                                        placeholder="Tell us about your tasting journey..."
                                        className="w-full h-32 px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-lg text-sm focus:outline-none focus:border-orange-500 transition-colors resize-none"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            type="submit"
                                            disabled={updateProfile.isPending}
                                            className="btn-orange flex-1 text-xs py-1.5"
                                        >
                                            Save
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsEditingBio(false);
                                                setNewBio(currentUser?.bio || '');
                                            }}
                                            className="btn-secondary flex-1 text-xs py-1.5"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <p className="text-sm text-[var(--text-secondary)] italic leading-relaxed">
                                    {currentUser?.bio || "No bio yet. Add one to tell others about your tasting journey!"}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="card p-0 overflow-hidden">
                        <button
                            onClick={() => navigate('/settings')}
                            className="w-full flex items-center gap-3 p-4 hover:bg-[var(--bg-input)]/50 transition-colors text-sm text-[var(--text-secondary)]"
                        >
                            <Settings size={16} className="text-[var(--text-secondary)]" />
                            <span>Account Settings</span>
                            <ChevronRight size={14} className="ml-auto text-[var(--text-muted)]" />
                        </button>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 p-4 hover:bg-red-900/10 transition-colors text-sm text-red-500 border-t border-[var(--border-primary)]"
                        >
                            <LogOut size={16} />
                            <span>Sign Out</span>
                        </button>
                    </div>
                </div>

                {/* Right: Tabs */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Tab Navigation */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-primary)] pb-4">
                        <div className="flex gap-4 overflow-x-auto no-scrollbar">
                            <button
                                className="text-sm font-medium text-orange-500 border-b-2 border-orange-500 whitespace-nowrap pb-1"
                            >
                                Tasting History & Sharing
                            </button>
                        </div>
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search summaries..."
                                className="pl-9 pr-4 py-1.5 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-full text-xs focus:outline-none focus:border-orange-500 transition-colors w-full md:w-64"
                            />
                        </div>
                    </div>

                    <div className="card p-4 md:p-6">
                        <div className="space-y-4">
                            {filteredSessions.map((session) => (
                                <div
                                    key={session.id}
                                    className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-[var(--bg-main)] border border-[var(--border-primary)] rounded-lg hover:border-gray-600 transition-all group gap-4"
                                >
                                    <div
                                        className="flex items-center gap-4 cursor-pointer min-w-0 flex-1"
                                        onClick={() => navigate(session.summaryId ? `/session/${session.id}/summary` : `/session/${session.id}`)}
                                    >
                                        <div className="w-10 h-10 bg-[var(--bg-input)] rounded flex items-center justify-center text-orange-500 shrink-0">
                                            <Wine size={18} />
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-white truncate">{session.name}</h4>
                                            <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)] mt-1">
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={10} />
                                                    {new Date(session.createdAt).toLocaleDateString()}
                                                </span>
                                                <span className="truncate">{session.productType || 'Tasting'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 shrink-0">
                                        <div className="flex items-center gap-2 border-r border-[var(--border-primary)] pr-4">
                                            <button
                                                onClick={() => toggleHighlight.mutate(session.id)}
                                                className={`p-1.5 rounded transition-colors ${session.isHighlighted
                                                    ? 'text-yellow-500 bg-yellow-500/10'
                                                    : 'text-[var(--text-muted)] hover:text-yellow-500 hover:bg-yellow-500/5'
                                                    }`}
                                                title={session.isHighlighted ? "Highlighted on profile" : "Highlight on profile"}
                                            >
                                                <Star size={16} fill={session.isHighlighted ? "currentColor" : "none"} />
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <label className="flex items-center gap-2 cursor-pointer group">
                                                <div
                                                    onClick={() => updateSharing.mutate({
                                                        sessionId: session.id,
                                                        data: { sharePersonalSummary: !session.sharePersonalSummary }
                                                    })}
                                                    className={`w-9 h-5 rounded-full relative transition-colors cursor-pointer ${session.sharePersonalSummary ? 'bg-orange-500' : 'bg-[var(--bg-input)]'}`}
                                                >
                                                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${session.sharePersonalSummary ? 'left-5' : 'left-1'}`}></div>
                                                </div>
                                                <span className="text-[10px] text-[var(--text-secondary)] group-hover:text-white transition-colors">Personal</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer group">
                                                <div
                                                    onClick={() => updateSharing.mutate({
                                                        sessionId: session.id,
                                                        data: { shareGroupSummary: !session.shareGroupSummary }
                                                    })}
                                                    className={`w-9 h-5 rounded-full relative transition-colors cursor-pointer ${session.shareGroupSummary ? 'bg-orange-500' : 'bg-[var(--bg-input)]'}`}
                                                >
                                                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${session.shareGroupSummary ? 'left-5' : 'left-1'}`}></div>
                                                </div>
                                                <span className="text-[10px] text-[var(--text-secondary)] group-hover:text-white transition-colors">Group</span>
                                            </label>
                                        </div>

                                    </div>
                                </div>
                            ))}
                            {filteredSessions.length === 0 && (
                                <div className="text-center py-12 text-[var(--text-muted)] text-sm italic">
                                    {searchQuery ? "No summaries match your search." : "No summaries recorded yet."}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
