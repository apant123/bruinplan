import React from 'react';

function PlansList({ plans, plansLoading, plansError, createPlanLoading, createPlanError, onCreateNew, onOpenPlan }) {
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
        {plans.map(plan => (
          <div key={plan.id} className="plan-card" onClick={() => onOpenPlan(plan)}>
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
  );
}

export default PlansList;
