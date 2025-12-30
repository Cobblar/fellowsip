export interface User {
    id: string;
    displayName: string | null;
    avatarUrl: string | null;
    email?: string;
    isPublic?: boolean;
    bio?: string | null;
}

export interface Session {
    id: string;
    name: string;
    productType: string | null;
    productLink: string | null;
    productName: string | null;
    hostId: string;
    status: string;
    startedAt: string | Date;
    endedAt: string | Date | null;
    lastActivityAt: string | Date;
    createdAt: string | Date;
    updatedAt: string | Date;
    customTags: string[];
    host?: User;
    summaryId?: string;
    userRating?: number | null;
    sharePersonalSummary?: boolean;
    shareGroupSummary?: boolean;
    shareSessionLog?: boolean;
    isHighlighted?: boolean;
}

export interface Message {
    id: string;
    sessionId: string;
    userId: string;
    content: string;
    phase?: string | null;
    createdAt: string | Date;
    user: {
        id: string;
        displayName: string | null;
        avatarUrl: string | null;
    };
}

export interface ActiveUser {
    userId: string;
    socketId: string;
    displayName: string | null;
    avatarUrl: string | null;
    rating?: number | null;
}

export interface Participant {
    userId: string;
    rating: number | null;
    displayName: string | null;
    avatarUrl: string | null;
    sharePersonalSummary?: boolean;
    shareGroupSummary?: boolean;
    shareSessionLog?: boolean;
}

export interface BannedUser {
    id: string;
    displayName: string | null;
}
