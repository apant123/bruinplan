import React, { useEffect, useMemo, useRef, useState } from 'react';
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
          { method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-User-Id': userId }, body: JSON.stringify({ year_index: yearNum, term, position }) }
        );
        if (!res.ok) { console.error('Failed to move plan item:', await res.text().catch(() => '')); return; }
        setPlanItems(prev => prev.map(it => (it.id === itemId ? { ...it, year_index: yearNum, term, position } : it)));
      } catch (err) { console.error('Move failed:', err); }
      return;
    }

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
        body: JSON.stringify({ year_index: yearNum, term, course_id: courseId, status: 'planned', position }),
      });
      if (!res.ok) { console.error('Failed to create plan item:', await res.text().catch(() => '')); return; }
      const created = await res.json();
      setPlanItems(prev => [...prev, created]);
      setCourseCache(prev => ({ ...prev, [courseId]: { ...courseData, subjectCode: courseData.subjectCode || selectedSubject?.code || '' } }));
    } catch (err) { console.error('Drop failed:', err); }
  };

  const handleDeleteItem = async (itemId) => {
    const userId = user?.id;
    if (!userId || !selectedPlan?.id) return;
    try {
      const res = await fetch(
        `http://localhost:8000/api/plans/${selectedPlan.id}/items/${itemId}`,
        { method: 'DELETE', headers: { 'Content-Type': 'application/json', 'X-User-Id': userId } }
      );
      if (res.status === 204 || res.ok) setPlanItems(prev => prev.filter(it => it.id !== itemId));
      else console.error('Delete failed:', res.status);
    } catch (err) { console.error('Delete failed:', err); }
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
            <h1>{selectedPlan?.name || 'Untitled Plan'}</h1>
            <button className="edit-title-btn">
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
