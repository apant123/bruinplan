import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import NavBar from '../components/NavBar';
import './Plan.css';
import { useAuth } from '../contexts/AuthContext';
import PlansList from '../components/Plan/PlansList';
import CourseSidebar from '../components/Plan/CourseSidebar';
import ScheduleGrid from '../components/Plan/ScheduleGrid';
import DegreeProgress from '../components/Plan/DegreeProgress';

const TERMS = ['FALL', 'WINTER', 'SPRING', 'SUMMER_A', 'SUMMER_C'];
const YEAR_COUNT = 4;

function Plan() {
  const [view, setView] = useState('all-plans');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
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
  const { user } = useAuth();
  const location = useLocation();
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState('');

  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansError, setPlansError] = useState('');
  const [createPlanLoading, setCreatePlanLoading] = useState(false);
  const [createPlanError, setCreatePlanError] = useState('');

  // --- Data loading effects ---

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

  // Reset to plans list when navbar "Plan" link is clicked
  useEffect(() => {
    if (location.state?.resetKey) {
      setView('all-plans');
      setSelectedPlan(null);
      setPlanItems([]);
      setIsEditingName(false);
    }
  }, [location.state?.resetKey]);

  // --- Computed values ---

  const filteredSubjects = useMemo(() => {
    const q = subjectQuery.trim().toLowerCase();
    if (!q) return subjects.slice(0, 50);
    return subjects
      .filter((s) => (s.code || '').toLowerCase().includes(q) || (s.name || '').toLowerCase().includes(q))
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

  const itemsByYearTerm = useMemo(() => {
    const grid = {};
    for (let y = 1; y <= YEAR_COUNT; y++) {
      grid[y] = {};
      for (const t of TERMS) grid[y][t] = [];
    }
    for (const item of planItems) {
      if (grid[item.year_index]?.[item.term]) grid[item.year_index][item.term].push(item);
    }
    for (let y = 1; y <= YEAR_COUNT; y++) {
      for (const t of TERMS) grid[y][t].sort((a, b) => a.position - b.position);
    }
    return grid;
  }, [planItems]);

  // --- API functions ---

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
    if (view === 'all-plans' && user?.id) loadPlans();
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

  const handleDrop = async (e, yearNum, term) => {
    e.preventDefault();
    setDragOverTarget(null);

    const raw = e.dataTransfer.getData('application/json');
    if (!raw) return;

    let courseData;
    try { courseData = JSON.parse(raw); } catch { return; }

    const userId = user?.id;
    const planId = selectedPlan?.id;
    if (!userId || !planId) return;

    // --- MOVE EXISTING PLAN ITEM ---
    if (courseData._planItemId) {
      const itemId = courseData._planItemId;

      // If dropped into same bucket, do nothing.
      if (courseData.year_index === yearNum && courseData.term === term) return;

      const existingItems = itemsByYearTerm[yearNum]?.[term] || [];
      const position = existingItems.length;

      // Snapshot for rollback
      const prevItems = planItems;

      // Optimistic UI update: move immediately
      setPlanItems(prev =>
        prev.map(it => (it.id === itemId ? { ...it, year_index: yearNum, term, position } : it))
      );

      try {
        const res = await fetch(
          `http://localhost:8000/api/plans/${planId}/items/${itemId}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
            body: JSON.stringify({ year_index: yearNum, term, position }),
          }
        );

        if (!res.ok) {
          const txt = await res.text().catch(() => '');
          throw new Error(`HTTP ${res.status} ${txt}`);
        }

        // Optional: if backend returns canonical item, you can merge it here.
        // const updated = await res.json();
        // setPlanItems(prev => prev.map(it => (it.id === itemId ? updated : it)));
      } catch (err) {
        console.error('Move failed:', err);
        // Rollback
        setPlanItems(prevItems);
      }
      return;
    }

    // --- ADD NEW COURSE AS PLAN ITEM ---
    const courseId = courseData?.id;
    if (!courseId) return;

    // Optional guard: avoid duplicates (you already compute planCourseIds)
    if (planCourseIds.has(courseId)) return;

    const existingItems = itemsByYearTerm[yearNum]?.[term] || [];
    const position = existingItems.length;

    // Create an optimistic temp item
    const tempId = `temp-${Date.now()}-${courseId}`;
    const optimisticItem = {
      id: tempId,
      plan_id: planId,
      year_index: yearNum,
      term,
      course_id: courseId,
      status: 'planned',
      position,
      notes: null,
      created_at: new Date().toISOString(),
      _optimistic: true,
    };

    // Optimistically add to UI right away
    setPlanItems(prev => [...prev, optimisticItem]);

    // (Optional) cache for label rendering (do it now so UI has text immediately)
    setCourseCache(prev => ({
      ...prev,
      [courseId]: {
        ...prev[courseId],
        ...courseData,
        subjectCode: courseData.subjectCode || selectedSubject?.code || '',
      },
    }));

    try {
      const res = await fetch(`http://localhost:8000/api/plans/${planId}/items/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
        body: JSON.stringify({
          year_index: yearNum,
          term,
          course_id: courseId,
          status: 'planned',
          position,
        }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status} ${txt}`);
      }

      const created = await res.json();

      // Replace temp item with created item from server
      setPlanItems(prev => prev.map(it => (it.id === tempId ? created : it)));
    } catch (err) {
      console.error('Drop failed:', err);

      // Remove optimistic item
      setPlanItems(prev => prev.filter(it => it.id !== tempId));

      // (Optional) also remove cache entry if you only created it for this drop
      // setCourseCache(prev => {
      //   const copy = { ...prev };
      //   delete copy[courseId];
      //   return copy;
      // });
    }
  };

  const handleDeleteItem = async (itemId) => {
    const userId = user?.id;
    const planId = selectedPlan?.id;
    if (!userId || !planId || !itemId) return;

    // Snapshot for rollback
    let removedItem = null;

    // Optimistic UI: remove immediately
    setPlanItems((prev) => {
      removedItem = prev.find((it) => it.id === itemId) || null;
      return prev.filter((it) => it.id !== itemId);
    });

    try {
      const res = await fetch(
        `http://localhost:8000/api/plans/${planId}/items/${itemId}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
        }
      );

      // Treat 204 as success; res.ok also covers it.
      if (!(res.status === 204 || res.ok)) {
        const txt = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status} ${txt}`);
      }
    } catch (err) {
      console.error('Delete failed:', err);

      // Rollback: re-insert the item if we removed it
      if (removedItem) {
        setPlanItems((prev) => {
          // Avoid duplicates if something else re-added it
          if (prev.some((it) => it.id === removedItem.id)) return prev;
          return [...prev, removedItem];
        });
      }
    }
  };

  const handleCreateNew = async () => {
    if (createPlanLoading) return;
    const userId = user?.id;
    if (!userId) { setCreatePlanError('Missing user id. Please log in again.'); return; }
    setCreatePlanLoading(true);
    setCreatePlanError('');
    try {
      const res = await fetch('http://localhost:8000/api/plans/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
        body: JSON.stringify({ name: 'Schedule 1', start_year: new Date().getFullYear() }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${await res.text().catch(() => '')}`);
      const data = await res.json();
      const createdPlan = data?.plan ?? data;
      setPlans(prev => [createdPlan, ...prev]);
      setSelectedPlan(createdPlan);
      setPlanItems([]);
      setView('editor');
    } catch (err) { console.error(err); setCreatePlanError('Failed to create plan.'); }
    finally { setCreatePlanLoading(false); }
  };

  // --- Navigation handlers ---

  const handleOpenPlan = (plan) => {
    setSelectedPlan(plan);
    setPlanItems([]);
    setView('editor');
    loadPlanItems(plan.id);
  };

  const handleBackToAll = () => {
    setView('all-plans');
    setSelectedPlan(null);
    setPlanItems([]);
  };

  const toggleYear = (year) => {
    setExpandedYears(prev => ({ ...prev, [year]: !prev[year] }));
  };

  // --- Render ---

  if (view === 'all-plans') {
    return (
      <div className="plan-page">
        <NavBar />
        <PlansList
          plans={plans}
          plansLoading={plansLoading}
          plansError={plansError}
          createPlanLoading={createPlanLoading}
          createPlanError={createPlanError}
          onCreateNew={handleCreateNew}
          onOpenPlan={handleOpenPlan}
        />
      </div>
    );
  }

  return (
    <div className="plan-page">
      <NavBar />
      <div className="plan-editor-container">
        <CourseSidebar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedSubject={selectedSubject}
          onSelectSubject={setSelectedSubject}
          onClearSubject={() => { setSelectedSubject(null); setSubjectQuery(''); }}
          subjectQuery={subjectQuery}
          onSubjectQueryChange={setSubjectQuery}
          subjectsLoading={subjectsLoading}
          subjectsError={subjectsError}
          filteredSubjects={filteredSubjects}
          subjectDropdownOpen={subjectDropdownOpen}
          onSubjectDropdownOpen={setSubjectDropdownOpen}
          subjectBoxRef={subjectBoxRef}
          coursesLoading={coursesLoading}
          coursesError={coursesError}
          filteredCourses={filteredCourses}
          courseLabel={courseLabel}
        />

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
              <button className="save-btn" onClick={handleBackToAll}>Save Plan</button>
            </div>
          </div>

          <div className="plan-title-section">
            {isEditingName ? (
              <input
                className="plan-title-input"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                autoFocus
                onKeyDown={async (e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const trimmed = editingName.trim();
                    if (!trimmed || trimmed === selectedPlan?.name) {
                      setIsEditingName(false);
                      return;
                    }
                    try {
                      const res = await fetch(`http://localhost:8000/api/plans/${selectedPlan.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', 'X-User-Id': user?.id },
                        body: JSON.stringify({ name: trimmed }),
                      });
                      if (!res.ok) throw new Error(`HTTP ${res.status}`);
                      setSelectedPlan(prev => ({ ...prev, name: trimmed }));
                      setPlans(prev => prev.map(p => p.id === selectedPlan.id ? { ...p, name: trimmed } : p));
                    } catch (err) {
                      console.error('Rename failed:', err);
                    }
                    setIsEditingName(false);
                  } else if (e.key === 'Escape') {
                    setIsEditingName(false);
                  }
                }}
                onBlur={async () => {
                  const trimmed = editingName.trim();
                  if (!trimmed || trimmed === selectedPlan?.name) {
                    setIsEditingName(false);
                    return;
                  }
                  try {
                    const res = await fetch(`http://localhost:8000/api/plans/${selectedPlan.id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json', 'X-User-Id': user?.id },
                      body: JSON.stringify({ name: trimmed }),
                    });
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    setSelectedPlan(prev => ({ ...prev, name: trimmed }));
                    setPlans(prev => prev.map(p => p.id === selectedPlan.id ? { ...p, name: trimmed } : p));
                  } catch (err) {
                    console.error('Rename failed:', err);
                  }
                  setIsEditingName(false);
                }}
              />
            ) : (
              <h1>{selectedPlan?.name || 'Untitled Plan'}</h1>
            )}
            <button className="edit-title-btn" onClick={() => {
              setEditingName(selectedPlan?.name || '');
              setIsEditingName(true);
            }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M14 2l4 4L6 18H2v-4L14 2z" stroke="#247ad6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          <DegreeProgress />

          <ScheduleGrid
            itemsByYearTerm={itemsByYearTerm}
            courseCache={courseCache}
            expandedYears={expandedYears}
            onToggleYear={toggleYear}
            dragOverTarget={dragOverTarget}
            onSetDragOverTarget={setDragOverTarget}
            onDrop={handleDrop}
            onDeleteItem={handleDeleteItem}
            itemsLoading={itemsLoading}
            itemsError={itemsError}
          />
        </main>
      </div>
    </div>
  );
}

export default Plan;
