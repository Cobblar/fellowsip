import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Sun, Moon } from 'lucide-react';
import { useCurrentUser } from '../api/auth';
import { NotificationDropdown } from './NotificationDropdown';
import { UserAvatar } from './UserAvatar';
import { useTheme } from '../contexts/ThemeContext';

export function TopHeader() {
    const navigate = useNavigate();
    const location = useLocation();
    const { data: userData } = useCurrentUser();
    const { theme, toggleTheme } = useTheme();
    const user = userData?.user;

    const isActive = (path: string) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    const navClass = (active: boolean) =>
        `text-sm font-medium transition-colors py-5 border-b-2 flex items-center gap-2 ${active
            ? 'text-orange-500 border-orange-500'
            : 'text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)]'
        }`;

    return (
        <>
            <header className="top-header">
                <div className="flex items-center">
                    {/* Logo */}
                    <button
                        onClick={() => navigate('/')}
                        className="font-black text-lg tracking-tight mr-8"
                    >
                        <span className="text-orange-500">Fellow</span>sip
                    </button>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-8">
                        <button
                            onClick={() => navigate('/')}
                            className={navClass(isActive('/') && !location.pathname.startsWith('/tasting-notes') && !location.pathname.startsWith('/session') && !location.pathname.startsWith('/sessions') && !location.pathname.startsWith('/profile'))}
                        >
                            <Home size={16} />
                            Home
                        </button>
                        <button
                            onClick={() => navigate('/tasting-notes')}
                            className={navClass(isActive('/tasting-notes'))}
                        >
                            Tasting Notes
                        </button>
                        <button
                            onClick={() => navigate('/sessions')}
                            className={navClass(isActive('/sessions'))}
                        >
                            Sessions
                        </button>
                        <button
                            onClick={() => navigate('/profile')}
                            className={navClass(isActive('/profile'))}
                        >
                            Profile
                        </button>
                    </nav>
                </div>

                <div className="flex items-center gap-3 md:gap-6">
                    <button
                        onClick={toggleTheme}
                        className="p-2 text-[var(--text-secondary)] hover:text-orange-500 transition-colors rounded-lg hover:bg-[var(--bg-input)]/50"
                        title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                    >
                        {theme === 'light' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                    <NotificationDropdown />
                    <button
                        onClick={() => navigate('/settings')}
                        className="cursor-pointer hover:scale-105 transition-transform"
                    >
                        <UserAvatar
                            avatarUrl={user?.avatarUrl}
                            displayName={user?.displayName}
                            userId={user?.id}
                            useGeneratedAvatar={user?.useGeneratedAvatar}
                            size="sm"
                        />
                    </button>
                </div>
            </header>
        </>
    );
}

