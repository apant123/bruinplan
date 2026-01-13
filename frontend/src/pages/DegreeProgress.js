import React from 'react';
import NavBar from '../components/NavBar';
import './PlaceholderPage.css';

function DegreeProgress() {
  return (
    <div className="placeholder-page">
      <NavBar />
      <div className="placeholder-container">
        <h1>Degree Progress</h1>
        <p>Track your progress towards graduation</p>
        <div className="coming-soon">Coming Soon</div>
      </div>
    </div>
  );
}

export default DegreeProgress;
