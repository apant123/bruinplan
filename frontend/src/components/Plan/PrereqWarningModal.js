import React, { useEffect, useRef } from 'react';
import './PrereqWarningModal.css';

function PrereqWarningModal({ isOpen, reason, onConfirm, onCancel }) {
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Trap focus inside modal
      modalRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (!isOpen) return;
      if (e.key === 'Escape') onCancel();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="prereq-overlay" onClick={onCancel}>
      <div
        className="prereq-modal"
        ref={modalRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="prereq-icon-row">
          <div className="prereq-icon-circle">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                stroke="#e6a817"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        <h3 className="prereq-title">Prerequisite Warning</h3>

        <p className="prereq-reason">{reason}</p>
        <p className="prereq-sub">
          The enforced requisite(s) are not placed in a previous quarter.
        </p>

        <div className="prereq-actions">
          <button className="prereq-cancel-btn" onClick={onCancel}>
            Cancel
          </button>
          <button className="prereq-confirm-btn" onClick={onConfirm}>
            Place Anyway
          </button>
        </div>
      </div>
    </div>
  );
}

export default PrereqWarningModal;
