import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import NavBar from '../components/NavBar';
import './ExploreCourses.css';

function ExploreCourses() {
  const { user } = useAuth();
  const [bookmarkedCourseIds, setBookmarkedCourseIds] = useState(new Set());
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false);
  const [courseCache, setCourseCache] = useState({});

  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [subjectsError, setSubjectsError] = useState('');
  const [subjectQuery, setSubjectQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [subjectDropdownOpen, setSubjectDropdownOpen] = useState(false);
  const subjectBoxRef = useRef(null);

  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [coursesError, setCoursesError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [expandedCourses, setExpandedCourses] = useState({});
  const [activeTab, setActiveTab] = useState({});

  const [filters, setFilters] = useState({
    term: '',
    units: 1,
    meetingDays: [],
    startTime: '',
    endTime: '',
    level: ''
  });

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  useEffect(() => {
    let cancelled = false;
    async function loadSubjects() {
      setSubjectsLoading(true);
      setSubjectsError('');
      try {
        const res = await fetch('http://127.0.0.1:8000/api/subjects', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const list = Array.isArray(data?.subjects) ? data.subjects : [];
        list.sort((a, b) => {
          const c = (a.code || '').localeCompare(b.code || '');
          return c !== 0 ? c : (a.name || '').localeCompare(b.name || '');
        });
        if (!cancelled) setSubjects(list);
      } catch (e) {
        if (!cancelled) setSubjectsError('Failed to load subjects.');
      } finally {
        if (!cancelled) setSubjectsLoading(false);
      }
    }
    loadSubjects();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    async function fetchBookmarks() {
      try {
        const res = await fetch('http://127.0.0.1:8000/api/bookmarks/', {
          headers: { 'X-User-Id': user.id }
        });
        if (res.ok) {
          const data = await res.json();
          const ids = data.bookmarks || [];
          setBookmarkedCourseIds(new Set(ids));
          
          if (ids.length > 0) {
            const missingIds = ids.filter(id => !courseCache[id]);
            if (missingIds.length > 0) {
              const cRes = await fetch(`http://127.0.0.1:8000/api/courses/by-ids/?ids=${missingIds.join(',')}`);
              if (cRes.ok) {
                const cData = await cRes.json();
                const newCache = {};
                for (const c of (cData?.courses || [])) {
                  newCache[c.id] = { 
                    id: c.id,
                    subjectCode: c.subject_code, 
                    number: c.number, 
                    title: c.title, 
                    description: c.description,
                    units: c.units,
                    requisites_text: c.requisites_text,
                    requisites_parsed: c.requisites_parsed
                  };
                }
                setCourseCache(prev => ({ ...prev, ...newCache }));
              }
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch bookmarks', err);
      }
    }
    fetchBookmarks();
  }, [user?.id]);

  const toggleBookmark = async (e, courseId) => {
    e.stopPropagation();
    if (!user?.id) return;
    
    const isBookmarked = bookmarkedCourseIds.has(courseId);
    const method = isBookmarked ? 'DELETE' : 'POST';
    
    // Optimistic update
    setBookmarkedCourseIds(prev => {
      const next = new Set(prev);
      if (isBookmarked) next.delete(courseId);
      else next.add(courseId);
      return next;
    });
    
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/bookmarks/${courseId}/`, {
        method,
        headers: { 'X-User-Id': user.id }
      });
      if (!res.ok) throw new Error('Failed to update bookmark');
      const data = await res.json();
      setBookmarkedCourseIds(new Set(data.bookmarks || []));
    } catch (err) {
      console.error(err);
      // Revert on error
      setBookmarkedCourseIds(prev => {
        const next = new Set(prev);
        if (isBookmarked) next.add(courseId);
        else next.delete(courseId);
        return next;
      });
    }
  };

  useEffect(() => {
    if (!selectedSubject?.id) { setCourses([]); return; }
    let cancelled = false;
    async function loadCourses() {
      setCoursesLoading(true);
      setCoursesError('');
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/courses/${selectedSubject.id}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const list = Array.isArray(data?.courses) ? data.courses : [];
        if (!cancelled) setCourses(list);
      } catch (e) {
        if (!cancelled) setCoursesError('Failed to load courses.');
      } finally {
        if (!cancelled) setCoursesLoading(false);
      }
    }
    loadCourses();
    return () => { cancelled = true; };
  }, [selectedSubject?.id]);

  useEffect(() => {
    function onDocMouseDown(e) {
      if (!subjectBoxRef.current) return;
      if (!subjectBoxRef.current.contains(e.target)) setSubjectDropdownOpen(false);
    }
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, []);

  const filteredSubjects = useMemo(() => {
    const q = subjectQuery.trim().toLowerCase();
    if (!q) return subjects;
    return subjects
      .filter((s) => (s.code || '').toLowerCase().includes(q) || (s.name || '').toLowerCase().includes(q));
  }, [subjects, subjectQuery]);

  const courseLabel = (c) => `${c?.subjectCode || selectedSubject?.code || ''} ${c?.number ?? ''}`.trim();

  const filteredCourses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let base = courses;
    
    if (showBookmarkedOnly) {
        base = [...bookmarkedCourseIds].map(id => courseCache[id]).filter(Boolean);
    }

    if (!q) return base;
    return base
      .filter((c) => {
        const label = courseLabel(c).toLowerCase();
        const title = (c.title || '').toLowerCase();
        const desc = (c.description || '').toLowerCase();
        return label.includes(q) || title.includes(q) || desc.includes(q);
      });
  }, [courses, searchQuery, selectedSubject?.code, showBookmarkedOnly, bookmarkedCourseIds, courseCache]);

  const handleClearFilters = () => {
    setFilters({
      term: '',
      units: 1,
      meetingDays: [],
      startTime: '',
      endTime: '',
      level: ''
    });
  };

  const toggleDay = (day) => {
    setFilters(prev => ({
      ...prev,
      meetingDays: prev.meetingDays.includes(day)
        ? prev.meetingDays.filter(d => d !== day)
        : [...prev.meetingDays, day]
    }));
  };

  const toggleCourseExpand = (courseId) => {
    setExpandedCourses(prev => ({
      ...prev,
      [courseId]: !prev[courseId]
    }));
    if (!activeTab[courseId]) {
      setActiveTab(prev => ({
        ...prev,
        [courseId]: 'details'
      }));
    }
  };

  const setTab = (courseId, tab) => {
    setActiveTab(prev => ({
      ...prev,
      [courseId]: tab
    }));
  };

  return (
    <div className="explore-courses-page">
      <NavBar />
      <div className="explore-container">
        <aside className="filters-sidebar">
          <div className="filters-header">
            <h2>Filters</h2>
            <button className="clear-button" onClick={handleClearFilters}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M12 4L4 12M4 4L12 12" stroke="#247ad6" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Clear
            </button>
          </div>

          <div className="filter-group">
            <label>Term</label>
            <select value={filters.term} onChange={(e) => setFilters({...filters, term: e.target.value})}>
              <option value="">Select term</option>
              <option value="fall2024">Fall 2024</option>
              <option value="winter2025">Winter 2025</option>
              <option value="spring2025">Spring 2025</option>
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

          <div className="filter-group">
            <label>Meeting Time</label>
            <div className="days-grid">
              {days.map(day => (
                <button
                  key={day}
                  className={`day-button ${filters.meetingDays.includes(day) ? 'active' : ''}`}
                  onClick={() => toggleDay(day)}
                >
                  {day}
                </button>
              ))}
            </div>
            <div className="time-selects">
              <select value={filters.startTime} onChange={(e) => setFilters({...filters, startTime: e.target.value})}>
                <option value="">Start time</option>
                <option value="8:00">8:00 AM</option>
                <option value="9:00">9:00 AM</option>
                <option value="10:00">10:00 AM</option>
              </select>
              <select value={filters.endTime} onChange={(e) => setFilters({...filters, endTime: e.target.value})}>
                <option value="">End time</option>
                <option value="10:00">10:00 AM</option>
                <option value="11:00">11:00 AM</option>
                <option value="12:00">12:00 PM</option>
              </select>
            </div>
          </div>

          <div className="filter-group">
            <label>Level</label>
            <select value={filters.level} onChange={(e) => setFilters({...filters, level: e.target.value})}>
              <option value="">Enter class level</option>
              <option value="lower">Lower Division</option>
              <option value="upper">Upper Division</option>
              <option value="grad">Graduate</option>
            </select>
          </div>
        </aside>

        <main className="courses-main">
          <div className="courses-header">
            <div className="search-bar subject-search" ref={subjectBoxRef} style={{ maxWidth: '300px' }}>
              {selectedSubject ? (
                <div className="major-tag" style={{ margin: 0, height: '100%' }}>
                  <span>
                    {selectedSubject.code}
                  </span>
                  <button
                    className="remove-tag"
                    type="button"
                    onClick={() => {
                      setSelectedSubject(null);
                      setSubjectQuery('');
                    }}
                    aria-label="Clear subject"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder={subjectsLoading ? 'Loading subjects…' : 'Search subject'}
                    value={subjectQuery}
                    onChange={(e) => {
                      setSubjectQuery(e.target.value);
                      setSubjectDropdownOpen(true);
                    }}
                    onFocus={() => setSubjectDropdownOpen(true)}
                    disabled={subjectsLoading}
                  />
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
                              setSelectedSubject({ id: s.id, code: s.code, name: s.name });
                              setSubjectQuery(s.code);
                              setSubjectDropdownOpen(false);
                            }}
                          >
                            <div className="subject-code">{s.code}</div>
                            <div className="subject-name">{s.name}</div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="search-bar">
              <input
                type="text"
                placeholder="Search courses by number or title"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={!selectedSubject}
              />
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="9" cy="9" r="6" stroke="#999" strokeWidth="2"/>
                <path d="M14 14L17 17" stroke="#999" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <button 
              className={`bookmarked-button ${showBookmarkedOnly ? 'active' : ''}`}
              onClick={() => setShowBookmarkedOnly(!showBookmarkedOnly)}
              style={showBookmarkedOnly ? { background: '#f0f7ff' } : {}}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill={showBookmarkedOnly ? "#247ad6" : "none"}>
                <path d="M3 2H13C13.55 2 14 2.45 14 3V14L8 11L2 14V3C2 2.45 2.45 2 3 2Z" stroke="#247ad6" strokeWidth="1.5" />
              </svg>
              Bookmarked
            </button>
          </div>

          {!selectedSubject && !showBookmarkedOnly ? (
            <div className="results-count">Please select a subject to view courses.</div>
          ) : (
            <div className="results-count">
              {coursesLoading ? 'Loading courses...' : 
                (showBookmarkedOnly && filteredCourses.length === 0) 
                  ? 'No courses bookmarked.' 
                  : `${filteredCourses.length} Results${showBookmarkedOnly ? ' for Bookmarks' : ` for ${selectedSubject?.code || ''}`}`}
            </div>
          )}

          {coursesError && <div className="results-count" style={{ color: 'red' }}>{coursesError}</div>}

          <div className="courses-list">
            {!coursesLoading && filteredCourses.map(course => (
              <div key={course.id} className="course-card-wrapper">
                <div className="course-card">
                  <div className="course-info" onClick={() => toggleCourseExpand(course.id)}>
                    <div className="course-code">{courseLabel(course)}</div>
                    <div className="course-title">{course.title}</div>
                    <div className="course-units">{course.units} Units</div>
                  </div>
                  <div className="course-actions">
                    <button className="icon-button bookmark-icon" onClick={(e) => toggleBookmark(e, course.id)}>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill={bookmarkedCourseIds.has(course.id) ? "#247ad6" : "none"}>
                        <path d="M4 3H16C16.55 3 17 3.45 17 4V17L10 14L3 17V4C3 3.45 3.45 3 4 3Z" stroke="#247ad6" strokeWidth="1.5" />
                      </svg>
                    </button>
                    <button className="expand-button" onClick={() => toggleCourseExpand(course.id)}>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ transform: expandedCourses[course.id] ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                        <path d="M6 8L10 12L14 8" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </div>

                {expandedCourses[course.id] && (
                  <div className="course-details">
                    <div className="course-tabs">
                      <button
                        className={`tab-button ${(!activeTab[course.id] || activeTab[course.id] === 'details') ? 'active' : ''}`}
                        onClick={() => setTab(course.id, 'details')}
                      >
                        Details
                      </button>
                      <button
                        className={`tab-button ${activeTab[course.id] === 'times' ? 'active' : ''}`}
                        onClick={() => setTab(course.id, 'times')}
                      >
                        Course Times
                      </button>
                    </div>

                    {(!activeTab[course.id] || activeTab[course.id] === 'details') && (
                      <div className="course-details-content">
                        <p>{course.description || 'No description available.'}</p>
                        {course.requisites_text && (
                          <div style={{ marginTop: '12px' }}>
                            <strong>Requisites:</strong>
                            <p>{course.requisites_text}</p>
                          </div>
                        )}
                        <div className="add-to-plan-container">
                           <button className="add-to-plan-button" onClick={() => alert('Add to plan functionality coming soon!')}>
                               + Add to Plan
                           </button>
                        </div>
                      </div>
                    )}
                    
                    {activeTab[course.id] === 'times' && (
                        <div className="course-details-content">
                            <p>Course time information is not yet available for this term.</p>
                        </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

export default ExploreCourses;
