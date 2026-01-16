import React, { useState, useRef } from 'react';
import './UploadModal.css';

function UploadModal({ isOpen, onClose, onUpload }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileSelect = (file) => {
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
    } else {
      alert('Please select a PDF file');
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    handleFileSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = () => {
    if (selectedFile) {
      setIsUploading(true);
      setUploadProgress(0);

      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              onUpload(selectedFile);
              setIsUploading(false);
              setUploadProgress(0);
              setSelectedFile(null);
            }, 500);
            return 100;
          }
          return prev + 10;
        });
      }, 100);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setIsUploading(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-row">
            <svg className="upload-icon-header" width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M7 16C7 16 7 17 8 17H16C17 17 17 16 17 16M12 7V14M12 7L9 10M12 7L15 10" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3Z" stroke="#666" strokeWidth="2"/>
            </svg>
            <div>
              <h2 className="modal-title">Upload files</h2>
              <p className="modal-subtitle">Select and upload a PDF of your Degree Audit Report</p>
            </div>
          </div>
          <button className="close-button" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="#666" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div
          className={`upload-area ${isDragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <svg className="cloud-icon" width="60" height="60" viewBox="0 0 60 60" fill="none">
            <path d="M20 40C20 40 20 42.5 22.5 42.5H37.5C40 42.5 40 40 40 40M30 17.5V35M30 17.5L22.5 25M30 17.5L37.5 25" stroke="#666" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M30 7.5C18.9543 7.5 10 16.4543 10 27.5C10 38.5457 18.9543 47.5 30 47.5C41.0457 47.5 50 38.5457 50 27.5C50 16.4543 41.0457 7.5 30 7.5Z" stroke="#666" strokeWidth="3"/>
          </svg>

          <p className="upload-text">
            {selectedFile ? selectedFile.name : 'Choose a file or drag & drop it here'}
          </p>
          <p className="upload-subtext">PDF file only</p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
          />

          <button className="browse-button" onClick={handleBrowseClick}>
            Browse File
          </button>
        </div>

        {selectedFile && !isUploading && (
          <button className="upload-submit-button" onClick={handleUpload}>
            Upload
          </button>
        )}

        {selectedFile && (
          <div className="file-upload-card">
            <div className="file-info">
              <div className="pdf-icon">PDF</div>
              <div className="file-details">
                <p className="file-name">{selectedFile.name}</p>
                <div className="file-meta">
                  <span className="file-size">{Math.round(selectedFile.size / 1024)} KB of {Math.round(selectedFile.size / 1024)} KB</span>
                  {isUploading && (
                    <>
                      <span className="file-separator">•</span>
                      <div className="uploading-indicator">
                        <svg className="spinner" width="16" height="16" viewBox="0 0 16 16">
                          <circle cx="8" cy="8" r="6" stroke="#247ad6" strokeWidth="2" fill="none" strokeDasharray="31.4" strokeDashoffset="8" />
                        </svg>
                        <span className="uploading-text">Uploading...</span>
                      </div>
                    </>
                  )}
                </div>
                {isUploading && (
                  <div className="upload-progress-bar-container">
                    <div className="upload-progress-bar" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                )}
              </div>
            </div>
            {!isUploading && (
              <button className="remove-file-button" onClick={handleRemoveFile}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="9" stroke="#666" strokeWidth="1.5"/>
                  <path d="M13 7L7 13M7 7L13 13" stroke="#666" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default UploadModal;
