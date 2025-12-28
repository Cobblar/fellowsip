import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Wine, Users, User } from 'lucide-react';

export function MobileBottomNav() {
    const navigate = useNavigate();
    const location = useLocation();

    const isActive = (path: string) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    const navItemClass = (active: boolean) =>
        `flex flex-col items-center gap-1 flex-1 py-2 transition-colors ${active ? 'text-orange-500' : 'text-[var(--text-secondary)]'
        }`;

    // Hide bottom nav in chat room to avoid clutter
    if (location.pathname.startsWith('/session/') && !location.pathname.endsWith('/summary')) {
        return null;
    }

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--bg-sidebar)] border-t border-[var(--border-primary)] flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom, 0px)] z-50 shadow-[0_-4px_12px_rgba(0,0,0,0.1)]">
            <button onClick={() => navigate('/')} className={navItemClass(isActive('/') && !location.pathname.startsWith('/my-cellar') && !location.pathname.startsWith('/summaries') && !location.pathname.startsWith('/profile'))}>
                <Home size={20} />
                <span className="text-[10px] font-medium">Home</span>
            </button>
            <button onClick={() => navigate('/my-cellar')} className={navItemClass(isActive('/my-cellar'))}>
                <Wine size={20} />
                <span className="text-[10px] font-medium">Summaries</span>
            </button>
            <button onClick={() => navigate('/summaries')} className={navItemClass(isActive('/summaries'))}>
                <Users size={20} />
                <span className="text-[10px] font-medium">Sessions</span>
            </button>
            <button onClick={() => navigate('/profile')} className={navItemClass(isActive('/profile'))}>
                <User size={20} />
                <span className="text-[10px] font-medium">Profile</span>
            </button>
        </nav>
    );
}
