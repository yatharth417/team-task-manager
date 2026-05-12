import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, LayoutDashboard, FolderKanban } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => { logout(); navigate('/login'); };

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <nav style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '0 1.5rem', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
      {/* Logo */}
      <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
        <div style={{ width: 28, height: 28, background: 'var(--accent)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>⚡</div>
        <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.05rem', color: 'var(--text)' }}>TaskFlow</span>
      </Link>

      {/* Nav links */}
      <div style={{ display: 'flex', gap: '0.25rem' }}>
        <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem', borderRadius: 7, textDecoration: 'none', fontSize: '0.85rem', fontFamily: 'Syne, sans-serif', fontWeight: 500, color: isActive('/dashboard') ? 'var(--text)' : 'var(--muted)', background: isActive('/dashboard') ? 'var(--surface2)' : 'transparent', transition: 'all 0.15s' }}>
          <LayoutDashboard size={14} /> Dashboard
        </Link>
        <Link to="/projects" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem', borderRadius: 7, textDecoration: 'none', fontSize: '0.85rem', fontFamily: 'Syne, sans-serif', fontWeight: 500, color: isActive('/projects') ? 'var(--text)' : 'var(--muted)', background: isActive('/projects') ? 'var(--surface2)' : 'transparent', transition: 'all 0.15s' }}>
          <FolderKanban size={14} /> Projects
        </Link>
      </div>

      {/* User + logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontFamily: 'Syne, sans-serif', fontWeight: 700, color: 'white' }}>
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{user?.name}</span>
        <button onClick={handleLogout} className="btn-ghost" style={{ padding: '0.35rem 0.7rem' }}>
          <LogOut size={13} />
        </button>
      </div>
    </nav>
  );
}
