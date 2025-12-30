import { useState, useCallback, useEffect } from 'react';
import { api } from '../../api/client';

export const useChatPreferences = (sessionId: string | null) => {
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [recentTags, setRecentTags] = useState<string[]>([]);
    const [phaseVisibility, setPhaseVisibilityState] = useState<Record<string, 'normal' | 'hidden' | 'revealed'>>({
        nose: 'normal',
        palate: 'normal',
        finish: 'normal',
        texture: 'normal',
        untagged: 'normal',
    });
    const [phaseVisibilityInitialized, setPhaseVisibilityInitialized] = useState(false);

    const [spoilerDefaults, setSpoilerDefaultsState] = useState<Record<string, 'normal' | 'hidden' | 'revealed'>>(() => {
        try {
            const saved = localStorage.getItem('fellowsip_spoiler_defaults');
            return saved ? JSON.parse(saved) : {
                nose: 'normal',
                palate: 'normal',
                finish: 'normal',
                texture: 'normal',
                untagged: 'normal',
            };
        } catch (e) {
            return {
                nose: 'normal',
                palate: 'normal',
                finish: 'normal',
                texture: 'normal',
                untagged: 'normal',
            };
        }
    });

    useEffect(() => {
        localStorage.setItem('fellowsip_spoiler_defaults', JSON.stringify(spoilerDefaults));
    }, [spoilerDefaults]);

    const setSpoilerDefault = useCallback((phase: string, visibility: 'normal' | 'hidden' | 'revealed') => {
        setSpoilerDefaultsState(prev => ({ ...prev, [phase]: visibility }));
    }, []);

    useEffect(() => {
        const getDefaults = () => {
            try {
                const saved = localStorage.getItem('fellowsip_spoiler_defaults');
                return saved ? JSON.parse(saved) : {
                    nose: 'normal',
                    palate: 'normal',
                    finish: 'normal',
                    texture: 'normal',
                    untagged: 'normal',
                };
            } catch (e) {
                return {
                    nose: 'normal',
                    palate: 'normal',
                    finish: 'normal',
                    texture: 'normal',
                    untagged: 'normal',
                };
            }
        };

        if (sessionId) {
            try {
                const sessionKey = `fellowsip_spoiler_${sessionId}`;
                const sessionSaved = localStorage.getItem(sessionKey);
                if (sessionSaved) {
                    setPhaseVisibilityState(JSON.parse(sessionSaved));
                } else {
                    setPhaseVisibilityState(getDefaults());
                }
            } catch (e) {
                setPhaseVisibilityState(getDefaults());
            }
        } else {
            setPhaseVisibilityState(getDefaults());
        }
        setPhaseVisibilityInitialized(true);
    }, [sessionId]);

    useEffect(() => {
        if (sessionId && phaseVisibilityInitialized) {
            const sessionKey = `fellowsip_spoiler_${sessionId}`;
            localStorage.setItem(sessionKey, JSON.stringify(phaseVisibility));
        }
    }, [phaseVisibility, sessionId, phaseVisibilityInitialized]);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await api.get<{
                    user: {
                        id: string;
                        preferences: { recentTags?: string[] } | null;
                    }
                }>('/auth/session');
                setCurrentUserId(response.user.id);
                setRecentTags(response.user.preferences?.recentTags || []);
            } catch (error) {
                console.error('Failed to fetch user:', error);
            }
        };
        fetchUser();
    }, []);

    const updateRecentTags = async (tags: string[]) => {
        try {
            const uniqueTags = Array.from(new Set(tags)).slice(-10);
            await api.patch('/auth/preferences', {
                preferences: { recentTags: uniqueTags }
            });
            setRecentTags(uniqueTags);
        } catch (error) {
            console.error('Failed to update recent tags:', error);
        }
    };

    const setPhaseVisibility = useCallback((phase: string, visibility: 'normal' | 'hidden' | 'revealed') => {
        setPhaseVisibilityState((prev) => ({
            ...prev,
            [phase]: visibility,
        }));
    }, []);

    const setAllPhaseVisibility = useCallback((visibility: 'normal' | 'hidden' | 'revealed') => {
        setPhaseVisibilityState({
            nose: visibility,
            palate: visibility,
            finish: visibility,
            texture: visibility,
            untagged: visibility,
        });
    }, []);

    return {
        currentUserId,
        recentTags,
        phaseVisibility,
        spoilerDefaults,
        setSpoilerDefault,
        updateRecentTags,
        setPhaseVisibility,
        setAllPhaseVisibility,
        setPhaseVisibilityState,
    };
};
