import React from 'react';
import NavBar from '../components/NavBar';
import './PlaceholderPage.css';

function Plan() {
  return (
    <div className="placeholder-page">
      <NavBar />
      <div className="placeholder-container">
        <h1>Plan</h1>
        <p>Create and manage your academic plan</p>
        <div className="coming-soon">Coming Soon</div>
      </div>
    </div>
  );
}

export default Plan;
