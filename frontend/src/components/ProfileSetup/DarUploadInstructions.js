import React from 'react';
import './DarUploadInstructions.css';

function DarUploadInstructions({ onUploadClick }) {
  return (
    <div className="dar-upload-card">
      <h1 className="dar-upload-title">Degree Audit Report Upload</h1>
      <p className="dar-upload-description">
        Upload your Degree Audit Report (DAR) to get a personalized experience. With it, we'll generate real-time, detailed reports showing exactly which classes you need to graduate as you plan your courses.
      </p>

      <div className="instructions-list">
        <div className="instruction-item">
          <div className="instruction-number">1</div>
          <p className="instruction-text">
            Log on to MyUCLA and access your Degree Audit Report (DAR) under the academics tab.
          </p>
        </div>

        <div className="instruction-item">
          <div className="instruction-number">2</div>
          <p className="instruction-text">
            Run your DAR in accordance with your major/majors and minor/minors.
          </p>
        </div>

        <div className="instruction-item">
          <div className="instruction-number">3</div>
          <p className="instruction-text">
            Click "File" on your computer navigation bar and "export as PDF."
          </p>
        </div>
      </div>

      <button className="upload-button" onClick={onUploadClick}>
        <svg className="upload-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7 16C7 16 7 17 8 17H16C17 17 17 16 17 16M12 7V14M12 7L9 10M12 7L15 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3Z" stroke="white" strokeWidth="2"/>
        </svg>
        Upload PDF File
      </button>
    </div>
  );
}

export default DarUploadInstructions;
