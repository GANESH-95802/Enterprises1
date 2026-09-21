import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Loading } from './components/ui';
import AppLayout from './components/layout/AppLayout';
import ErrorBoundary from './components/ui/ErrorBoundary';

// Public pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import About from './pages/About';

// Lazy loaded pages for performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Assistant = lazy(() => import('./pages/Assistant'));
const KnowledgeBase = lazy(() => import('./pages/KnowledgeBase'));
const Recommendations = lazy(() => import('./pages/Recommendations'));
const DocumentIntelligence = lazy(() => import('./pages/DocumentIntelligence'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Monitoring = lazy(() => import('./pages/Monitoring'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Admin = lazy(() => import('./pages/Admin'));
const Reports = lazy(() => import('./pages/Reports'));
const ActivityLogs = lazy(() => import('./pages/ActivityLogs'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const Help = lazy(() => import('./pages/Help'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const Businesses = lazy(() => import('./pages/Businesses'));
const Products = lazy(() => import('./pages/Products'));
const Customers = lazy(() => import('./pages/Customers'));
const Agents = lazy(() => import('./pages/Agents'));
const AgentChat = lazy(() => import('./pages/AgentChat'));
const Organization = lazy(() => import('./pages/Organization'));
const Billing = lazy(() => import('./pages/Billing'));
const UsageAnalytics = lazy(() => import('./pages/UsageAnalytics'));

function PrivateRoute({ children, requiredRole }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading text="Checking authentication..." fullPage />;
  if (!user) return <Navigate to="/login" replace />;
  if (requiredRole && !['admin', 'manager'].includes(user.role) && user.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading text="Checking access..." fullPage />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin' && user.role !== 'manager') return <Navigate to="/dashboard" replace />;
  return children;
}

function PageLoader() {
  return (
    <div className="page-container">
      <Loading text="Loading page..." />
    </div>
  );
}

function LayoutWithOutlet() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}

// Wrapper to redirect authenticated users away from public pages
function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading text="Loading..." fullPage />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
          <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
          <Route path="/about" element={<About />} />

          {/* Protected routes with layout */}
          <Route element={<PrivateRoute><LayoutWithOutlet /></PrivateRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/assistant" element={<Assistant />} />
            <Route path="/knowledge-base" element={<KnowledgeBase />} />
            <Route path="/recommendations" element={<Recommendations />} />
            <Route path="/document-intelligence" element={<DocumentIntelligence />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/monitoring" element={<Monitoring />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/activity-logs" element={<ActivityLogs />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/help" element={<Help />} />
            <Route path="/businesses" element={<Businesses />} />
            <Route path="/products" element={<Products />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/agents" element={<Agents />} />
            <Route path="/agents/:agentId/chat" element={<AgentChat />} />
            <Route path="/organization" element={<Organization />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/usage-analytics" element={<UsageAnalytics />} />
            <Route path="/users" element={<UsersPage />} />
          </Route>

          {/* Admin routes */}
          <Route element={<AdminRoute><LayoutWithOutlet /></AdminRoute>}>
            <Route path="/admin" element={<Admin />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}