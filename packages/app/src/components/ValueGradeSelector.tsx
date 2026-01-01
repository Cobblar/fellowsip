import { useState } from 'react';

type ValueGrade = 'A' | 'B' | 'C' | 'D' | 'F';

interface ValueGradeSelectorProps {
    value: ValueGrade | null | undefined;
    onChange: (grade: ValueGrade) => void;
    disabled?: boolean;
    size?: 'sm' | 'md';
}

const grades: ValueGrade[] = ['A', 'B', 'C', 'D', 'F'];

export function ValueGradeSelector({ value, onChange, disabled = false, size = 'md' }: ValueGradeSelectorProps) {
    const [hoveredGrade, setHoveredGrade] = useState<ValueGrade | null>(null);

    const sizeClasses = size === 'sm'
        ? 'w-6 h-6 text-xs'
        : 'w-8 h-8 text-sm';

    return (
        <div className="flex gap-1">
            {grades.map((grade) => {
                const isSelected = value === grade;
                const isHovered = hoveredGrade === grade;

                return (
                    <button
                        key={grade}
                        onClick={() => !disabled && onChange(grade)}
                        onMouseEnter={() => setHoveredGrade(grade)}
                        onMouseLeave={() => setHoveredGrade(null)}
                        disabled={disabled}
                        className={`
              ${sizeClasses}
              rounded font-bold transition-all duration-150
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              ${isSelected
                                ? 'bg-orange-500 text-white shadow-md scale-110'
                                : isHovered
                                    ? 'bg-orange-500/30 text-orange-500'
                                    : 'bg-[var(--bg-input)] text-[var(--text-secondary)] hover:bg-orange-500/20'}
            `}
                        title={`Grade: ${grade}`}
                    >
                        {grade}
                    </button>
                );
            })}
        </div>
    );
}

interface ValueGradeDistributionProps {
    distribution: Record<ValueGrade, number>;
    compact?: boolean;
}

export function ValueGradeDistribution({ distribution, compact = false }: ValueGradeDistributionProps) {
    const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);

    if (total === 0) return null;

    const sortedGrades = grades.filter(g => distribution[g] > 0);

    if (compact) {
        // Compact view: "3A 2B 1C"
        return (
            <div className="flex items-center gap-1 text-[10px]">
                {sortedGrades.map(grade => (
                    <span key={grade} className="text-[var(--text-muted)]">
                        <span className="font-bold text-orange-500">{distribution[grade]}</span>
                        <span>{grade}</span>
                    </span>
                ))}
            </div>
        );
    }

    // Full view with bars
    return (
        <div className="space-y-1">
            {grades.map(grade => {
                const count = distribution[grade];
                const percentage = total > 0 ? (count / total) * 100 : 0;

                return (
                    <div key={grade} className="flex items-center gap-2 text-xs">
                        <span className="w-4 font-bold text-[var(--text-secondary)]">{grade}</span>
                        <div className="flex-1 h-2 bg-[var(--bg-input)] rounded overflow-hidden">
                            <div
                                className="h-full bg-orange-500 transition-all duration-300"
                                style={{ width: `${percentage}%` }}
                            />
                        </div>
                        <span className="w-6 text-right text-[var(--text-muted)]">{count}</span>
                    </div>
                );
            })}
        </div>
    );
}
