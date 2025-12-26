import { useState } from 'react';
import { Wine, Copy, Check, Calendar } from 'lucide-react';
import type { Session } from '../types';

interface SessionHeaderProps {
  session: Session;
}

export function SessionHeader({ session }: SessionHeaderProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(session.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy session ID:', err);
    }
  };

  return (
    <div className="p-4 border-b border-[var(--border-primary)]">
      {/* Session Image/Icon */}
      <div className="h-24 bg-gradient-to-br from-[var(--accent-primary)]/20 to-[var(--bg-tertiary)] rounded-xl flex items-center justify-center mb-4">
        <Wine size={36} className="text-[var(--accent-primary)]" />
      </div>

      {/* Session Info */}
      <h2 className="text-lg font-bold text-[var(--text-primary)] mb-1">{session.name}</h2>
      {session.productType && (
        <p className="text-sm text-[var(--text-secondary)] mb-3">{session.productType}</p>
      )}

      {/* Session ID */}
      <div className="flex items-center justify-between p-3 bg-[var(--bg-tertiary)] rounded-xl mb-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Session ID</p>
          <p className="text-xs text-[var(--text-secondary)] font-mono truncate">{session.id}</p>
        </div>
        <button
          onClick={handleCopyId}
          className="w-8 h-8 rounded-lg bg-[var(--bg-card)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-all flex-shrink-0 ml-2"
          title="Copy Session ID"
        >
          {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
        </button>
      </div>

      {/* Status & Time */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-[var(--text-muted)]">
          <Calendar size={12} />
          <span>{new Date(session.startedAt).toLocaleDateString()}</span>
        </div>
        <span
          className={`flex items-center gap-1 px-2 py-1 rounded-full ${session.status === 'active'
              ? 'bg-green-500/20 text-green-400'
              : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
            }`}
        >
          {session.status === 'active' && (
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
          )}
          {session.status === 'active' ? 'Live' : 'Ended'}
        </span>
      </div>
    </div>
  );
}
