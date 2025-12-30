import { PublicChatProvider } from '../contexts/PublicChatProvider';
import { ChatRoom } from './ChatRoom';

export function PublicSessionLog() {
    return (
        <PublicChatProvider>
            <ChatRoom />
        </PublicChatProvider>
    );
}
