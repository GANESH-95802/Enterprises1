import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { enterpriseService } from '../../services';
import {
  FiSearch, FiBell, FiUser, FiSettings, FiLogOut, FiChevronDown,
  FiMenu, FiHelpCircle,
} from 'react-icons/fi';

export default function Header({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const [notifRes, countRes] = await Promise.all([
          enterpriseService.getNotifications({ limit: 5 }),
          enterpriseService.getUnreadCount(),
        ]);
        setNotifications(notifRes.data?.notifications || notifRes.data?.data || []);
        setUnreadCount(countRes.data?.count || 0);
      } catch {
        // Silent fail
      }
    };
    loadNotifications();
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const markAllRead = async () => {
    try {
      await enterpriseService.markAllNotificationsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // Silent
    }
  };

  return (
    <header className="header">
      <div className="header-left">
        <button className="header-menu-btn" onClick={onToggleSidebar} aria-label="Toggle menu">
          <FiMenu />
        </button>
        <form className={`header-search ${searchOpen ? 'open' : ''}`} onSubmit={handleSearch} ref={searchRef}>
          <FiSearch className="header-search-icon" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchOpen(true)}
            aria-label="Search"
          />
        </form>
      </div>

      <div className="header-right">
        {/* Notifications */}
        <div className="header-dropdown" ref={notifRef}>
          <button
            className="header-icon-btn"
            onClick={() => setNotifOpen(!notifOpen)}
            aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ''}`}
          >
            <FiBell />
            {unreadCount > 0 && <span className="header-badge">{unreadCount}</span>}
          </button>
          {notifOpen && (
            <div className="header-dropdown-menu notif-menu">
              <div className="dropdown-header">
                <strong>Notifications</strong>
                <button className="btn btn-sm btn-outline" onClick={markAllRead}>Mark all read</button>
              </div>
              <div className="dropdown-body">
                {notifications.length === 0 ? (
                  <div className="dropdown-empty">No notifications</div>
                ) : (
                  notifications.map((n) => (
                    <div key={n._id} className={`notif-item ${n.read ? '' : 'unread'}`}>
                      <div className="notif-title">{n.title || n.message || 'Notification'}</div>
                      <div className="notif-time">{new Date(n.createdAt).toLocaleString()}</div>
                    </div>
                  ))
                )}
              </div>
              <div className="dropdown-footer">
                <Link to="/notifications" onClick={() => setNotifOpen(false)}>View all</Link>
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="header-dropdown" ref={profileRef}>
          <button className="header-profile-btn" onClick={() => setProfileOpen(!profileOpen)}>
            <div className="header-avatar">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="header-profile-info">
              <div className="header-profile-name">{user?.name}</div>
              <div className="header-profile-role">{user?.role}</div>
            </div>
            <FiChevronDown />
          </button>
          {profileOpen && (
            <div className="header-dropdown-menu profile-menu">
              <Link to="/profile" onClick={() => setProfileOpen(false)}>
                <FiUser /> Profile
              </Link>
              <Link to="/settings" onClick={() => setProfileOpen(false)}>
                <FiSettings /> Settings
              </Link>
              <Link to="/help" onClick={() => setProfileOpen(false)}>
                <FiHelpCircle /> Help
              </Link>
              <button onClick={handleLogout}>
                <FiLogOut /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}