import React from 'react';

interface ProfileSettingsTabProps {
    newDisplayName: string;
    setNewDisplayName: (name: string) => void;
    currentUser: any;
    onUpdateDisplayName: (e: React.FormEvent) => void;
    updateProfileStatus: { isPending: boolean; isSuccess: boolean; isError: boolean; error: any };
}

export const ProfileSettingsTab: React.FC<ProfileSettingsTabProps> = ({
    newDisplayName,
    setNewDisplayName,
    currentUser,
    onUpdateDisplayName,
    updateProfileStatus,
}) => {
    return (
        <div className="card p-4 md:p-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-6">Profile Settings</h3>

            <form onSubmit={onUpdateDisplayName} className="space-y-6">
                <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">
                        Display Name
                    </label>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="text"
                            placeholder="Enter your display name"
                            value={newDisplayName}
                            onChange={(e) => setNewDisplayName(e.target.value)}
                            className="flex-1 px-4 py-2 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-lg text-sm focus:outline-none focus:border-orange-500 transition-colors"
                        />
                        <button
                            type="submit"
                            disabled={updateProfileStatus.isPending || !newDisplayName.trim() || newDisplayName === currentUser?.displayName}
                            className="btn-orange disabled:opacity-50 justify-center"
                        >
                            {updateProfileStatus.isPending ? 'Updating...' : 'Update Name'}
                        </button>
                    </div>
                    <p className="text-[10px] text-[var(--text-muted)] mt-2 italic">
                        This is how other users will see you in chat rooms and friend lists.
                    </p>
                </div>

                {updateProfileStatus.isSuccess && (
                    <p className="text-green-500 text-xs">Profile updated successfully!</p>
                )}
                {updateProfileStatus.isError && (
                    <p className="text-red-500 text-xs">
                        {updateProfileStatus.error?.data?.error || 'Failed to update profile'}
                    </p>
                )}
            </form>
        </div>
    );
};
