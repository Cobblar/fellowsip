import React, { useState } from 'react';
import { User, Check } from 'lucide-react';
import { useUpdateProfile } from '../api/auth';

interface OnboardingModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
    const [displayName, setDisplayName] = useState('');
    const updateProfile = useUpdateProfile();

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!displayName.trim()) return;

        try {
            await updateProfile.mutateAsync({ displayName: displayName.trim() });
            onClose();
        } catch (error) {
            console.error('Failed to set display name:', error);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="card max-w-md w-full p-8 shadow-2xl border-orange-500/20 animate-in zoom-in-95 duration-300">
                <div className="flex flex-col items-center text-center mb-8">
                    <div className="w-20 h-20 rounded-full bg-orange-500/10 flex items-center justify-center mb-6 border-2 border-orange-500/20">
                        <User size={40} className="text-orange-500" />
                    </div>
                    <h2 className="heading-lg mb-2">Welcome to Fellowsip!</h2>
                    <p className="text-sm text-[var(--text-secondary)]">
                        Let's start by setting your display name. This is how others will see you in tasting rooms.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2 tracking-widest">
                            Display Name
                        </label>
                        <input
                            type="text"
                            placeholder="Enter your name..."
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="w-full px-4 py-3 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-xl text-sm focus:outline-none focus:border-orange-500 transition-all shadow-inner"
                            autoFocus
                            required
                        />
                        <p className="text-[10px] text-[var(--text-muted)] mt-2 italic">
                            Don't worry, you can change this anytime in your profile settings.
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={updateProfile.isPending || !displayName.trim()}
                        className="btn-orange w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 group"
                    >
                        {updateProfile.isPending ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                            <>
                                <Check size={18} className="group-hover:scale-110 transition-transform" />
                                <span>Get Started</span>
                            </>
                        )}
                    </button>

                    {updateProfile.isError && (
                        <p className="text-red-500 text-xs text-center">
                            {(updateProfile.error as any)?.data?.error || 'Failed to update name. Please try again.'}
                        </p>
                    )}
                </form>
            </div>
        </div>
    );
}
