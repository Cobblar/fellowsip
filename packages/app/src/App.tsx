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
import { PublicSessionLog } from './pages/PublicSessionLog';
import { ComparisonSummary } from './pages/ComparisonSummary';
import { Friends } from './pages/Friends';

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
      <Route
        path="/profile/:id/public"
        element={
          <div className="flex-1 overflow-y-auto">
            <PublicProfile />
          </div>
        }
      />
      <Route
        path="/session/:id/summary/public"
        element={
          <div className="flex-1 overflow-y-auto">
            <Summary publicMode />
          </div>
        }
      />
      <Route
        path="/session/:id/log/public"
        element={
          <div className="flex-1 overflow-hidden">
            <PublicSessionLog />
          </div>
        }
      />

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
                    <Route path="/tasting-notes" element={<Dashboard />} />
                    <Route path="/create" element={<CreateSession />} />
                    <Route path="/join" element={<JoinSession />} />
                    <Route path="/join/:id" element={<JoinSession />} />
                    <Route path="/session/:id" element={<ChatRoom />} />
                    <Route path="/session/:id/summary" element={<Summary />} />
                    <Route path="/session/:id/comparison" element={<ComparisonSummary />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/sessions" element={<Summaries />} />
                    <Route path="/friends" element={<Friends />} />
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
