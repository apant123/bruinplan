import React, { useMemo, useRef, useEffect } from 'react';
import { getSubjectColorCode } from '../../utils/colors';

const TERM_ORDER = { FALL: 1, WINTER: 2, SPRING: 3, SUMMER_A: 4, SUMMER_C: 5 };
const TERM_LABELS = { FALL: 'Fall', WINTER: 'Winter', SPRING: 'Spring', SUMMER_A: 'Summer A', SUMMER_C: 'Summer C' };

function PlansList({ plans, plansLoading, plansError, createPlanLoading, createPlanError, onCreateNew, onOpenPlan, onDeletePlan, planPreviews, courseCache }) {

  // Track the last known plan count so skeletons match
  const lastPlanCount = useRef(1);
  useEffect(() => {
    if (!plansLoading && plans.length > 0) {
      lastPlanCount.current = plans.length;
    }
  }, [plans, plansLoading]);

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
      {/* Show top-level create button only when plans exist */}
      {plans.length > 0 && (
        <button className="create-new-btn" onClick={onCreateNew} disabled={createPlanLoading}>
          {createPlanLoading ? 'Creating…' : '+ Create New Plan'}
        </button>
      )}
      {createPlanError && <div className="sidebar-hint error">{createPlanError}</div>}

      <div className="plans-grid">
        {plansLoading && (
          <>
            {Array.from({ length: Math.max(lastPlanCount.current, 1) }, (_, i) => (
              <div key={i} className="plan-card plan-card-skeleton">
                <div className="skeleton-line skeleton-title" />
                <div className="skeleton-line skeleton-meta" />
                <div className="skeleton-courses">
                  <div className="skeleton-line skeleton-course" />
                  <div className="skeleton-line skeleton-course" />
                  <div className="skeleton-line skeleton-course" />
                  <div className="skeleton-line skeleton-course" />
                </div>
              </div>
            ))}
          </>
        )}
        {plansError && <div className="sidebar-hint error">{plansError}</div>}
        {!plansLoading && !plansError && plans.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="12" y="16" width="56" height="52" rx="8" fill="#E3F2FD" stroke="#247AD6" strokeWidth="2.5"/>
                <rect x="12" y="16" width="56" height="14" rx="8" fill="#247AD6"/>
                <circle cx="26" cy="23" r="2.5" fill="white"/>
                <circle cx="54" cy="23" r="2.5" fill="white"/>
                <rect x="22" y="38" width="16" height="3" rx="1.5" fill="#247AD6" opacity="0.5"/>
                <rect x="22" y="46" width="24" height="3" rx="1.5" fill="#247AD6" opacity="0.35"/>
                <rect x="22" y="54" width="12" height="3" rx="1.5" fill="#247AD6" opacity="0.2"/>
                <path d="M52 48L56 52L64 44" stroke="#5CB85C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 className="empty-state-title">No Plans Yet</h2>
            <p className="empty-state-subtitle">Create your first academic plan to start mapping out your courses, quarters, and path to graduation.</p>
            <button className="empty-state-cta" onClick={onCreateNew} disabled={createPlanLoading}>
              {createPlanLoading ? (
                <span className="empty-state-cta-loading">
                  <span className="empty-cta-spinner"></span>
                  Creating…
                </span>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M9 3v12M3 9h12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
                  </svg>
                  Create Your First Plan
                </>
              )}
            </button>
          </div>
        )}
        {!plansLoading && cardData.map(({ plan, firstTermLabel, totalUnits, courses }) => (
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
