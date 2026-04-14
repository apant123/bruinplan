import React, { useEffect, useRef } from 'react';
import './CourseDetailModal.css';

function CourseDetailModal({ isOpen, course, onClose }) {
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) modalRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (isOpen && e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !course) return null;

  const courseCode = `${course.subjectCode || ''} ${course.number || ''}`.trim();

  return (
    <div className="cd-overlay" onClick={onClose}>
      <div
        className="cd-modal"
        ref={modalRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="cd-header">
          <div>
            <div className="cd-code">{courseCode}</div>
            <div className="cd-title">{course.title || 'Untitled Course'}</div>
          </div>
          <button className="cd-close-btn" onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Units badge */}
        <div className="cd-badges">
          <span className="cd-badge cd-badge-units">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
            </svg>
            {course.units ?? '—'} units
          </span>
        </div>

        {/* Description */}
        <div className="cd-section">
          <h4 className="cd-section-label">Description</h4>
          <p className="cd-description">
            {course.description || 'No description available.'}
          </p>
        </div>

        {/* Prerequisites */}
        <div className="cd-section">
          <h4 className="cd-section-label">Prerequisites</h4>
          <p className="cd-prereqs">
            {course.requisites_text || 'None listed.'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default CourseDetailModal;
