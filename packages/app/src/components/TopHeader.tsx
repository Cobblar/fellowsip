import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Sun, Moon } from 'lucide-react';
import { useCurrentUser } from '../api/auth';
import { NotificationDropdown } from './NotificationDropdown';
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
            : 'text-[var(--text-secondary)] border-transparent hover:text-white'
        }`;

    return (
        <header className="top-header">
            <div className="flex items-center">
                {/* Logo */}
                <button
                    onClick={() => navigate('/')}
                    className="font-black text-lg tracking-tight mr-8"
                >
                    <span className="text-orange-500">Fellow</span>sip
                </button>

                {/* Navigation */}
                <nav className="flex items-center gap-8">
                    <button
                        onClick={() => navigate('/')}
                        className={navClass(isActive('/') && !location.pathname.startsWith('/my-cellar') && !location.pathname.startsWith('/session') && !location.pathname.startsWith('/summaries') && !location.pathname.startsWith('/profile'))}
                    >
                        <Home size={16} />
                        Home
                    </button>
                    <button
                        onClick={() => navigate('/my-cellar')}
                        className={navClass(isActive('/my-cellar'))}
                    >
                        My Cellar
                    </button>
                    <button
                        onClick={() => navigate('/summaries')}
                        className={navClass(isActive('/summaries'))}
                    >
                        Sessions
                    </button>
                </nav>
            </div>

            <div className="flex items-center gap-6">
                <button
                    onClick={toggleTheme}
                    className="p-2 text-[var(--text-secondary)] hover:text-orange-500 transition-colors rounded-lg hover:bg-[var(--bg-input)]/50"
                    title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                >
                    {theme === 'light' ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <NotificationDropdown />
                <button
                    onClick={() => navigate('/profile')}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-[var(--border-secondary)] cursor-pointer hover:border-orange-500 transition-colors overflow-hidden"
                >
                    {user?.avatarUrl ? (
                        <img src={user.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                    ) : null}
                </button>
            </div>
        </header>
    );
}

