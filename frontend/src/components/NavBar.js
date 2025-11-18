import React from 'react';
import './NavBar.css';

function NavBar() {
  return (
    <nav className="navbar">
      <div className="navbar-content">
        <div className="navbar-header">
          <h1 className="navbar-logo">Bruin Plan</h1>
          <div className="navbar-right">
            <div className="navbar-links">
              <a href="#explore" className="navbar-link">Explore Courses</a>
              <a href="#plan" className="navbar-link">Plan</a>
              <a href="#progress" className="navbar-link">Degree Progress</a>
              <a href="#profile-setup" className="navbar-link active">Profile</a>
            </div>
            <span className="navbar-divider">|</span>
            <button className="login-button">Login</button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default NavBar;
