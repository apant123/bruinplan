import React from 'react';

function CourseSidebar({
  searchQuery,
  onSearchChange,
  selectedSubject,
  onSelectSubject,
  onClearSubject,
  subjectQuery,
  onSubjectQueryChange,
  subjectsLoading,
  subjectsError,
  filteredSubjects,
  subjectDropdownOpen,
  onSubjectDropdownOpen,
  subjectBoxRef,
  coursesLoading,
  coursesError,
  filteredCourses,
  courseLabel,
}) {
  return (
    <aside className="plan-sidebar">
      <div className="sidebar-section">
        <h3>Course Search</h3>
        <div className="search-input">
          <input
            type="text"
            placeholder="Search courses"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="9" cy="9" r="6" stroke="#999" strokeWidth="2"/>
            <path d="M14 14L17 17" stroke="#999" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
      </div>

      <div className="sidebar-section" ref={subjectBoxRef}>
        <h3>Subject</h3>

        {selectedSubject && (
          <div className="major-tag">
            <span>
              {selectedSubject.name} ({selectedSubject.code})
            </span>
            <button
              className="remove-tag"
              type="button"
              onClick={onClearSubject}
              aria-label="Clear subject"
            >
              ×
            </button>
          </div>
        )}

        <div className="subject-search">
          <input
            type="text"
            className="major-select"
            placeholder={subjectsLoading ? 'Loading subjects…' : 'Search subject (code or name)'}
            value={subjectQuery}
            onChange={(e) => {
              onSubjectQueryChange(e.target.value);
              onSubjectDropdownOpen(true);
            }}
            onFocus={() => onSubjectDropdownOpen(true)}
            disabled={subjectsLoading}
          />

          {subjectsError && <div className="subject-error">{subjectsError}</div>}

          {subjectDropdownOpen && !subjectsLoading && (
            <div className="subject-dropdown">
              {filteredSubjects.length === 0 ? (
                <div className="subject-empty">No matches</div>
              ) : (
                filteredSubjects.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className="subject-option"
                    onClick={() => {
                      onSelectSubject({ id: s.id, code: s.code, name: s.name });
                      onSubjectQueryChange(s.code);
                      onSubjectDropdownOpen(false);
                    }}
                  >
                    <div className="subject-code">{s.code}</div>
                    <div className="subject-name">{s.name}</div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>


      <div className="sidebar-section">
        <h3>Subject</h3>
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
        {coursesLoading && <div className="sidebar-hint">Loading courses…</div>}
        {coursesError && <div className="sidebar-hint error">{coursesError}</div>}

        {!coursesLoading && !coursesError && filteredCourses.map((c) => (
          <div
            key={c.id}
            className="course-card-sidebar"
            draggable="true"
            onDragStart={(e) => {
              const dragData = { ...c, subjectCode: selectedSubject?.code || '' };
              e.dataTransfer.setData('application/json', JSON.stringify(dragData));
              e.dataTransfer.setData('text/plain', courseLabel(c));
            }}
          >
            <div className="course-header">
              <span className="course-code">{courseLabel(c)}</span>
            </div>
            <div className="course-title">{c.title}</div>
            <div className="course-units">{c.units} units</div>
          </div>
        ))}
      </div>

    </aside>
  );
}

export default CourseSidebar;
