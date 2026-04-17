import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import NavBar from '../components/NavBar';
import CourseDetailModal from '../components/Plan/CourseDetailModal';
import './DegreeProgress.css';

function DegreeProgress() {
  const [activeTab, setActiveTab] = useState('needed');
  const [filter, setFilter] = useState('all');
  const [expandedCategories, setExpandedCategories] = useState({});
  const [filters, setFilters] = useState({
    subjectArea: 'Computer Science (COM SCI)',
    units: 1
  });
  const { user } = useAuth();
  const [takenCourses, setTakenCourses] = useState([]);
  const [takenCoursesLoading, setTakenCoursesLoading] = useState(false);
  const [takenCoursesError, setTakenCoursesError] = useState('');

  const [neededRequirements, setNeededRequirements] = useState([]);
  const [neededCourseCache, setNeededCourseCache] = useState({});
  const [neededCoursesLoading, setNeededCoursesLoading] = useState(false);
  const [neededCoursesError, setNeededCoursesError] = useState('');
  const [collapsedDynamicReqs, setCollapsedDynamicReqs] = useState({});
  const [bookmarkedCourseIds, setBookmarkedCourseIds] = useState(new Set());
  const [suggestedCourses, setSuggestedCourses] = useState([]);
  const [expectedGraduation, setExpectedGraduation] = useState('');
  
  const [completedUnits, setCompletedUnits] = useState(0);
  const [completedMajorUnits, setCompletedMajorUnits] = useState(0);
  const [completedUpperUnits, setCompletedUpperUnits] = useState(0);
  const [completedGeUnits, setCompletedGeUnits] = useState(0);

  const toggleDynamicReq = (idx) => {
      setCollapsedDynamicReqs(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const [detailModal, setDetailModal] = useState({ open: false, course: null });

  useEffect(() => {
    if (!user?.id) return;
    async function fetchCourseData() {
      setTakenCoursesLoading(true);
      setNeededCoursesLoading(true);
      try {
        const userRes = await fetch(`${API_BASE}/api/user/', {
          headers: { 'X-User-Id': user.id }
        });
        if (!userRes.ok) throw new Error('Failed to fetch user profile');
        const userData = await userRes.json();
        
        if (userData.expected_grad && userData.year) {
          const formattedSeason = userData.expected_grad.charAt(0).toUpperCase() + userData.expected_grad.slice(1).toLowerCase();
          setExpectedGraduation(`${formattedSeason} ${userData.year}`);
        }

        const classesTaken = userData.classes_taken || [];
        const takenLabels = classesTaken.map(c => typeof c === 'string' ? c : c?.course).filter(Boolean);

        const headers = { 'X-User-Id': user.id };

        // TOTAL UNITS
        const unitsRes = await fetch(`${API_BASE}/api/units/total_units/', { headers });
        if (unitsRes.ok) {
          const data = await unitsRes.json();
          setCompletedUnits(Number(data.total_units) || 0);
        }

        // MAJOR UNITS
        const majorRes = await fetch(`${API_BASE}/api/units/major_units/', { headers });
        if (majorRes.ok) {
          const data = await majorRes.json();
          setCompletedMajorUnits(Number(data.major_units) || 0);
        }

        // UPPER DIV UNITS
        const upperRes = await fetch(`${API_BASE}/api/units/upper_units/', { headers });
        if (upperRes.ok) {
          const data = await upperRes.json();
          setCompletedUpperUnits(Number(data.upper_units) || 0);
        }

        // GE UNITS
        const geRes = await fetch(`${API_BASE}/api/units/ge_units/', { headers });
        if (geRes.ok) {
          const data = await geRes.json();
          setCompletedGeUnits(Number(data.ge_units) || 0);
        }

        if (takenLabels.length > 0) {
          const cRes = await fetch(`${API_BASE}/api/courses/by-labels/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-User-Id': user.id
            },
            body: JSON.stringify({ labels: takenLabels })
          });
          const cData = await cRes.ok ? await cRes.json() : { courses: [] };
          setTakenCourses(cData.courses || []);
        }

        const classesNeeded = userData.classes_needed || [];
        setNeededRequirements(classesNeeded);

        const neededLabels = new Set();
        classesNeeded.forEach((req) => {
          (req.options || []).forEach(opt => {
            if (Array.isArray(opt)) {
              opt.forEach(o => neededLabels.add(o));
            } else if (typeof opt === 'string') {
              neededLabels.add(opt);
            }
          });
        });

        const neededLabelsArr = Array.from(neededLabels);
        if (neededLabelsArr.length > 0) {
          const cRes = await fetch(`${API_BASE}/api/courses/by-labels/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-User-Id': user.id
            },
            body: JSON.stringify({ labels: neededLabelsArr })
          });
          const cData = await cRes.ok ? await cRes.json() : { courses: [] };
          
          const labelToCourse = {};
          cData.courses.forEach(c => {
             labelToCourse[`${c.subject_code} ${c.number}`.trim().toLowerCase().replace(/\s+/g, ' ')] = c;
          });
          setNeededCourseCache(labelToCourse);

          // Build suggestions based on prerequisites natively
          const subjRes = await fetch(`${API_BASE}/api/subjects/', { headers: { 'Content-Type': 'application/json' } });
          const subjData = await subjRes.ok ? await subjRes.json() : { subjects: [] };
          const subjectMap = {};
          subjData.subjects?.forEach(s => { subjectMap[s.name.toLowerCase()] = s.code.toUpperCase(); });

          const takenSet = new Set(takenLabels.map(lbl => lbl.toUpperCase().replace(/\s+/g, ' ')));
          const suggested = [];

          Object.values(labelToCourse).forEach(course => {
            const courseLabel = `${course.subject_code} ${course.number}`.toUpperCase().replace(/\s+/g, ' ');
            if (takenSet.has(courseLabel)) return;

            let prereqsMet = true;
            if (course.requisites_parsed && course.requisites_parsed.requisites) {
                const enforced = course.requisites_parsed.requisites.find(r => r.type === 'enforced');
                if (enforced && enforced.groups && enforced.groups.length > 0) {
                    prereqsMet = enforced.groups.every(group => {
                        return group.courses.some(reqC => {
                            const subjName = (reqC.subject || '').toLowerCase();
                            const subjCode = subjectMap[subjName] || subjName.toUpperCase();
                            const reqLabel = `${subjCode} ${reqC.number}`.toUpperCase().replace(/\s+/g, ' ');
                            return takenSet.has(reqLabel);
                        });
                    });
                }
            }
            if (prereqsMet) {
                suggested.push(course);
            }
          });
          setSuggestedCourses(suggested);
        }

        const bmRes = await fetch(`${API_BASE}/api/bookmarks/', {
          headers: { 'X-User-Id': user.id }
        });
        if (bmRes.ok) {
          const bmData = await bmRes.json();
          setBookmarkedCourseIds(new Set(bmData.bookmarks || []));
        }

      } catch (err) {
        console.error(err);
        setTakenCoursesError('Could not load completed courses.');
        setNeededCoursesError('Could not load needed courses.');
      } finally {
        setTakenCoursesLoading(false);
        setNeededCoursesLoading(false);
      }
    }
    fetchCourseData();
  }, [user?.id]);

  const toggleBookmark = async (e, courseId) => {
    e.stopPropagation();
    if (!user?.id) return;
    
    const isBookmarked = bookmarkedCourseIds.has(courseId);
    const method = isBookmarked ? 'DELETE' : 'POST';
    
    setBookmarkedCourseIds(prev => {
      const next = new Set(prev);
      if (isBookmarked) next.delete(courseId);
      else next.add(courseId);
      return next;
    });
    
    try {
      const res = await fetch(`${API_BASE}/api/bookmarks/${courseId}/`, {
        method,
        headers: { 'X-User-Id': user.id }
      });
      if (!res.ok) throw new Error('Failed to update bookmark');
      const data = await res.json();
      setBookmarkedCourseIds(new Set(data.bookmarks || []));
    } catch (err) {
      console.error(err);
      setBookmarkedCourseIds(prev => {
        const next = new Set(prev);
        if (isBookmarked) next.add(courseId);
        else next.delete(courseId);
        return next;
      });
    }
  };

  // Sample data
  const progressData = [
    {
      label: '180 Units',
      completed: completedUnits,
      total: 180,
      color: 'blue'
    },
    {
      label: 'General Education',
      completed: completedGeUnits,
      total: 60,
      color: 'orange'
    },
    {
      label: 'Major',
      completed: completedMajorUnits,
      total: 100,
      color: 'green'
    },
    {
      label: 'Upper Division',
      completed: completedUpperUnits,
      total: 60,
      color: 'purple'
    }
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
            <div className="expected-grad">Expected: {expectedGraduation || 'Undeclared'}</div>
            <div className="graduation-progress-bar-container">
              <div className="graduation-progress-bar-fill"></div>
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
              {(filter === 'completed' || filter === 'all') && (
                 <div className="taken-courses-list" style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                   {takenCoursesLoading ? (
                     <div className="results-count">Loading completed courses...</div>
                   ) : takenCoursesError ? (
                     <div className="results-count" style={{ color: 'red' }}>{takenCoursesError}</div>
                   ) : takenCourses.length === 0 ? (
                     <div className="results-count">No completed courses synced to your profile yet!</div>
                   ) : takenCourses.map(course => (
                     <div 
                         key={course.id} 
                         className="suggestion-course-card" 
                         style={{ cursor: 'pointer', padding: '16px', background: '#fff', borderRadius: '12px', border: '1px solid #ebecf0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                         onDoubleClick={() => setDetailModal({ open: true, course: { ...course, subjectCode: course.subject_code } })}
                     >
                        <div className="course-info">
                          <div className="course-code" style={{ fontSize: '18px', fontWeight: 'bold', color: '#1d1d1f' }}>{course.subject_code} {course.number}</div>
                          <div className="course-title" style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>{course.title}</div>
                          <div className="course-units" style={{ fontSize: '13px', color: '#999', marginTop: '8px' }}>{course.units} Units</div>
                        </div>
                        <div className="course-actions">
                          <button className="icon-button bookmark-icon" onClick={(e) => toggleBookmark(e, course.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                            <svg width="20" height="20" viewBox="0 0 20 20" fill={bookmarkedCourseIds.has(course.id) ? "#247ad6" : "none"}>
                              <path d="M4 3H16C16.55 3 17 3.45 17 4V17L10 14L3 17V4C3 3.45 3.45 3 4 3Z" stroke="#247ad6" strokeWidth="1.5" />
                            </svg>
                          </button>
                        </div>
                     </div>
                   ))}
                 </div>
              )}
              
              {(filter === 'needed' || filter === 'all') && (
                 <div className="needed-requirements-list" style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                   {neededCoursesLoading ? (
                     <div className="results-count">Loading needed requirements...</div>
                   ) : neededCoursesError ? (
                     <div className="results-count" style={{ color: 'red' }}>{neededCoursesError}</div>
                   ) : neededRequirements.length === 0 ? (
                     <div className="results-count">No needed courses synced to your profile yet!</div>
                   ) : neededRequirements.map((req, rIdx) => {
                       const rawText = req.needs_text || '';
                       const parts = rawText.split('|').map(p => p.trim());
                       const numNeeded = req.needs || 0;
                       
                       const rawOptions = [];
                       (req.options || []).forEach(opt => {
                          if (Array.isArray(opt)) {
                             rawOptions.push(...opt);
                          } else if (typeof opt === 'string') {
                             rawOptions.push(opt);
                          }
                       });
                       
                       const matchedCourses = rawOptions.map(opt => {
                           const key = opt.trim().toLowerCase().replace(/\s+/g, ' ');
                           return neededCourseCache[key];
                       }).filter(Boolean);

                       return (
                         <div key={rIdx} className="requirement-category" style={{ background: '#f8f9fa', padding: '20px', borderRadius: '12px', border: '1px solid #dee2e6' }}>
                           <div className="category-header" onClick={() => toggleDynamicReq(rIdx)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: 'pointer' }}>
                             <div style={{ paddingBottom: collapsedDynamicReqs[rIdx] ? '0' : '16px' }}>
                               <h3 style={{ fontSize: '18px', margin: 0, color: '#1d1d1f' }}>{parts.length >= 2 ? parts[1] : parts[0]}</h3>
                               <div style={{ marginTop: '8px', color: '#dc3545', fontWeight: '600' }}>Needs: {numNeeded} Course{numNeeded !== 1 ? 's' : ''}</div>
                               {parts.length > 2 && <p style={{ fontSize: '13px', color: '#777', marginTop: '6px', lineHeight: '1.4' }}>{rawText}</p>}
                             </div>
                             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ transform: collapsedDynamicReqs[rIdx] ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', marginTop: '4px' }}>
                               <path d="M6 15L12 9L18 15" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                             </svg>
                           </div>
                           
                           {!collapsedDynamicReqs[rIdx] && (
                             <>
                               {matchedCourses.length === 0 && (
                                   <div style={{ fontSize: '14px', color: '#888' }}>No specific course options parsed.</div>
                               )}

                               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                                 {matchedCourses.map((course, cIdx) => (
                                   <div 
                                        key={course.id + '-' + cIdx} 
                                        className="suggestion-course-card" 
                                        style={{ cursor: 'pointer', padding: '16px', background: '#fff', borderRadius: '12px', border: '1px solid #ebecf0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                        onDoubleClick={() => setDetailModal({ open: true, course: { ...course, subjectCode: course.subject_code } })}
                                   >
                                      <div className="course-info">
                                        <div className="course-code" style={{ fontSize: '16px', fontWeight: 'bold', color: '#1d1d1f' }}>{course.subject_code} {course.number}</div>
                                        <div className="course-title" style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>{course.title}</div>
                                        <div className="course-units" style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>{course.units} Units</div>
                                      </div>
                                      <div className="course-actions">
                                        <button className="icon-button bookmark-icon" onClick={(e) => toggleBookmark(e, course.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                                          <svg width="20" height="20" viewBox="0 0 20 20" fill={bookmarkedCourseIds.has(course.id) ? "#247ad6" : "none"}>
                                            <path d="M4 3H16C16.55 3 17 3.45 17 4V17L10 14L3 17V4C3 3.45 3.45 3 4 3Z" stroke="#247ad6" strokeWidth="1.5" />
                                          </svg>
                                        </button>
                                      </div>
                                   </div>
                                 ))}
                               </div>
                             </>
                           )}
                         </div>
                       );
                    })}
                 </div>
              )}
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

            <div className="suggestions-courses" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
              {suggestedCourses.map(course => (
                 <div 
                      key={course.id} 
                      className="suggestion-course-card" 
                      style={{ cursor: 'pointer', padding: '16px', background: '#fff', borderRadius: '12px', border: '1px solid #ebecf0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                      onDoubleClick={() => setDetailModal({ open: true, course: { ...course, subjectCode: course.subject_code } })}
                 >
                    <div className="course-info">
                      <div className="course-code" style={{ fontSize: '16px', fontWeight: 'bold', color: '#1d1d1f' }}>{course.subject_code} {course.number}</div>
                      <div className="course-title" style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>{course.title}</div>
                      <div className="course-units" style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>{course.units} Units</div>
                    </div>
                    <div className="course-actions">
                      <button className="icon-button bookmark-icon" onClick={(e) => toggleBookmark(e, course.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill={bookmarkedCourseIds.has(course.id) ? "#247ad6" : "none"}>
                          <path d="M4 3H16C16.55 3 17 3.45 17 4V17L10 14L3 17V4C3 3.45 3.45 3 4 3Z" stroke="#247ad6" strokeWidth="1.5" />
                        </svg>
                      </button>
                    </div>
                 </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <CourseDetailModal
        isOpen={detailModal.open}
        course={detailModal.course}
        onClose={() => setDetailModal({ open: false, course: null })}
      />
    </div>
  );
}

export default DegreeProgress;
