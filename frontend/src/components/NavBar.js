import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './NavBar.css';

function NavBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  const handleLinkClick = (e, path) => {
    if (!isAuthenticated) {
      e.preventDefault();
      return;
    }
    if (path === '/plan' && location.pathname === '/plan') {
      e.preventDefault();
      navigate('/plan', { state: { resetKey: Date.now() } });
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/signup');
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <div className="navbar-header">
          <h1 className="navbar-logo" onClick={() => navigate(isAuthenticated ? '/profile' : '/signup')} style={{ cursor: 'pointer' }}>
            Bruin Plan
          </h1>
          <div className="navbar-right">
            <div className="navbar-links">
              <Link
                to="/explore"
                className={`navbar-link ${!isAuthenticated ? 'disabled' : ''} ${isActive('/explore')}`}
                onClick={(e) => handleLinkClick(e, '/explore')}
              >
                Explore Courses
              </Link>
              <Link
                to="/plan"
                className={`navbar-link ${!isAuthenticated ? 'disabled' : ''} ${isActive('/plan')}`}
                onClick={(e) => handleLinkClick(e, '/plan')}
              >
                Plan
              </Link>
              <Link
                to="/progress"
                className={`navbar-link ${!isAuthenticated ? 'disabled' : ''} ${isActive('/progress')}`}
                onClick={(e) => handleLinkClick(e, '/progress')}
              >
                Degree Progress
              </Link>
              <Link
                to="/profile"
                className={`navbar-link ${!isAuthenticated ? 'disabled' : ''} ${isActive('/profile')}`}
                onClick={(e) => handleLinkClick(e, '/profile')}
              >
                Profile
              </Link>
            </div>
            <span className="navbar-divider">|</span>
            {isAuthenticated ? (
              <button className="logout-button-nav" onClick={handleLogout}>Logout</button>
            ) : (
              <button className="login-button" onClick={() => navigate('/login')}>Login</button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default NavBar;
