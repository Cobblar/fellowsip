interface AdPlaceholderProps {
    className?: string;
}

export function AdPlaceholder({ className = '' }: AdPlaceholderProps) {
    return (
        <div
            className={`ad-placeholder flex flex-col items-center justify-center p-4 bg-[var(--bg-input)] border border-dashed border-[var(--border-primary)] rounded-lg text-center ${className}`}
        >
            <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1">
                Advertisement
            </div>
            <div className="text-[10px] text-[var(--text-muted)]">
                Ad space reserved
            </div>
        </div>
    );
}
