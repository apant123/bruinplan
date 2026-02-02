import React from 'react';

function DegreeProgress() {
  return (
    <div className="degree-projection">
      <div className="projection-header">
        <h2>Degree Progress Projection</h2>
        <div className="projection-warning">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 1l7 14H1L8 1z" fill="#ff9800"/>
            <text x="8" y="11" textAnchor="middle" fill="white" fontSize="10">!</text>
          </svg>
          <span>This estimate is based on your plan and may differ from official records</span>
        </div>
      </div>
      <div className="projection-bars">
        <div className="projection-item">
          <div className="projection-label">General Education</div>
          <div className="projection-bar">
            <div className="projection-fill orange" style={{ width: '83%' }}></div>
          </div>
          <div className="projection-value">39/47 Units</div>
        </div>
        <div className="projection-item">
          <div className="projection-label">Major</div>
          <div className="projection-bar">
            <div className="projection-fill green" style={{ width: '87%' }}></div>
          </div>
          <div className="projection-value">80/92 Units</div>
        </div>
        <div className="projection-item">
          <div className="projection-label">Upper Division</div>
          <div className="projection-bar">
            <div className="projection-fill purple" style={{ width: '78%' }}></div>
          </div>
          <div className="projection-value">47/60 Units</div>
        </div>
        <div className="projection-item">
          <div className="projection-label">180 Units</div>
          <div className="projection-bar">
            <div className="projection-fill blue" style={{ width: '59%' }}></div>
          </div>
          <div className="projection-value">106/180 Units</div>
        </div>
      </div>
    </div>
  );
}

export default DegreeProgress;
