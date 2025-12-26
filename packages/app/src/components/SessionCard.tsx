import { useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';
import type { Session } from '../types';

interface SessionCardProps {
  session: Session;
  isHost?: boolean;
}

export function SessionCard({ session, isHost = false }: SessionCardProps) {
  const navigate = useNavigate();

  const handleJoin = () => {
    navigate(`/session/${session.id}`);
  };

  return (
    <div className="bg-[var(--bg-primary)] rounded-lg border border-[var(--border-primary)] p-4 hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">{session.name}</h3>
          {session.productType && (
            <p className="text-sm text-[var(--text-secondary)]">{session.productType}</p>
          )}
        </div>
        {isHost && (
          <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs px-2 py-1 rounded">
            Host
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mb-3">
        <Users size={16} />
        <span>Active session</span>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-[var(--text-muted)]">
          Started {new Date(session.startedAt).toLocaleDateString()}
        </div>
        <div className="flex gap-2">
          {session.summaryId && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/session/${session.id}/summary`);
              }}
              className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-md text-sm font-medium hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
            >
              View Summary
            </button>
          )}
          <button
            onClick={handleJoin}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
          >
            {isHost ? 'Continue' : 'Join'}
          </button>
        </div>
      </div>
    </div>
  );
}
