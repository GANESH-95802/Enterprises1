import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AppLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [typeof window !== 'undefined' ? window.location.pathname : '']);

  const toggleSidebar = () => {
    if (window.innerWidth <= 768) {
      setMobileOpen((prev) => !prev);
    } else {
      setCollapsed((prev) => !prev);
    }
  };

  return (
    <div className={`app-layout ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar collapsed={collapsed} mobileOpen={mobileOpen} onToggle={toggleSidebar} />
      {mobileOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />
      )}
      <div className="main-content">
        <Header onToggleSidebar={toggleSidebar} />
        <main className="page-container">{children}</main>
      </div>
    </div>
  );
}