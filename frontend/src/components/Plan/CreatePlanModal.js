import React, { useEffect, useRef, useState } from 'react';
import './CreatePlanModal.css';

function CreatePlanModal({ isOpen, onConfirm, onCancel }) {
  const [name, setName] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (isOpen && e.key === 'Escape') onCancel();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onConfirm(trimmed);
  };

  return (
    <div className="cp-overlay" onClick={onCancel}>
      <div className="cp-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cp-icon-row">
          <div className="cp-icon-circle">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="#247ad6" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>
        </div>

        <h3 className="cp-title">Create New Plan</h3>
        <p className="cp-sub">Give your plan a name to get started.</p>

        <input
          ref={inputRef}
          className="cp-input"
          type="text"
          placeholder="e.g. 4-Year Plan, Fall 2023 Start…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />

        <div className="cp-actions">
          <button className="cp-cancel-btn" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="cp-confirm-btn"
            onClick={handleSubmit}
            disabled={!name.trim()}
          >
            Create Plan
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreatePlanModal;
