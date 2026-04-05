import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useThemeStore } from './store';
import { Toaster } from './components/ui/sonner';
import { useEffect, useState } from 'react';
import PageLoader from './components/ui/PageLoader';
import { AnimatePresence } from 'framer-motion';

// Pages
import Login from './pages/Login';
import UserLayout from './layouts/UserLayout';
import AdminLayout from './layouts/AdminLayout';
import UserDashboard from './pages/user/Dashboard';
import UserDocuments from './pages/user/Documents';
import DocumentAnalysis from './pages/user/DocumentAnalysis';
import UserProfile from './pages/user/Profile';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminDocuments from './pages/admin/Documents';
import KnowledgeBase from './pages/admin/KnowledgeBase';
import Chunks from './pages/admin/Chunks';
import ExtractionSchema from './pages/admin/ExtractionSchema';
import Agents from './pages/admin/Agents';
import Classifier from './pages/admin/Classifier';
import Mapping from './pages/admin/Mapping';
import Prompts from './pages/admin/Prompts';
import Diseases from './pages/admin/Diseases';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && user && !allowedRoles.includes(user.role))
    return <Navigate to={user.role === 'admin' ? '/admin' : '/user'} replace />;
  return <>{children}</>;
};

// Route Transition Loader
const RouteTransitionLoader = () => {
  const location = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    // Show loader on route change
    setIsTransitioning(true);
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 600); // Quick transition for better UX
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <AnimatePresence mode="wait">
      {isTransitioning && <PageLoader key="route-loader" />}
    </AnimatePresence>
  );
};

function App() {
  const { theme } = useThemeStore();
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  useEffect(() => {
    // Artificial delay for high-quality loading feel
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <AnimatePresence mode="wait">
        {isInitialLoading && <PageLoader key="initial-loader" />}
      </AnimatePresence>

      {!isInitialLoading && (
        <Router>
          <RouteTransitionLoader />
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* User Routes */}
            <Route path="/user" element={<ProtectedRoute allowedRoles={['user']}><UserLayout /></ProtectedRoute>}>
              <Route index element={<UserDashboard />} />
              <Route path="documents" element={<UserDocuments />} />
              <Route path="documents/:id/analysis" element={<DocumentAnalysis />} />
              <Route path="profile" element={<UserProfile />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout /></ProtectedRoute>}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="documents" element={<AdminDocuments />} />
              <Route path="knowledge-base" element={<KnowledgeBase />} />
              <Route path="chunks" element={<Chunks />} />
              <Route path="extraction-schema" element={<ExtractionSchema />} />
              <Route path="agents" element={<Agents />} />
              <Route path="classifier" element={<Classifier />} />
              <Route path="mapping" element={<Mapping />} />
              <Route path="prompts" element={<Prompts />} />
              <Route path="diseases" element={<Diseases />} />
            </Route>

            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
          <Toaster 
            position="top-right" 
            expand={false} 
            richColors 
            closeButton
            theme={theme}
            toastOptions={{
              className: 'rounded-2xl border-border/50 backdrop-blur-xl bg-card/80 shadow-2xl',
              style: {
                padding: '1rem',
              }
            }}
          />
        </Router>
      )}
    </>
  );
}

export default App;
