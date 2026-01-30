import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NavBar from '../components/NavBar';
import './Profile.css';

function Profile() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  

  const getInitials = () => {
    if (!user) return '';
    const first = user.firstName ? user.firstName[0] : '';
    const last = user.lastName ? user.lastName[0] : '';
    return (first + last).toUpperCase();
  };

  const getFullName = () => {
    if (!user) return '';
    return `${user.firstName} ${user.lastName}`;
  };

  if (!user) {
    navigate('/signup');
    return null;
  }

  return (
    <div className="profile-page">
      <NavBar />

      <div className="profile-container">
        <div className="profile-header">
          <h1>My Profile</h1>
          <p>View and manage your academic profile</p>
        </div>

        <div className="profile-content">
          <div className="profile-left">
            <div className="profile-card">
              <div className="avatar">
                {getInitials()}
              </div>

              <div className="profile-name">{getFullName()}</div>
              <div className="profile-email">{user.email}</div>

              <div className="profile-stats">
                <div className="stat">
                  <div className="stat-value">{user.units || 0}</div>
                  <div className="stat-label">UNITS</div>
                </div>
                <div className="stat">
                  <div className="stat-value">{user.gpa ? Number(user.gpa).toFixed(2) : '0.00'}</div>
                  <div className="stat-label">GPA</div>
                </div>
              </div>
            </div>
          </div>

          <div className="profile-right">
            <div className="academic-info-card">
              <div className="card-header">
                <h2>Academic Information</h2>
                <button className="edit-button" onClick={() => alert('Edit functionality coming soon!')}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11.334 2.00004C11.5091 1.82494 11.7169 1.68605 11.9457 1.59129C12.1745 1.49653 12.4197 1.44775 12.6673 1.44775C12.9149 1.44775 13.1601 1.49653 13.3889 1.59129C13.6177 1.68605 13.8256 1.82494 14.0007 2.00004C14.1758 2.17513 14.3147 2.383 14.4094 2.61178C14.5042 2.84055 14.553 3.08575 14.553 3.33337C14.553 3.58099 14.5042 3.82619 14.4094 4.05497C14.3147 4.28374 14.1758 4.49161 14.0007 4.66671L5.00065 13.6667L1.33398 14.6667L2.33398 11L11.334 2.00004Z" stroke="#247ad6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Edit
                </button>
              </div>

              <div className="info-section">
                <div className="info-row">
                  <div className="info-item">
                    <div className="info-label">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 4.5C4 4.22386 4.22386 4 4.5 4H15.5C15.7761 4 16 4.22386 16 4.5V15.5C16 15.7761 15.7761 16 15.5 16H4.5C4.22386 16 4 15.7761 4 15.5V4.5Z" stroke="#247ad6" strokeWidth="1.5"/>
                        <path d="M7 7H13M7 10H13M7 13H10" stroke="#247ad6" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                      MAJOR
                    </div>
                    <div className="info-value">{user.major || 'Not set'}</div>
                  </div>

                  <div className="info-item">
                    <div className="info-label">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 4.5C4 4.22386 4.22386 4 4.5 4H15.5C15.7761 4 16 4.22386 16 4.5V15.5C16 15.7761 15.7761 16 15.5 16H4.5C4.22386 16 4 15.7761 4 15.5V4.5Z" stroke="#247ad6" strokeWidth="1.5"/>
                        <path d="M7 7H13M7 10H13M7 13H10" stroke="#247ad6" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                      MINOR
                    </div>
                    <div className="info-value">{user.minor || 'None'}</div>
                  </div>
                </div>

                <div className="info-row single">
                  <div className="info-item">
                    <div className="info-label">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 2L3 6V9C3 13.5 6 17.5 10 18C14 17.5 17 13.5 17 9V6L10 2Z" stroke="#247ad6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M10 10C10.8284 10 11.5 9.32843 11.5 8.5C11.5 7.67157 10.8284 7 10 7C9.17157 7 8.5 7.67157 8.5 8.5C8.5 9.32843 9.17157 10 10 10Z" stroke="#247ad6" strokeWidth="1.5"/>
                        <path d="M7.5 14C7.5 12.6193 8.61929 11.5 10 11.5C11.3807 11.5 12.5 12.6193 12.5 14" stroke="#247ad6" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                      EXPECTED GRADUATION
                    </div>
                    <div className="info-value">
                      {user.graduationQuarter && user.graduationYear
                        ? `${user.graduationQuarter} ${user.graduationYear}`
                        : 'Not set'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="account-settings-card">
              <h2>Account Settings</h2>

              <div className="settings-section">
                <div className={`dars-sync ${user.darsConnected ? 'connected' : ''}`}>
                  <div className="dars-info">
                    <div className="dars-title">DARS Sync</div>
                    <div className="dars-subtitle">
                      {user.darsConnected ? 'Connected and synced' : 'Not connected'}
                    </div>
                  </div>
                  {user.darsConnected && (
                    <span className="active-badge">Active</span>
                  )}
                </div>

                <div className="settings-option">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 4H17V6H3V4ZM5 8H15V10H5V8ZM3 12H17V14H3V12Z" fill="#1a1a1a"/>
                    <rect x="3" y="4" width="14" height="10" rx="1" stroke="#1a1a1a" strokeWidth="1.5" fill="none"/>
                  </svg>
                  <span>Email Preferences</span>
                </div>

                <div className="settings-option">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 12C11.1046 12 12 11.1046 12 10C12 8.89543 11.1046 8 10 8C8.89543 8 8 8.89543 8 10C8 11.1046 8.89543 12 10 12Z" stroke="#1a1a1a" strokeWidth="1.5"/>
                    <path d="M10 3V5M10 15V17M5.64 5.64L7.05 7.05M12.95 12.95L14.36 14.36M3 10H5M15 10H17M5.64 14.36L7.05 12.95M12.95 7.05L14.36 5.64" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <span>Account Settings</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
