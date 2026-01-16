import React from 'react';
import './ProgressBar.css';

function ProgressBar({ currentStep, totalSteps }) {
  return (
    <div className="progress-bar-container">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div
          key={index}
          className={`progress-bar-step ${index < currentStep ? 'active' : ''}`}
        />
      ))}
    </div>
  );
}

export default ProgressBar;
