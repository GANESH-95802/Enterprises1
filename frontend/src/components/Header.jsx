import { useAuth } from '../context/AuthContext';
import { FiLogOut, FiUser } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-left">
        <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--gray-800)' }}>
          Welcome back, {user?.name || 'User'}
        </h2>
      </div>
      <div className="header-right">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FiUser size={18} color="var(--primary)" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{user?.name}</div>
            <div style={{ fontSize: 12, color: 'var(--gray-500)', textTransform: 'capitalize' }}>{user?.role}</div>
          </div>
        </div>
        <button className="btn btn-outline btn-sm" onClick={handleLogout}>
          <FiLogOut /> Logout
        </button>
      </div>
    </header>
  );
}