import React from 'react';
import { Share2 } from 'lucide-react';

interface SharingControlsProps {
    userParticipant: any;
    onUpdateSharing: (data: any) => void;
}

export const SharingControls: React.FC<SharingControlsProps> = ({
    userParticipant,
    onUpdateSharing,
}) => {
    return (
        <div className="card p-4 mb-8 border-orange-500/20 bg-orange-500/5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-500">
                        <Share2 size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white">Sharing Preferences</h3>
                        <p className="text-xs text-[var(--text-secondary)]">Control what appears on your public profile.</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <div
                            onClick={() => onUpdateSharing({ sharePersonalSummary: !userParticipant.sharePersonalSummary })}
                            className={`w-10 h-5 rounded-full relative transition-colors ${userParticipant.sharePersonalSummary ? 'bg-orange-500' : 'bg-[var(--bg-input)]'}`}
                        >
                            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${userParticipant.sharePersonalSummary ? 'left-6' : 'left-1'}`}></div>
                        </div>
                        <span className="text-xs font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">Share Personal Notes</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <div
                            onClick={() => onUpdateSharing({ shareGroupSummary: !userParticipant.shareGroupSummary })}
                            className={`w-10 h-5 rounded-full relative transition-colors ${userParticipant.shareGroupSummary ? 'bg-orange-500' : 'bg-[var(--bg-input)]'}`}
                        >
                            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${userParticipant.shareGroupSummary ? 'left-6' : 'left-1'}`}></div>
                        </div>
                        <span className="text-xs font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">Share Group Summary</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <div
                            onClick={() => onUpdateSharing({ shareSessionLog: !userParticipant.shareSessionLog })}
                            className={`w-10 h-5 rounded-full relative transition-colors ${userParticipant.shareSessionLog ? 'bg-blue-500' : 'bg-[var(--bg-input)]'}`}
                        >
                            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${userParticipant.shareSessionLog ? 'left-6' : 'left-1'}`}></div>
                        </div>
                        <span className="text-xs font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">Share Session Log</span>
                    </label>
                </div>
            </div>
        </div>
    );
};
