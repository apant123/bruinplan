import React from 'react';

const TERMS = ['FALL', 'WINTER', 'SPRING', 'SUMMER_A', 'SUMMER_C'];
const TERM_LABELS = { FALL: 'Fall', WINTER: 'Winter', SPRING: 'Spring', SUMMER_A: 'Summer A', SUMMER_C: 'Summer C' };
const YEAR_COUNT = 4;

function ScheduleGrid({
  itemsByYearTerm,
  courseCache,
  expandedYears,
  onToggleYear,
  dragOverTarget,
  onSetDragOverTarget,
  onDrop,
  onDeleteItem,
  itemsLoading,
  itemsError,
}) {
  return (
    <div className="schedule-section">
      {itemsLoading && <div className="sidebar-hint">Loading plan items...</div>}
      {itemsError && <div className="sidebar-hint error">{itemsError}</div>}

      {Array.from({ length: YEAR_COUNT }, (_, i) => i + 1).map(yearNum => (
        <div key={yearNum} className="year-section">
          <div className="year-header" onClick={() => onToggleYear(`year${yearNum}`)}>
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
                      onSetDragOverTarget({ year: yearNum, term });
                    }}
                    onDragLeave={() => onSetDragOverTarget(null)}
                    onDrop={(e) => onDrop(e, yearNum, term)}
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
                              onDeleteItem(item.id);
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
  );
}

export default ScheduleGrid;
