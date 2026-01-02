import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthGuard } from './components/AuthGuard';
import { TopHeader } from './components/TopHeader';
import { MobileBottomNav } from './components/MobileBottomNav';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ChatProvider } from './contexts/ChatContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { useSocketEvents } from './hooks/useSocketEvents';

// Lazy load page components
const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const CreateSession = lazy(() => import('./pages/CreateSession').then(m => ({ default: m.CreateSession })));
const JoinSession = lazy(() => import('./pages/JoinSession').then(m => ({ default: m.JoinSession })));
const ChatRoom = lazy(() => import('./pages/ChatRoom').then(m => ({ default: m.ChatRoom })));
const Summary = lazy(() => import('./pages/Summary').then(m => ({ default: m.Summary })));
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const Summaries = lazy(() => import('./pages/Summaries').then(m => ({ default: m.Summaries })));
const Archive = lazy(() => import('./pages/Archive').then(m => ({ default: m.Archive })));
const PublicProfile = lazy(() => import('./pages/PublicProfile').then(m => ({ default: m.PublicProfile })));
const PublicSessionLog = lazy(() => import('./pages/PublicSessionLog').then(m => ({ default: m.PublicSessionLog })));
const ComparisonSummary = lazy(() => import('./pages/ComparisonSummary').then(m => ({ default: m.ComparisonSummary })));
const Friends = lazy(() => import('./pages/Friends').then(m => ({ default: m.Friends })));

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

  const location = useLocation();
  const showBottomNav = !(location.pathname.startsWith('/session/') && !location.pathname.endsWith('/summary'));

  return (
    <Suspense fallback={<LoadingSpinner />}>
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
                  <main className={`flex-1 overflow-y-auto ${showBottomNav ? 'has-bottom-nav' : ''}`}>
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
    </Suspense>
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
