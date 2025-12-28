import { useMemo } from 'react';
import { X } from 'lucide-react';

interface LivestreamEmbedProps {
    url: string;
    onClose?: () => void;
    className?: string;
}

export function LivestreamEmbed({ url, onClose, className = '' }: LivestreamEmbedProps) {
    const embedUrl = useMemo(() => {
        if (!url) return null;

        try {
            // YouTube
            if (url.includes('youtube.com') || url.includes('youtu.be')) {
                let videoId = '';
                if (url.includes('v=')) {
                    videoId = url.split('v=')[1].split('&')[0];
                } else if (url.includes('youtu.be/')) {
                    videoId = url.split('youtu.be/')[1].split('?')[0];
                } else if (url.includes('embed/')) {
                    videoId = url.split('embed/')[1].split('?')[0];
                }

                if (videoId) {
                    return `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1&rel=0&modestbranding=1`;
                }
            }

            // Twitch
            if (url.includes('twitch.tv')) {
                const parts = url.split('twitch.tv/');
                if (parts.length > 1) {
                    const channel = parts[1].split('/')[0].split('?')[0];
                    // Use current hostname for parent
                    const parent = window.location.hostname;
                    return `https://player.twitch.tv/?channel=${channel}&parent=${parent}&autoplay=true&muted=false`;
                }
            }
        } catch (e) {
            console.error('Failed to parse livestream URL:', e);
        }

        return null;
    }, [url]);

    if (!embedUrl) return null;

    return (
        <div className={`relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-lg group ${className}`}>
            <iframe
                src={embedUrl}
                className="absolute inset-0 w-full h-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            />
            {onClose && (
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-black/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    title="Close Stream"
                >
                    <X size={16} />
                </button>
            )}
        </div>
    );
}
