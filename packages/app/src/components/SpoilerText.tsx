import { useState } from 'react';

interface SpoilerTextProps {
    text: string;
    forceReveal?: boolean; // If true, all spoilers in this text are pre-revealed
    forceHide?: boolean; // If true, the entire text is treated as a spoiler
}

export function SpoilerText({ text, forceReveal = false, forceHide = false }: SpoilerTextProps) {
    if (forceHide && !forceReveal) {
        return <SpoilerBlock content={text.replace(/\|\|/g, '')} forceReveal={false} />;
    }

    // Split the text by the spoiler delimiter ||
    // Even indices are normal text, odd indices are spoiler text
    const parts = text.split(/(\|\|.*?\|\|)/g);

    return (
        <span>
            {parts.map((part, index) => {
                if (part.startsWith('||') && part.endsWith('||')) {
                    const content = part.slice(2, -2);
                    return <SpoilerBlock key={index} content={content} forceReveal={forceReveal} />;
                }
                return <span key={index}>{part}</span>;
            })}
        </span>
    );
}

function SpoilerBlock({ content, forceReveal }: { content: string; forceReveal: boolean }) {
    const [isRevealed, setIsRevealed] = useState(false);

    // If forceReveal is true, show as revealed
    const showRevealed = forceReveal || isRevealed;

    return (
        <span
            onClick={(e) => {
                e.stopPropagation();
                if (!forceReveal) {
                    setIsRevealed(true);
                }
            }}
            className={`inline-block px-1 rounded cursor-pointer transition-all duration-200 ${showRevealed
                ? 'bg-[var(--bg-input)]/50 text-inherit'
                : 'bg-[var(--bg-main)] text-transparent hover:bg-[var(--bg-input)]'
                }`}
            title={showRevealed ? '' : 'Click to reveal spoiler'}
        >
            {content}
        </span>
    );
}

