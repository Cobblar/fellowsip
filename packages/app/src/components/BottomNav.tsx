import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Wine, BookOpen, User } from 'lucide-react';

const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/create', icon: Wine, label: 'Sessions' },
    { path: '/summaries', icon: BookOpen, label: 'Summaries' },
    { path: '/profile', icon: User, label: 'Profile' },
];

export function BottomNav() {
    const location = useLocation();
    const navigate = useNavigate();

    // Don't show on chat pages or summary detail pages
    if (location.pathname.includes('/session/') && !location.pathname.includes('/summary')) {
        return null;
    }

    return (
        <nav className="bottom-nav">
            {navItems.map((item) => {
                const isActive = location.pathname === item.path ||
                    (item.path === '/summaries' && location.pathname.includes('/summary'));
                const Icon = item.icon;

                return (
                    <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className={`nav-item ${isActive ? 'active' : ''}`}
                    >
                        <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                        <span>{item.label}</span>
                    </button>
                );
            })}
        </nav>
    );
}
