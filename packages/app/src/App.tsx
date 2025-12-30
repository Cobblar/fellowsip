import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthGuard } from './components/AuthGuard';
import { TopHeader } from './components/TopHeader';
import { MobileBottomNav } from './components/MobileBottomNav';
import { ChatProvider } from './contexts/ChatContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { useSocketEvents } from './hooks/useSocketEvents';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { CreateSession } from './pages/CreateSession';
import { JoinSession } from './pages/JoinSession';
import { ChatRoom } from './pages/ChatRoom';
import { Summary } from './pages/Summary';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';
import { Summaries } from './pages/Summaries';
import { Archive } from './pages/Archive';
import { PublicProfile } from './pages/PublicProfile';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function AppContent() {
  // Listen for global socket events (notifications, join requests)
  useSocketEvents();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/profile/:id" element={<PublicProfile />} />
      <Route path="/session/:id/summary/public" element={<Summary publicMode />} />

      {/* Protected Routes */}
      <Route
        path="*"
        element={
          <AuthGuard>
            <ChatProvider>
              <div className="app-container">
                <TopHeader />
                <MobileBottomNav />
                <main className="flex-1 overflow-y-auto">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/my-cellar" element={<Dashboard />} />
                    <Route path="/create" element={<CreateSession />} />
                    <Route path="/join" element={<JoinSession />} />
                    <Route path="/join/:id" element={<JoinSession />} />
                    <Route path="/session/:id" element={<ChatRoom />} />
                    <Route path="/session/:id/summary" element={<Summary />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/summaries" element={<Summaries />} />
                    <Route path="/archive" element={<Archive />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </main>
              </div>
            </ChatProvider>
          </AuthGuard>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
