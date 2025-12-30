import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Users, Hash, ChevronRight, Link2, ChevronLeft } from 'lucide-react';
import { useSession } from '../api/sessions';

export function JoinSession() {
  const navigate = useNavigate();
  const { id: urlSessionId } = useParams<{ id?: string }>();
  const [sessionId, setSessionId] = useState('');
  const [attemptedId, setAttemptedId] = useState('');

  // If we have a URL param, attempt to join immediately
  useEffect(() => {
    if (urlSessionId) {
      setSessionId(urlSessionId);
      setAttemptedId(urlSessionId);
    }
  }, [urlSessionId]);

  const { data, isLoading, error } = useSession(attemptedId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId.trim()) return;
    setAttemptedId(sessionId.trim());
  };

  // Navigate to session when found
  useEffect(() => {
    if (data?.session) {
      navigate(`/session/${data.session.id}`, { replace: true });
    }
  }, [data, navigate]);

  return (
    <div className="p-8 max-w-xl mx-auto">
      <div className="mb-8 flex items-start gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] md:hidden flex-shrink-0"
          title="Go Back"
        >
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="heading-xl mb-2">Join Session</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            {urlSessionId ? 'Joining session...' : 'Enter a session ID to join an ongoing tasting.'}
          </p>
        </div>
      </div>

      <div className="card p-8">
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500">
            {urlSessionId ? <Link2 size={32} /> : <Users size={32} />}
          </div>
        </div>

        {urlSessionId && isLoading && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-sm text-[var(--text-secondary)]">Looking for session...</p>
          </div>
        )}

        {urlSessionId && error && (
          <div className="text-center space-y-4">
            <div className="p-4 bg-red-900/20 border border-red-900/50 rounded-lg text-red-500 text-sm">
              Session not found or has ended.
            </div>
            <button
              onClick={() => navigate('/summaries')}
              className="btn-outline"
            >
              Go to Sessions
            </button>
          </div>
        )}

        {!urlSessionId && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-4 block">Session ID</label>
              <div className="relative">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                <input
                  type="text"
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value)}
                  placeholder="Paste session ID here..."
                  className="w-full bg-[var(--bg-main)] border-[var(--border-primary)] pl-12 py-3 text-lg font-mono tracking-wider"
                  required
                />
              </div>
            </div>

            {error && attemptedId && (
              <div className="p-4 bg-red-900/20 border border-red-900/50 rounded-lg text-red-500 text-sm text-center">
                Session not found. Please check the ID and try again.
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !sessionId.trim()}
              className="w-full btn-orange justify-center py-3"
            >
              {isLoading ? 'Searching...' : 'Join Session'}
              <ChevronRight size={18} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
