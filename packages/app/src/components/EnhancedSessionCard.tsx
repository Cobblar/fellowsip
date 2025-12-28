import { useNavigate } from 'react-router-dom';
import { Clock, ChevronRight, PlayCircle, Users, UserPlus, LogIn, Archive, Calendar } from 'lucide-react';
import { getProductIcon, getProductColor } from '../utils/productIcons';

type SessionVariant = 'active' | 'friend' | 'ended';
type JoinStatus = 'none' | 'pending' | 'approved' | 'rejected';

export interface EnhancedSessionCardProps {
    id: string;
    name: string;
    productType?: string | null;
    startedAt: string;
    variant: SessionVariant;
    hostName?: string;
    observations?: string | null;
    rating?: number | null;
    onRequestJoin?: () => void;
    onArchive?: () => void;
    joinStatus?: JoinStatus;
    isJoinPending?: boolean;
}

/**
 * Enhanced session card component with variants for:
 * - active: User's own active session (green styling)
 * - friend: Friend's active session (blue styling, with join request flow)
 * - ended: Completed session with summary info (neutral styling)
 */
export function EnhancedSessionCard({
    id,
    name,
    productType,
    startedAt,
    variant,
    hostName,
    observations,
    rating,
    onRequestJoin,
    onArchive,
    joinStatus = 'none',
    isJoinPending = false,
}: EnhancedSessionCardProps) {
    const navigate = useNavigate();

    const getCardStyles = () => {
        switch (variant) {
            case 'active':
                return 'border-green-500/20 hover:border-green-500/50 bg-green-500/5';
            case 'friend':
                return 'border-blue-500/20 hover:border-blue-500/50 bg-blue-500/5';
            default:
                return 'hover:border-gray-600';
        }
    };

    const getIconStyles = () => {
        switch (variant) {
            case 'active':
                return { bg: 'bg-green-500/10', color: 'text-green-500', Icon: PlayCircle };
            case 'friend':
                return { bg: 'bg-blue-500/10', color: 'text-blue-500', Icon: Users };
            default:
                const ProductIcon = getProductIcon(productType);
                const colorClass = getProductColor(productType);
                return { bg: 'bg-[var(--bg-input)]', color: colorClass, Icon: ProductIcon };
        }
    };

    const { bg, color, Icon } = getIconStyles();

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const handleClick = () => {
        if (variant === 'ended') {
            navigate(`/session/${id}/summary`);
        } else if (variant === 'active' || joinStatus === 'approved') {
            navigate(`/session/${id}`);
        }
    };

    const renderJoinButton = () => {
        if (variant !== 'friend') return null;

        switch (joinStatus) {
            case 'approved':
                return (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/session/${id}`);
                        }}
                        className="text-xs font-bold text-green-500 hover:text-green-400 flex items-center gap-1 animate-pulse-once"
                    >
                        <LogIn size={12} className="animate-bounce-in" />
                        Join Session
                    </button>
                );
            case 'pending':
                return (
                    <span className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                        Request sent
                    </span>
                );
            case 'rejected':
                return <span className="text-xs text-red-400">Request declined</span>;
            default:
                return (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onRequestJoin?.();
                        }}
                        disabled={isJoinPending}
                        className="text-xs font-bold text-blue-500 hover:underline flex items-center gap-1"
                    >
                        <UserPlus size={12} />
                        Request to Join
                    </button>
                );
        }
    };

    return (
        <div
            onClick={handleClick}
            className={`card transition-all cursor-pointer group p-5 ${getCardStyles()}`}
        >
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${bg} rounded flex items-center justify-center ${color}`}>
                        <Icon size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-[var(--text-primary)] group-hover:text-white transition-colors">
                            {name}
                        </h3>
                        <p className="text-xs text-[var(--text-secondary)]">
                            {variant === 'friend' && hostName
                                ? `Hosted by ${hostName}`
                                : productType || 'Tasting'}
                        </p>
                    </div>
                </div>
                {variant !== 'ended' && (
                    <span
                        className={`text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider ${variant === 'active'
                                ? 'bg-green-500/20 text-green-500'
                                : 'bg-blue-500/20 text-blue-500'
                            }`}
                    >
                        Live
                    </span>
                )}
                {variant === 'ended' && rating && (
                    <div className="flex flex-col items-end">
                        <span className="text-lg font-bold text-orange-500">{rating}</span>
                        <span className="text-[8px] text-[var(--text-muted)] uppercase font-bold tracking-tighter">
                            Score
                        </span>
                    </div>
                )}
            </div>

            {variant === 'ended' && (
                <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mb-3 leading-relaxed">
                    {observations || 'No summary observations recorded for this session.'}
                </p>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-[var(--border-primary)]/50">
                <div className="flex items-center gap-2 text-[10px] text-[var(--text-secondary)]">
                    {variant === 'ended' ? <Calendar size={12} /> : <Clock size={12} />}
                    <span>
                        {variant === 'ended'
                            ? new Date(startedAt).toLocaleDateString()
                            : `Started ${formatTime(startedAt)}`}
                    </span>
                </div>

                {variant === 'active' && (
                    <span className="text-xs font-bold text-green-500 flex items-center gap-1">
                        Join <ChevronRight size={14} />
                    </span>
                )}

                {variant === 'friend' && renderJoinButton()}

                {variant === 'ended' && (
                    <div className="flex items-center gap-3">
                        {onArchive && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onArchive();
                                }}
                                className="text-[10px] text-[var(--text-secondary)] hover:text-orange-500 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Archive this session"
                            >
                                <Archive size={12} />
                                Archive
                            </button>
                        )}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/session/${id}/summary`);
                            }}
                            className="text-[10px] text-orange-500 font-bold hover:underline flex items-center gap-1"
                        >
                            View Summary <ChevronRight size={14} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
