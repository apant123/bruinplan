import React, { useEffect, useMemo, useRef, useState } from 'react';
import NavBar from '../components/NavBar';
import './Plan.css';
import { useAuth } from '../contexts/AuthContext';

const TERMS = ['FALL', 'WINTER', 'SPRING', 'SUMMER_A', 'SUMMER_C'];
const TERM_LABELS = { FALL: 'Fall', WINTER: 'Winter', SPRING: 'Spring', SUMMER_A: 'Summer A', SUMMER_C: 'Summer C' };
const YEAR_COUNT = 4;

function Plan() {
  const [view, setView] = useState('all-plans'); // 'all-plans' or 'editor'
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [majorFilter, setMajorFilter] = useState('Computer Science (COM SCI)');
  const [expandedYears, setExpandedYears] = useState(
    Object.fromEntries(Array.from({ length: YEAR_COUNT }, (_, i) => [`year${i + 1}`, true]))
  );
  const [planItems, setPlanItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsError, setItemsError] = useState('');
  const [courseCache, setCourseCache] = useState({});
  const [dragOverTarget, setDragOverTarget] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [subjectsError, setSubjectsError] = useState('');
  const [subjectQuery, setSubjectQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState({
    id: 230,
    code: 'COM SCI',
    name: 'Computer Science',
  });
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [coursesError, setCoursesError] = useState('');


  const [subjectDropdownOpen, setSubjectDropdownOpen] = useState(false);
  const subjectBoxRef = useRef(null);
  const { user, isAuthenticated } = useAuth();
  console.log("PLAN AUTH:", { isAuthenticated, user });

  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansError, setPlansError] = useState('');

  const [createPlanLoading, setCreatePlanLoading] = useState(false);
  const [createPlanError, setCreatePlanError] = useState('');

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
        // Optional: sort by code then name for nicer UX
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

    return () => {
      cancelled = true;
    };
  }, []);


  useEffect(() => {
    if (!selectedSubject?.id) {
      setCourses([]);
      return;
    }

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

    return () => {
      cancelled = true;
    };
  }, [selectedSubject?.id]);


  useEffect(() => {
    function onDocMouseDown(e) {
      if (!subjectBoxRef.current) return;
      if (!subjectBoxRef.current.contains(e.target)) {
        setSubjectDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, []);

  const filteredSubjects = useMemo(() => {
    const q = subjectQuery.trim().toLowerCase();
    if (!q) return subjects.slice(0, 50); // don’t dump 200+ items by default

    return subjects
      .filter((s) => {
        const code = (s.code || '').toLowerCase();
        const name = (s.name || '').toLowerCase();
        return code.includes(q) || name.includes(q);
      })
      .slice(0, 50);
  }, [subjects, subjectQuery]);

  const courseLabel = (c) => `${selectedSubject?.code ?? ''} ${c?.number ?? ''}`.trim();

    const planCourseIds = useMemo(() => new Set(planItems.map(it => it.course_id)), [planItems]);

    const filteredCourses = useMemo(() => {
      const q = searchQuery.trim().toLowerCase();
      const base = courses.filter(c => !planCourseIds.has(c.id));
      if (!q) return base.slice(0, 60);

      return base
        .filter((c) => {
          const label = courseLabel(c).toLowerCase();
          const title = (c.title || '').toLowerCase();
          const desc = (c.description || '').toLowerCase();
          return label.includes(q) || title.includes(q) || desc.includes(q);
        })
        .slice(0, 60);
    }, [courses, searchQuery, selectedSubject?.code, planCourseIds]);



  const loadPlans = async () => {
    const userId = user?.id;
    if (!userId) return;

    setPlansLoading(true);
    setPlansError('');
    try {
      const res = await fetch('http://localhost:8000/api/plans/', {
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPlans(Array.isArray(data?.plans) ? data.plans : []);
    } catch (e) {
      setPlansError('Failed to load plans.');
    } finally {
      setPlansLoading(false);
    }
  };

  useEffect(() => {
    if (view === 'all-plans' && user?.id) {
      loadPlans();
    }
  }, [view, user?.id]);

  const loadPlanItems = async (planId) => {
    const userId = user?.id;
    if (!userId || !planId) return;

    setItemsLoading(true);
    setItemsError('');
    try {
      const res = await fetch(`http://localhost:8000/api/plans/${planId}/items/`, {
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const items = Array.isArray(data?.items) ? data.items : [];

      // Fetch course details before rendering items so names don't flash
      const missingIds = [...new Set(items.map(it => it.course_id))].filter(id => !courseCache[id]);
      if (missingIds.length > 0) {
        try {
          const cRes = await fetch(`http://localhost:8000/api/courses/by-ids/?ids=${missingIds.join(',')}`);
          if (cRes.ok) {
            const cData = await cRes.json();
            const newCache = {};
            for (const c of (cData?.courses || [])) {
              newCache[c.id] = { subjectCode: c.subject_code, number: c.number, title: c.title, units: c.units };
            }
            setCourseCache(prev => ({ ...prev, ...newCache }));
          }
        } catch (e) {
          console.error('Failed to fetch course details:', e);
        }
      }

      setPlanItems(items);
    } catch (e) {
      setItemsError('Failed to load plan items.');
    } finally {
      setItemsLoading(false);
    }
  };

  const itemsByYearTerm = useMemo(() => {
    const grid = {};
    for (let y = 1; y <= YEAR_COUNT; y++) {
      grid[y] = {};
      for (const t of TERMS) {
        grid[y][t] = [];
      }
    }
    for (const item of planItems) {
      if (grid[item.year_index] && grid[item.year_index][item.term]) {
        grid[item.year_index][item.term].push(item);
      }
    }
    for (let y = 1; y <= YEAR_COUNT; y++) {
      for (const t of TERMS) {
        grid[y][t].sort((a, b) => a.position - b.position);
      }
    }
    return grid;
  }, [planItems]);

  const handleDrop = async (e, yearNum, term) => {
    e.preventDefault();
    setDragOverTarget(null);

    const raw = e.dataTransfer.getData('application/json');
    if (!raw) return;

    let courseData;
    try {
      courseData = JSON.parse(raw);
    } catch { return; }

    // Move existing item to new year/term
    if (courseData._planItemId) {
      const itemId = courseData._planItemId;
      if (courseData.year_index === yearNum && courseData.term === term) return;

      const userId = user?.id;
      if (!userId || !selectedPlan?.id) return;

      const existingItems = itemsByYearTerm[yearNum]?.[term] || [];
      const position = existingItems.length;

      try {
        const res = await fetch(
          `http://localhost:8000/api/plans/${selectedPlan.id}/items/${itemId}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
            body: JSON.stringify({ year_index: yearNum, term: term, position: position }),
          }
        );

        if (!res.ok) {
          console.error('Failed to move plan item:', await res.text().catch(() => ''));
          return;
        }

        setPlanItems(prev =>
          prev.map(it => (it.id === itemId ? { ...it, year_index: yearNum, term: term, position: position } : it))
        );
      } catch (err) {
        console.error('Move failed:', err);
      }
      return;
    }

    // New course from sidebar
    const courseId = courseData.id;
    if (!courseId || !selectedPlan?.id) return;

    const userId = user?.id;
    if (!userId) return;

    const existingItems = itemsByYearTerm[yearNum]?.[term] || [];
    const position = existingItems.length;

    try {
      const res = await fetch(`http://localhost:8000/api/plans/${selectedPlan.id}/items/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
        body: JSON.stringify({
          year_index: yearNum,
          term: term,
          course_id: courseId,
          status: 'planned',
          position: position,
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        console.error('Failed to create plan item:', errText);
        return;
      }

      const created = await res.json();
      setPlanItems(prev => [...prev, created]);

      setCourseCache(prev => ({
        ...prev,
        [courseId]: {
          ...courseData,
          subjectCode: courseData.subjectCode || selectedSubject?.code || '',
        },
      }));
    } catch (err) {
      console.error('Drop failed:', err);
    }
  };

  const handleDeleteItem = async (itemId) => {
    const userId = user?.id;
    if (!userId || !selectedPlan?.id) return;

    try {
      const res = await fetch(
        `http://localhost:8000/api/plans/${selectedPlan.id}/items/${itemId}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
        }
      );

      if (res.status === 204 || res.ok) {
        setPlanItems(prev => prev.filter(it => it.id !== itemId));
      } else {
        console.error('Delete failed:', res.status);
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleCreateNew = async () => {
    if (createPlanLoading) return;

    const userId = user?.id;
    if (!userId) {
      setCreatePlanError('Missing user id. Please log in again.');
      return;
    }

    setCreatePlanLoading(true);
    setCreatePlanError('');

    try {
      const payload = {
        name: 'Schedule 1',
        start_year: new Date().getFullYear(), // or 2026 if you want fixed
      };

      const res = await fetch('http://localhost:8000/api/plans/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status} ${text}`);
      }

      const data = await res.json();
      const createdPlan = data?.plan ?? data;

      setPlans(prev => [createdPlan, ...prev]);
      setSelectedPlan(createdPlan);
      setPlanItems([]);
      setView('editor');
    } catch (err) {
      console.error(err);
      setCreatePlanError('Failed to create plan.');
    } finally {
      setCreatePlanLoading(false);
    }
  };


  const handleOpenPlan = (plan) => {
    setSelectedPlan(plan);
    setPlanItems([]);
    setView('editor');
    loadPlanItems(plan.id);
  };

  const handleSavePlan = () => {
    setView('all-plans');
    setSelectedPlan(null);
  };

  const handleBackToAll = () => {
    setView('all-plans');
    setSelectedPlan(null);
    setPlanItems([]);
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
          <button className="create-new-btn" onClick={handleCreateNew} disabled={createPlanLoading}>
            {createPlanLoading ? 'Creating…' : '+ Create New Plan'}
          </button>
          {createPlanError && <div className="sidebar-hint error">{createPlanError}</div>}

          <div className="plans-grid">
            {plansLoading && <div className="sidebar-hint">Loading plans...</div>}
            {plansError && <div className="sidebar-hint error">{plansError}</div>}
            {!plansLoading && !plansError && plans.length === 0 && (
              <div className="sidebar-hint">No plans yet. Create one to get started!</div>
            )}
            {plans.map(plan => (
              <div key={plan.id} className="plan-card" onClick={() => handleOpenPlan(plan)}>
                <div className="plan-card-header">
                  <h3>{plan.name}</h3>
                  <button className="delete-btn" onClick={(e) => { e.stopPropagation(); }}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M3 5h14M8 5V3h4v2m-5 0v9m4-9v9M6 5v11a1 1 0 001 1h6a1 1 0 001-1V5" stroke="#999" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
                <div className="plan-card-meta">
                  {plan.start_year ? `Starting ${plan.start_year}` : ''} | Created {new Date(plan.created_at).toLocaleDateString()}
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
                  onClick={() => {
                    setSelectedSubject(null);
                    setSubjectQuery('');
                  }}
                  aria-label="Clear subject"
                >
                  ×
                </button>
              </div>
            )}

            <div className="subject-search">
              <input
                type="text"
                className="major-select" // reuse your existing styling if you want
                placeholder={subjectsLoading ? 'Loading subjects…' : 'Search subject (code or name)'}
                value={subjectQuery}
                onChange={(e) => {
                  setSubjectQuery(e.target.value);
                  setSubjectDropdownOpen(true);
                }}
                onFocus={() => setSubjectDropdownOpen(true)}
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
                          setSelectedSubject({ id: s.id, code: s.code, name: s.name });
                          setSubjectQuery(`${s.code}`); // or '' if you want it to clear after select
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
            <h1>{selectedPlan?.name || 'Untitled Plan'}</h1>
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
            {itemsLoading && <div className="sidebar-hint">Loading plan items...</div>}
            {itemsError && <div className="sidebar-hint error">{itemsError}</div>}

            {Array.from({ length: YEAR_COUNT }, (_, i) => i + 1).map(yearNum => (
              <div key={yearNum} className="year-section">
                <div className="year-header" onClick={() => toggleYear(`year${yearNum}`)}>
                  <h2>Year {yearNum}</h2>
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

                {expandedYears[`year${yearNum}`] && (
                  <div className="quarters-grid">
                    {TERMS.map(term => (
                      <div key={term} className="quarter-column">
                        <h3>{TERM_LABELS[term]}</h3>
                        <div
                          className={`quarter-courses${dragOverTarget?.year === yearNum && dragOverTarget?.term === term ? ' drag-over' : ''}`}
                          onDragOver={(e) => {
                            e.preventDefault();
                            setDragOverTarget({ year: yearNum, term });
                          }}
                          onDragLeave={() => setDragOverTarget(null)}
                          onDrop={(e) => handleDrop(e, yearNum, term)}
                        >
                          {(itemsByYearTerm[yearNum]?.[term] || []).map(item => {
                            const cached = courseCache[item.course_id];
                            return (
                              <div
                                key={item.id}
                                className="course-slot color-green"
                                draggable="true"
                                onDragStart={(e) => {
                                  const dragData = {
                                    _planItemId: item.id,
                                    id: item.course_id,
                                    year_index: item.year_index,
                                    term: item.term,
                                    ...(cached || {}),
                                  };
                                  e.dataTransfer.setData('application/json', JSON.stringify(dragData));
                                  e.dataTransfer.effectAllowed = 'move';
                                }}
                              >
                                <div className="course-name">
                                  {cached ? `${cached.subjectCode || ''} ${cached.number || ''}`.trim() : `Course #${item.course_id}`}
                                </div>
                                <div className="course-units">
                                  {cached ? `${cached.units} units` : ''}
                                </div>
                                <button
                                  className="delete-item-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteItem(item.id);
                                  }}
                                  title="Remove from plan"
                                >
                                  &times;
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
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

export default Plan;
