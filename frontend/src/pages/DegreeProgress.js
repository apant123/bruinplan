import React, { useState } from 'react';
import NavBar from '../components/NavBar';
import './DegreeProgress.css';

function DegreeProgress() {
  const [activeTab, setActiveTab] = useState('needed');
  const [filter, setFilter] = useState('all');
  const [expandedCategories, setExpandedCategories] = useState({});
  const [filters, setFilters] = useState({
    subjectArea: 'Computer Science (COM SCI)',
    units: 1
  });

  // Sample data
  const progressData = [
    { label: '180 Units', completed: 100, total: 180, color: 'blue' },
    { label: 'General Education', completed: 39, total: 60, color: 'orange' },
    { label: 'Major', completed: 74, total: 100, color: 'green' },
    { label: 'Upper Division', completed: 39, total: 60, color: 'purple' }
  ];

  const requirements = [
    {
      id: 'american-history',
      title: 'American History & Institutions',
      subtitle: '',
      items: [
        { text: 'American History & Institutions Satisfied', status: 'completed', courses: [] }
      ]
    },
    {
      id: 'writing',
      title: 'Entry Level Writing/ESL',
      subtitle: '',
      items: [
        { text: 'Satisfied by UC Placement Exam', status: 'completed', courses: [] }
      ]
    },
    {
      id: 'foundations',
      title: 'Foundations of Arts and Humanities',
      subtitle: 'Three Courses; One From Each Area',
      items: [
        {
          text: 'One Literary and Cultural Analysis Course',
          status: 'completed',
          courses: ['COM LIT 4DW']
        }
      ]
    }
  ];

  const sampleCourses = [
    { id: 1, code: 'COM SCI 32', title: 'Introduction to Computer Science II', units: 4.0 },
    { id: 2, code: 'COM SCI 32', title: 'Introduction to Computer Science II', units: 4.0 },
    { id: 3, code: 'COM SCI 32', title: 'Introduction to Computer Science II', units: 4.0 },
    { id: 4, code: 'COM SCI 32', title: 'Introduction to Computer Science II', units: 4.0 }
  ];

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const getCircleProgress = (completed, total) => {
    const percentage = (completed / total) * 100;
    const circumference = 2 * Math.PI * 45;
    const offset = circumference - (percentage / 100) * circumference;
    return { percentage, offset, circumference };
  };

  return (
    <div className="degree-progress-page">
      <NavBar />

      <div className="degree-progress-container">
        <div className="overview-section">
          <div className="overview-left">
            <h2>Degree Progress Overview</h2>
            <div className="progress-circles">
              {progressData.map((item, idx) => {
                const { percentage, offset, circumference } = getCircleProgress(item.completed, item.total);
                return (
                  <div key={idx} className="progress-circle-item">
                    <svg width="140" height="140" className="progress-svg">
                      <circle
                        cx="70"
                        cy="70"
                        r="45"
                        fill="none"
                        stroke="#ffd966"
                        strokeWidth="12"
                      />
                      <circle
                        cx="70"
                        cy="70"
                        r="45"
                        fill="none"
                        stroke={`var(--color-${item.color})`}
                        strokeWidth="12"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        transform="rotate(-90 70 70)"
                      />
                      <text x="70" y="75" textAnchor="middle" className="progress-number">
                        {item.completed}
                      </text>
                    </svg>
                    <div className="progress-label">{item.label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="graduation-projection">
            <h2>Graduation Projection</h2>
            <div className="standing-badge">
              <span>Senior Standing</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" stroke="#247ad6" strokeWidth="1.5" fill="none"/>
                <text x="8" y="11" textAnchor="middle" fill="#247ad6" fontSize="10" fontWeight="600">i</text>
              </svg>
            </div>
            <div className="expected-grad">Expected: Spring 2026</div>
            <div className="progress-bar-container">
              <div className="progress-bar-fill"></div>
            </div>
            <p className="projection-text">On track to graduate in 4 years based on current pace.</p>
          </div>
        </div>

        <div className="tabs-section">
          <button
            className={`tab ${activeTab === 'needed' ? 'active' : ''}`}
            onClick={() => setActiveTab('needed')}
          >
            Courses Needed/Completed
          </button>
          <button
            className={`tab ${activeTab === 'suggestions' ? 'active' : ''}`}
            onClick={() => setActiveTab('suggestions')}
          >
            Course Suggestions
          </button>
        </div>

        {activeTab === 'needed' && (
          <div className="requirements-section">
            <div className="filter-buttons">
              <button
                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                Show All
              </button>
              <button
                className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
                onClick={() => setFilter('completed')}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M13.5 4L6 11.5L2.5 8" stroke="#28a745" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Completed
              </button>
              <button
                className={`filter-btn ${filter === 'progress' ? 'active' : ''}`}
                onClick={() => setFilter('progress')}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="3" y="3" width="10" height="10" fill="#ffc107"/>
                </svg>
                In Progress
              </button>
              <button
                className={`filter-btn ${filter === 'needed' ? 'active' : ''}`}
                onClick={() => setFilter('needed')}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M4 4L12 12M12 4L4 12" stroke="#dc3545" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Needed
              </button>
            </div>

            <div className="requirements-list">
              {requirements.map(req => (
                <div key={req.id} className="requirement-category">
                  <div className="category-header" onClick={() => toggleCategory(req.id)}>
                    <div>
                      <h3>{req.title}</h3>
                      {req.subtitle && <p className="category-subtitle">{req.subtitle}</p>}
                    </div>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      style={{
                        transform: expandedCategories[req.id] ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s'
                      }}
                    >
                      <path d="M6 8L10 12L14 8" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>

                  {expandedCategories[req.id] && (
                    <div className="category-content">
                      {req.items.map((item, idx) => (
                        <div key={idx} className="requirement-item">
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <circle cx="10" cy="10" r="9" fill="#28a745"/>
                            <path d="M6 10L9 13L14 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <div>
                            <div className="requirement-text">{item.text}</div>
                            {item.courses.length > 0 && (
                              <div className="course-links">
                                {item.courses.map((course, cidx) => (
                                  <span key={cidx} className="course-link">{course}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'suggestions' && (
          <div className="suggestions-section">
            <aside className="suggestions-filters">
              <div className="filters-header">
                <h3>Filters</h3>
                <button className="clear-button">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M12 4L4 12M4 4L12 12" stroke="#247ad6" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Clear
                </button>
              </div>

              <div className="filter-group">
                <label>Subject Area</label>
                <select value={filters.subjectArea} onChange={(e) => setFilters({...filters, subjectArea: e.target.value})}>
                  <option value="Computer Science (COM SCI)">Computer Science (COM SCI)</option>
                  <option value="Mathematics (MATH)">Mathematics (MATH)</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Class Units</label>
                <input
                  type="range"
                  min="1"
                  max="6"
                  value={filters.units}
                  onChange={(e) => setFilters({...filters, units: parseInt(e.target.value)})}
                  className="units-slider"
                />
                <div className="units-labels">
                  <span>1</span>
                  <span>2</span>
                  <span>3</span>
                  <span>4</span>
                  <span>5</span>
                  <span>6</span>
                </div>
              </div>
            </aside>

            <div className="suggestions-courses">
              {sampleCourses.map(course => (
                <div key={course.id} className="suggestion-course-card">
                  <div className="course-info">
                    <div className="course-code">{course.code}</div>
                    <div className="course-title">{course.title}</div>
                    <div className="course-units">{course.units} Units</div>
                  </div>
                  <div className="course-actions">
                    <button className="icon-button">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M4 3H16C16.55 3 17 3.45 17 4V17L10 14L3 17V4C3 3.45 3.45 3 4 3Z" stroke="#247ad6" strokeWidth="1.5" fill="none"/>
                      </svg>
                    </button>
                    <button className="icon-button">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M10 3L11.5 8.5H17L12.5 12L14 17.5L10 14L6 17.5L7.5 12L3 8.5H8.5L10 3Z" stroke="#247ad6" strokeWidth="1.5" fill="none"/>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DegreeProgress;
