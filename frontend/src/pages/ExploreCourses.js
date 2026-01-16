import React, { useState } from 'react';
import NavBar from '../components/NavBar';
import './ExploreCourses.css';

function ExploreCourses() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCourses, setExpandedCourses] = useState({});
  const [expandedLectures, setExpandedLectures] = useState({});
  const [activeTab, setActiveTab] = useState({});
  const [selectedLectures, setSelectedLectures] = useState({});
  const [selectedDiscussions, setSelectedDiscussions] = useState({});
  const [filters, setFilters] = useState({
    term: '',
    subjectArea: 'Computer Science (COM SCI)',
    units: 1,
    instructor: '',
    meetingDays: [],
    startTime: '',
    endTime: '',
    location: '',
    level: ''
  });

  const sampleCourses = [
    {
      id: 1,
      code: 'COM SCI 32',
      title: 'Introduction to Computer Science II',
      units: 4.0,
      lectures: [
        {
          id: 'lec1',
          section: 'Lec 1',
          classId: '187096200',
          status: 'Open 139/180',
          statusType: 'open',
          days: 'MW',
          time: '4:00pm-5:50pm',
          location: 'La Kretz Hall 110',
          instructor: 'Huang, B.K.',
          discussions: [
            { id: 'dis1a', section: 'Dis 1A', classId: '187096201', status: 'Open 58/60', statusType: 'open', days: 'F', time: '12:00pm-1:50pm', location: 'Dodd Hall 175', instructor: 'TA' },
            { id: 'dis1b', section: 'Dis 1B', classId: '187096201', status: 'Open 58/60', statusType: 'open', days: 'F', time: '12:00pm-1:50pm', location: 'Dodd Hall 175', instructor: 'TA' },
            { id: 'dis1c', section: 'Dis 1C', classId: '187096201', status: 'Open 58/60', statusType: 'open', days: 'F', time: '12:00pm-1:50pm', location: 'Dodd Hall 175', instructor: 'TA' },
            { id: 'dis1d', section: 'Dis 1D', classId: '187096201', status: 'Open 58/60', statusType: 'open', days: 'F', time: '12:00pm-1:50pm', location: 'Dodd Hall 175', instructor: 'TA' }
          ]
        },
        {
          id: 'lec2',
          section: 'Lec 2',
          classId: '187096200',
          status: 'Waitlist 1/4',
          statusType: 'waitlist',
          days: 'MW',
          time: '4:00pm-5:50pm',
          location: 'La Kretz Hall 110',
          instructor: 'Huang, B.K.',
          discussions: []
        }
      ]
    },
    {
      id: 2,
      code: 'COM SCI 32',
      title: 'Introduction to Computer Science II',
      units: 4.0,
      lectures: [
        {
          id: 'lec1',
          section: 'Lec 1',
          classId: '187096200',
          status: 'Open 139/180',
          statusType: 'open',
          days: 'MW',
          time: '4:00pm-5:50pm',
          location: 'La Kretz Hall 110',
          instructor: 'Huang, B.K.',
          discussions: []
        }
      ]
    },
    {
      id: 3,
      code: 'COM SCI 32',
      title: 'Introduction to Computer Science II',
      units: 4.0,
      lectures: [
        {
          id: 'lec1',
          section: 'Lec 1',
          classId: '187096200',
          status: 'Open 139/180',
          statusType: 'open',
          days: 'MW',
          time: '4:00pm-5:50pm',
          location: 'La Kretz Hall 110',
          instructor: 'Huang, B.K.',
          discussions: []
        }
      ]
    },
    {
      id: 4,
      code: 'COM SCI 32',
      title: 'Introduction to Computer Science II',
      units: 4.0,
      lectures: [
        {
          id: 'lec1',
          section: 'Lec 1',
          classId: '187096200',
          status: 'Open 139/180',
          statusType: 'open',
          days: 'MW',
          time: '4:00pm-5:50pm',
          location: 'La Kretz Hall 110',
          instructor: 'Huang, B.K.',
          discussions: []
        }
      ]
    },
    {
      id: 5,
      code: 'COM SCI 32',
      title: 'Introduction to Computer Science II',
      units: 4.0,
      lectures: [
        {
          id: 'lec1',
          section: 'Lec 1',
          classId: '187096200',
          status: 'Open 139/180',
          statusType: 'open',
          days: 'MW',
          time: '4:00pm-5:50pm',
          location: 'La Kretz Hall 110',
          instructor: 'Huang, B.K.',
          discussions: []
        }
      ]
    }
  ];

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handleClearFilters = () => {
    setFilters({
      term: '',
      subjectArea: '',
      units: 1,
      instructor: '',
      meetingDays: [],
      startTime: '',
      endTime: '',
      location: '',
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
        [courseId]: 'times'
      }));
    }
  };

  const setTab = (courseId, tab) => {
    setActiveTab(prev => ({
      ...prev,
      [courseId]: tab
    }));
  };

  const toggleLectureExpand = (courseId, lectureId) => {
    const key = `${courseId}-${lectureId}`;
    setExpandedLectures(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleLectureSelect = (courseId, lectureId) => {
    const key = `${courseId}-${lectureId}`;
    setSelectedLectures(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleDiscussionSelect = (courseId, lectureId, discussionId) => {
    const lectureKey = `${courseId}-${lectureId}`;
    const key = `${courseId}-${lectureId}-${discussionId}`;

    // Auto-select lecture when discussion is selected
    if (!selectedDiscussions[key]) {
      setSelectedLectures(prev => ({
        ...prev,
        [lectureKey]: true
      }));
    }

    setSelectedDiscussions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const hasSelectedDiscussions = (courseId) => {
    return Object.keys(selectedDiscussions).some(key => key.startsWith(`${courseId}-`) && selectedDiscussions[key]);
  };

  const handleAddToPlan = (courseId) => {
    alert('Add to Plan functionality coming soon!');
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
            <label>Subject Area</label>
            <select value={filters.subjectArea} onChange={(e) => setFilters({...filters, subjectArea: e.target.value})}>
              <option value="">Select subject</option>
              <option value="Computer Science (COM SCI)">Computer Science (COM SCI)</option>
              <option value="Mathematics (MATH)">Mathematics (MATH)</option>
              <option value="Psychology (PSYCH)">Psychology (PSYCH)</option>
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
            <label>Instructor</label>
            <select value={filters.instructor} onChange={(e) => setFilters({...filters, instructor: e.target.value})}>
              <option value="">Enter instructor's last name</option>
              <option value="smith">Smith</option>
              <option value="johnson">Johnson</option>
            </select>
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
            <label>Location</label>
            <select value={filters.location} onChange={(e) => setFilters({...filters, location: e.target.value})}>
              <option value="">Enter location</option>
              <option value="boelter">Boelter Hall</option>
              <option value="royce">Royce Hall</option>
            </select>
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
            <div className="search-bar">
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
            <button className="bookmarked-button">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 2H13C13.55 2 14 2.45 14 3V14L8 11L2 14V3C2 2.45 2.45 2 3 2Z" stroke="#247ad6" strokeWidth="1.5" fill="none"/>
              </svg>
              Bookmarked
            </button>
          </div>

          <div className="results-count">2540 Results</div>

          <div className="courses-list">
            {sampleCourses.map(course => (
              <div key={course.id} className="course-card-wrapper">
                <div className="course-card">
                  <div className="course-info" onClick={() => toggleCourseExpand(course.id)}>
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
                        className={`tab-button ${(!activeTab[course.id] || activeTab[course.id] === 'times') ? 'active' : ''}`}
                        onClick={() => setTab(course.id, 'times')}
                      >
                        Course Times
                      </button>
                      <button
                        className={`tab-button ${activeTab[course.id] === 'details' ? 'active' : ''}`}
                        onClick={() => setTab(course.id, 'details')}
                      >
                        Details
                      </button>
                    </div>

                    {(!activeTab[course.id] || activeTab[course.id] === 'times') && (
                      <div className="course-table-wrapper">
                        <div className="course-table">
                          <table>
                            <thead>
                              <tr>
                                <th></th>
                                <th>Section</th>
                                <th>Class ID</th>
                                <th>Status</th>
                                <th>Days</th>
                                <th>Time</th>
                                <th>Location</th>
                                <th>Instructor</th>
                              </tr>
                            </thead>
                            <tbody>
                              {course.lectures.map((lecture) => {
                                const lectureKey = `${course.id}-${lecture.id}`;
                                const isLectureExpanded = expandedLectures[lectureKey];
                                const hasDiscussions = lecture.discussions && lecture.discussions.length > 0;

                                return (
                                  <React.Fragment key={lecture.id}>
                                    <tr className="lecture-row">
                                      <td>
                                        <button
                                          className="expand-icon-button"
                                          onClick={() => hasDiscussions ? toggleLectureExpand(course.id, lecture.id) : toggleLectureSelect(course.id, lecture.id)}
                                        >
                                          {hasDiscussions && isLectureExpanded ? '−' : '+'}
                                        </button>
                                      </td>
                                      <td className="section-name">{lecture.section}</td>
                                      <td>{lecture.classId}</td>
                                      <td>
                                        <span className={`status-badge ${lecture.statusType}`}>
                                          {lecture.status}
                                        </span>
                                      </td>
                                      <td>{lecture.days}</td>
                                      <td>{lecture.time}</td>
                                      <td>{lecture.location}</td>
                                      <td>{lecture.instructor}</td>
                                    </tr>

                                    {isLectureExpanded && hasDiscussions && lecture.discussions.map((discussion) => {
                                      const discussionKey = `${course.id}-${lecture.id}-${discussion.id}`;
                                      return (
                                        <tr key={discussion.id} className="discussion-row">
                                          <td>
                                            <input
                                              type="checkbox"
                                              checked={selectedDiscussions[discussionKey] || false}
                                              onChange={() => toggleDiscussionSelect(course.id, lecture.id, discussion.id)}
                                            />
                                          </td>
                                          <td className="discussion-name">{discussion.section}</td>
                                          <td>{discussion.classId}</td>
                                          <td>
                                            <span className={`status-badge ${discussion.statusType}`}>
                                              {discussion.status}
                                            </span>
                                          </td>
                                          <td>{discussion.days}</td>
                                          <td>{discussion.time}</td>
                                          <td>{discussion.location}</td>
                                          <td>{discussion.instructor}</td>
                                        </tr>
                                      );
                                    })}

                                    {isLectureExpanded && hasDiscussions && hasSelectedDiscussions(course.id) && (
                                      <tr className="add-to-plan-row">
                                        <td colSpan="8">
                                          <button className="add-to-plan-button-full" onClick={() => handleAddToPlan(course.id)}>
                                            + Add to Plan
                                          </button>
                                        </td>
                                      </tr>
                                    )}
                                  </React.Fragment>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {activeTab[course.id] === 'details' && (
                      <div className="course-details-content">
                        <p>Course details coming soon...</p>
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
