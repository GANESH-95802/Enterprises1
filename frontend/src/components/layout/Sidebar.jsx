import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FiGrid, FiMessageSquare, FiDatabase, FiThumbsUp, FiFileText,
  FiBarChart2, FiActivity, FiUser, FiSettings, FiBell,
  FiShield, FiFile, FiList, FiSearch, FiHelpCircle, FiInfo,
  FiBriefcase, FiPackage, FiUsers, FiLogOut, FiMenu, FiX, FiCpu,
  FiHome, FiDollarSign, FiTrendingUp,
} from 'react-icons/fi';
import { useState } from 'react';

const navSections = [
  {
    section: 'Overview',
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: FiGrid },
    ],
  },
  {
    section: 'AI Modules',
    items: [
      { path: '/assistant', label: 'AI Assistant', icon: FiMessageSquare },
      { path: '/knowledge-base', label: 'Knowledge Base', icon: FiDatabase },
      { path: '/recommendations', label: 'Recommendations', icon: FiThumbsUp },
      { path: '/document-intelligence', label: 'Document Intelligence', icon: FiFileText },
      { path: '/analytics', label: 'Analytics', icon: FiBarChart2 },
      { path: '/agents', label: 'AI Agents', icon: FiCpu },
    ],
  },
  {
    section: 'Business',
    items: [
      { path: '/businesses', label: 'Businesses', icon: FiBriefcase },
      { path: '/products', label: 'Products', icon: FiPackage },
      { path: '/customers', label: 'Customers', icon: FiUsers },
    ],
  },
  {
    section: 'Operations',
    items: [
      { path: '/monitoring', label: 'Monitoring', icon: FiActivity },
      { path: '/reports', label: 'Reports', icon: FiFile },
      { path: '/activity-logs', label: 'Activity Logs', icon: FiList },
      { path: '/search', label: 'Search', icon: FiSearch },
    ],
  },
  {
    section: 'SaaS',
    items: [
      { path: '/organization', label: 'Organization', icon: FiHome },
      { path: '/billing', label: 'Billing', icon: FiDollarSign },
      { path: '/usage-analytics', label: 'Usage Analytics', icon: FiTrendingUp },
    ],
  },
  {
    section: 'Administration',
    items: [
      { path: '/admin', label: 'Admin Dashboard', icon: FiShield },
      { path: '/users', label: 'Users', icon: FiUsers },
    ],
  },
  {
    section: 'Account',
    items: [
      { path: '/profile', label: 'Profile', icon: FiUser },
      { path: '/settings', label: 'Settings', icon: FiSettings },
      { path: '/notifications', label: 'Notifications', icon: FiBell },
    ],
  },
  {
    section: 'Support',
    items: [
      { path: '/help', label: 'Help & Support', icon: FiHelpCircle },
      { path: '/about', label: 'About', icon: FiInfo },
    ],
  },
];

export default function Sidebar({ collapsed, mobileOpen = false, onToggle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">AI</div>
        {!collapsed && <h2>Enterprise Hub</h2>}
        <button className="sidebar-toggle" onClick={onToggle} aria-label="Toggle sidebar">
          {collapsed ? <FiMenu /> : <FiX />}
        </button>
      </div>
      <nav className="sidebar-nav" aria-label="Main navigation">
        {navSections.map((section, i) => (
          <div key={i}>
            {!collapsed && <div className="nav-section">{section.section}</div>}
            {section.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                title={item.label}
              >
                <span className="nav-icon"><item.icon /></span>
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          {!collapsed && (
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.name}</div>
              <div className="sidebar-user-role">{user?.role}</div>
            </div>
          )}
        </div>
        {!collapsed && (
          <button className="btn btn-outline btn-sm sidebar-logout" onClick={handleLogout}>
            <FiLogOut /> Logout
          </button>
        )}
      </div>
    </aside>
  );
}