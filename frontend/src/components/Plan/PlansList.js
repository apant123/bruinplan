import React, { useMemo } from 'react';
import { getSubjectColorCode } from '../../utils/colors';

const TERM_ORDER = { FALL: 1, WINTER: 2, SPRING: 3, SUMMER_A: 4, SUMMER_C: 5 };
const TERM_LABELS = { FALL: 'Fall', WINTER: 'Winter', SPRING: 'Spring', SUMMER_A: 'Summer A', SUMMER_C: 'Summer C' };

function PlansList({ plans, plansLoading, plansError, createPlanLoading, createPlanError, onCreateNew, onOpenPlan, onDeletePlan, planPreviews, courseCache }) {

  // Build preview data for each plan: first quarter's courses + metadata
  const cardData = useMemo(() => {
    return plans.map(plan => {
      const items = planPreviews?.[plan.id] || [];
      if (items.length === 0) return { plan, firstTermLabel: null, totalUnits: 0, courses: [] };

      // Find the first quarter (lowest year_index, then lowest term order)
      let minScore = Infinity;
      let firstYear = null;
      let firstTerm = null;

      items.forEach(it => {
        const score = (it.year_index || 0) * 10 + (TERM_ORDER[it.term] || 0);
        if (score < minScore) {
          minScore = score;
          firstYear = it.year_index;
          firstTerm = it.term;
        }
      });

      // Get courses from first quarter only
      const firstQuarterItems = items.filter(it => it.year_index === firstYear && it.term === firstTerm);

      // Total units across all items
      const totalUnits = items.reduce((sum, it) => {
        const c = courseCache?.[it.course_id];
        const u = c?.units ? parseFloat(c.units) : 0;
        return sum + (isNaN(u) ? 0 : u);
      }, 0);

      // Build the label
      const termLabel = TERM_LABELS[firstTerm] || firstTerm;
      const year = plan.start_year ? plan.start_year + (firstYear - 1) : null;
      const firstTermLabel = year ? `${termLabel} ${year} Quarter` : `Year ${firstYear} ${termLabel}`;

      // Resolve course names
      const courses = firstQuarterItems.map(it => {
        const c = courseCache?.[it.course_id];
        return {
          id: it.course_id,
          label: c ? `${c.subjectCode || ''} ${c.number || ''}`.trim() : `Course #${it.course_id}`,
          subjectCode: c?.subjectCode || '',
        };
      });

      return { plan, firstTermLabel, totalUnits, courses };
    });
  }, [plans, planPreviews, courseCache]);

  return (
    <div className="plan-container">
      <button className="create-new-btn" onClick={onCreateNew} disabled={createPlanLoading}>
        {createPlanLoading ? 'Creating…' : '+ Create New Plan'}
      </button>
      {createPlanError && <div className="sidebar-hint error">{createPlanError}</div>}

      <div className="plans-grid">
        {plansLoading && <div className="sidebar-hint">Loading plans...</div>}
        {plansError && <div className="sidebar-hint error">{plansError}</div>}
        {!plansLoading && !plansError && plans.length === 0 && (
          <div className="sidebar-hint">No plans yet. Create one to get started!</div>
        )}
        {cardData.map(({ plan, firstTermLabel, totalUnits, courses }) => (
          <div key={plan.id} className="plan-card" onClick={() => onOpenPlan(plan)}>
            <div className="plan-card-header">
              <h3>{plan.name}</h3>
              <button className="delete-btn" onClick={(e) => { e.stopPropagation(); onDeletePlan(plan.id); }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M3 5h14M8 5V3h4v2m-5 0v9m4-9v9M6 5v11a1 1 0 001 1h6a1 1 0 001-1V5" stroke="#999" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <div className="plan-card-meta">
              {firstTermLabel || (plan.start_year ? `Starting ${plan.start_year}` : '')}
              {totalUnits > 0 ? ` \u00A0|\u00A0 ${totalUnits} Units` : ''}
            </div>

            {courses.length > 0 && (
              <div className="plan-card-courses">
                {courses.slice(0, 6).map((c, i) => {
                  const colors = getSubjectColorCode(c.subjectCode);
                  return (
                    <div key={`${c.id}-${i}`} className="course-mini" style={{ borderLeftColor: colors.border }}>
                      {c.label}
                    </div>
                  );
                })}
                {/* Fill remaining slots with placeholders up to 6 */}
                {courses.length < 6 && Array.from({ length: Math.min(6 - courses.length, 2) }, (_, i) => (
                  <div key={`placeholder-${i}`} className="course-mini course-mini-placeholder" />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default PlansList;
