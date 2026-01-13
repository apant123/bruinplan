import React, { useState } from 'react';
import NavBar from '../components/NavBar';
import './Plan.css';

function Plan() {
  const [view, setView] = useState('all-plans'); // 'all-plans' or 'editor'
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [majorFilter, setMajorFilter] = useState('Computer Science (COM SCI)');
  const [expandedYears, setExpandedYears] = useState({ year1: true, year2: true });

  const samplePlans = [
    {
      id: 1,
      title: 'Fall 2025 Schedule',
      type: 'quarter',
      period: 'Fall 2025 Quarter',
      units: 16,
      courses: [
        { code: 'COM SCI 32', color: 'green' },
        { code: 'COM SCI 32', color: 'green' },
        { code: 'COM SCI 32', color: 'orange' },
        { code: 'COM SCI 32', color: 'orange' },
        { code: 'COM SCI 32', color: 'green' },
        { code: 'COM SCI 32', color: 'green' }
      ]
    },
    {
      id: 2,
      title: '4 Year Plan',
      type: 'year',
      period: '2025-2027 Year',
      units: 180,
      courses: [
        { code: 'COM SCI 32', color: 'orange' },
        { code: 'COM SCI 32', color: 'green' },
        { code: 'COM SCI 32', color: 'green' },
        { code: 'COM SCI 32', color: 'orange' },
        { code: 'COM SCI 32', color: 'purple' },
        { code: 'COM SCI 32', color: 'purple' }
      ]
    },
    {
      id: 3,
      title: 'Fall 2025 Schedule',
      type: 'quarter',
      period: 'Fall 2025 Quarter',
      units: 16,
      courses: [
        { code: 'COM SCI 32', color: 'orange' },
        { code: 'COM SCI 32', color: 'purple' },
        { code: 'COM SCI 32', color: 'green' },
        { code: 'COM SCI 32', color: 'green' }
      ]
    },
    {
      id: 4,
      title: 'Fall 2025 Schedule',
      type: 'quarter',
      period: 'Fall 2025 Quarter',
      units: 16,
      courses: [
        { code: 'COM SCI 32', color: 'green' },
        { code: 'COM SCI 32', color: 'orange' },
        { code: 'COM SCI 32', color: 'orange' },
        { code: 'COM SCI 32', color: 'green' },
        { code: 'COM SCI 32', color: 'green' },
        { code: 'COM SCI 32', color: 'green' },
        { code: 'COM SCI 32', color: 'purple' }
      ]
    },
    {
      id: 5,
      title: 'Fall 2025 Schedule',
      type: 'quarter',
      period: 'Fall 2025 Quarter',
      units: 16,
      courses: [
        { code: 'COM SCI 32', color: 'green' },
        { code: 'COM SCI 32', color: 'green' },
        { code: 'COM SCI 32', color: 'orange' },
        { code: 'COM SCI 32', color: 'green' },
        { code: 'COM SCI 32', color: 'orange' },
        { code: 'COM SCI 32', color: 'green' },
        { code: 'COM SCI 32', color: 'purple' }
      ]
    }
  ];

  const availableCourses = [
    { code: 'COM SCI 32', title: 'Introduction to Computer Science II', units: 4, color: 'orange', warning: false },
    { code: 'COM SCI 32', title: 'Introduction to Computer Science II', units: 4, color: 'green', warning: true },
    { code: 'COM SCI 32', title: 'Introduction to Computer Science II', units: 4, color: 'orange', warning: false },
    { code: 'PSYCH 120A', title: 'Introduction to Computer Science II', units: 4, color: 'green', warning: false },
    { code: 'COM SCI 32', title: 'Introduction to Computer Science II', units: 4, color: 'purple', warning: false },
    { code: 'COM SCI 32', title: 'Introduction to Computer Science II', units: 4, color: 'purple', warning: false },
    { code: 'COM SCI 32', title: 'Introduction to Computer Science II', units: 4, color: 'green', warning: false }
  ];

  const handleCreateNew = () => {
    setSelectedPlan({ id: 'new', title: 'Schedule 1' });
    setView('editor');
  };

  const handleOpenPlan = (plan) => {
    setSelectedPlan(plan);
    setView('editor');
  };

  const handleSavePlan = () => {
    setView('all-plans');
    setSelectedPlan(null);
  };

  const handleBackToAll = () => {
    setView('all-plans');
    setSelectedPlan(null);
  };

  const toggleYear = (year) => {
    setExpandedYears(prev => ({
      ...prev,
      [year]: !prev[year]
    }));
  };

  if (view === 'all-plans') {
    return (
      <div className="plan-page">
        <NavBar />
        <div className="plan-container">
          <button className="create-new-btn" onClick={handleCreateNew}>
            + Create New Plan
          </button>

          <div className="plans-grid">
            {samplePlans.map(plan => (
              <div key={plan.id} className="plan-card" onClick={() => handleOpenPlan(plan)}>
                <div className="plan-card-header">
                  <h3>{plan.title}</h3>
                  <button className="delete-btn" onClick={(e) => { e.stopPropagation(); }}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M3 5h14M8 5V3h4v2m-5 0v9m4-9v9M6 5v11a1 1 0 001 1h6a1 1 0 001-1V5" stroke="#999" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
                <div className="plan-card-meta">
                  {plan.period} | {plan.units} Units
                </div>
                <div className="plan-card-courses">
                  {plan.courses.map((course, idx) => (
                    <div key={idx} className={`course-mini color-${course.color}`}>
                      {course.code}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Editor View
  return (
    <div className="plan-page">
      <NavBar />
      <div className="plan-editor-container">
        <aside className="plan-sidebar">
          <div className="sidebar-section">
            <h3>Course Search</h3>
            <div className="search-input">
              <input
                type="text"
                placeholder="Search courses"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="9" cy="9" r="6" stroke="#999" strokeWidth="2"/>
                <path d="M14 14L17 17" stroke="#999" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
          </div>

          <div className="sidebar-section">
            <h3>Major/Minor</h3>
            <div className="major-tag">
              <span>Computer Science (COM SCI)</span>
              <button className="remove-tag">×</button>
            </div>
            <select className="major-select">
              <option>Select Major or Minor</option>
            </select>
          </div>

          <div className="sidebar-section">
            <h3>Major/Minor</h3>
            <label className="radio-label">
              <input type="radio" name="course-filter" />
              <span>Bookmarked Courses</span>
            </label>
            <label className="radio-label">
              <input type="radio" name="course-filter" />
              <span>Ready to take (Prerequisite Met)</span>
            </label>
          </div>

          <button className="show-details-btn">
            Show all Course Details
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 6L8 10L12 6" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <div className="courses-list-sidebar">
            {availableCourses.map((course, idx) => (
              <div key={idx} className={`course-card-sidebar color-${course.color}`} draggable="true">
                <div className="course-header">
                  <span className="course-code">{course.code}</span>
                  {course.warning && (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M8 1l7 14H1L8 1z" fill="#ff9800"/>
                      <path d="M8 6v4M8 11v1" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  )}
                </div>
                <div className="course-title">{course.title}</div>
                <div className="course-units">{course.units} units</div>
              </div>
            ))}
          </div>
        </aside>

        <main className="plan-main">
          <div className="plan-header">
            <button className="back-btn" onClick={handleBackToAll}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M12 4L6 10l6 6" stroke="#247ad6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              All Saved Plans
            </button>
            <div className="plan-actions">
              <button className="download-btn">
                Download
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 1v10M4 8l4 4 4-4M2 15h12" stroke="#247ad6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button className="save-btn" onClick={handleSavePlan}>Save Plan</button>
            </div>
          </div>

          <div className="plan-title-section">
            <h1>Schedule 1</h1>
            <button className="edit-title-btn">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M14 2l4 4L6 18H2v-4L14 2z" stroke="#247ad6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

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

          <div className="schedule-section">
            <div className="year-section">
              <div className="year-header" onClick={() => toggleYear('year1')}>
                <h2>Year 1</h2>
                <div className="year-controls">
                  <button className="collapse-btn">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="10" r="8" stroke="#247ad6" strokeWidth="1.5"/>
                      <path d="M7 10h6" stroke="#247ad6" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                  <button className="expand-btn">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="10" r="8" stroke="#247ad6" strokeWidth="1.5"/>
                      <path d="M7 10h6M10 7v6" stroke="#247ad6" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              </div>

              {expandedYears.year1 && (
                <div className="quarters-grid">
                  <div className="quarter-column">
                    <h3>Fall</h3>
                    <div className="quarter-courses">
                      <div className="course-slot color-orange" draggable="true">
                        <div className="course-name">LIFESCI 15</div>
                        <div className="course-units">4 units</div>
                      </div>
                      <div className="course-slot color-green" draggable="true">
                        <div className="course-name">COM SCI 31</div>
                        <div className="course-units">4 units</div>
                      </div>
                    </div>
                  </div>

                  <div className="quarter-column">
                    <h3>Winter</h3>
                    <div className="quarter-courses">
                      <div className="course-slot color-orange" draggable="true">
                        <div className="course-name">PSYCH 10</div>
                        <div className="course-units">4 units</div>
                      </div>
                      <div className="course-slot color-green" draggable="true">
                        <div className="course-name">COM SCI 32</div>
                        <div className="course-units">4 units</div>
                      </div>
                      <div className="course-slot color-green warning" draggable="true">
                        <div className="course-name">PSYCH 135</div>
                        <div className="course-units">4 units</div>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M8 1l7 14H1L8 1z" fill="#ff9800"/>
                          <text x="8" y="11" textAnchor="middle" fill="white" fontSize="10">!</text>
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="quarter-column">
                    <h3>Spring</h3>
                    <div className="quarter-courses">
                      <div className="course-slot color-orange" draggable="true">
                        <div className="course-name">HIST 10B</div>
                        <div className="course-units">4 units</div>
                      </div>
                      <div className="course-slot color-green" draggable="true">
                        <div className="course-name">LING 1</div>
                        <div className="course-units">4 units</div>
                      </div>
                      <div className="course-slot color-green" draggable="true">
                        <div className="course-name">STATS 10</div>
                        <div className="course-units">4 units</div>
                      </div>
                    </div>
                  </div>

                  <div className="quarter-column">
                    <h3>Summer A</h3>
                    <div className="quarter-courses">
                      <div className="course-slot color-orange" draggable="true">
                        <div className="course-name">COMPTNG 10A</div>
                        <div className="course-units">4 units</div>
                      </div>
                    </div>
                  </div>

                  <div className="quarter-column">
                    <h3>Summer C</h3>
                    <div className="quarter-courses"></div>
                  </div>
                </div>
              )}
            </div>

            <div className="year-section">
              <div className="year-header" onClick={() => toggleYear('year2')}>
                <h2>Year 2</h2>
                <div className="year-controls">
                  <button className="collapse-btn">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="10" r="8" stroke="#247ad6" strokeWidth="1.5"/>
                      <path d="M7 10h6" stroke="#247ad6" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                  <button className="expand-btn">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="10" r="8" stroke="#247ad6" strokeWidth="1.5"/>
                      <path d="M7 10h6M10 7v6" stroke="#247ad6" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              </div>

              {expandedYears.year2 && (
                <div className="quarters-grid">
                  <div className="quarter-column">
                    <h3>Fall</h3>
                    <div className="quarter-courses">
                      <div className="course-slot color-orange" draggable="true">
                        <div className="course-name">THEATER 10</div>
                        <div className="course-units">4 units</div>
                      </div>
                      <div className="course-slot color-green" draggable="true">
                        <div className="course-name">COMPTNG 10B</div>
                        <div className="course-units">4 units</div>
                      </div>
                    </div>
                  </div>

                  <div className="quarter-column">
                    <h3>Winter</h3>
                    <div className="quarter-courses">
                      <div className="course-slot color-orange" draggable="true">
                        <div className="course-name">EPS SCI 1</div>
                        <div className="course-units">4 units</div>
                      </div>
                      <div className="course-slot color-green" draggable="true">
                        <div className="course-name">MATH 31A</div>
                        <div className="course-units">4 units</div>
                      </div>
                      <div className="course-slot color-purple" draggable="true">
                        <div className="course-name">PSYCH 100A</div>
                        <div className="course-units">4 units</div>
                      </div>
                    </div>
                  </div>

                  <div className="quarter-column">
                    <h3>Spring</h3>
                    <div className="quarter-courses">
                      <div className="course-slot color-orange" draggable="true">
                        <div className="course-name">SPAN 2</div>
                        <div className="course-units">4 units</div>
                      </div>
                      <div className="course-slot color-green" draggable="true">
                        <div className="course-name">MATH 31B</div>
                        <div className="course-units">4 units</div>
                      </div>
                      <div className="course-slot color-purple" draggable="true">
                        <div className="course-name">PSYCH 100B</div>
                        <div className="course-units">4 units</div>
                      </div>
                    </div>
                  </div>

                  <div className="quarter-column">
                    <h3>Summer A</h3>
                    <div className="quarter-courses"></div>
                  </div>

                  <div className="quarter-column">
                    <h3>Summer C</h3>
                    <div className="quarter-courses">
                      <div className="course-slot color-green" draggable="true">
                        <div className="course-name">PSYCH 85</div>
                        <div className="course-units">4 units</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Plan;
