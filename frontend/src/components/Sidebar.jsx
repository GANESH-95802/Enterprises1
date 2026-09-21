import { NavLink } from 'react-router-dom';
import { FiGrid, FiUsers, FiBriefcase, FiPackage, FiShield, FiHardDrive, FiHeart, FiAward, FiFileText, FiCpu } from 'react-icons/fi';

const navItems = [
  { section: 'Main' },
  { path: '/dashboard', label: 'Dashboard', icon: FiGrid },
  { section: 'Business' },
  { path: '/businesses', label: 'Businesses', icon: FiBriefcase },
  { path: '/products', label: 'Products', icon: FiPackage },
  { path: '/customers', label: 'Customers', icon: FiUsers },
  { path: '/compliance', label: 'Compliance', icon: FiShield },
  { section: 'Projects' },
  { path: '/construction-projects', label: 'Construction', icon: FiHardDrive },
  { path: '/healthcare', label: 'Healthcare', icon: FiHeart },
  { section: 'Talent' },
  { path: '/skills', label: 'Skills', icon: FiAward },
  { path: '/certificates', label: 'Certificates', icon: FiFileText },
  { section: 'AI' },
  { path: '/ai-insights', label: 'AI Insights', icon: FiCpu },
  { path: '/users', label: 'Users', icon: FiUsers },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #2563eb, #7c3aed)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: 'white', fontWeight: 'bold' }}>AI</div>
        <h2>Enterprise Hub</h2>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item, i) => 
          item.section ? (
            <div key={i} className="nav-section">{item.section}</div>
          ) : (
            <NavLink key={item.path} to={item.path} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-icon"><item.icon /></span>
              <span>{item.label}</span>
            </NavLink>
          )
        )}
      </nav>
    </aside>
  );
}