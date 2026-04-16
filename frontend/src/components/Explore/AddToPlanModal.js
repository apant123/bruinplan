import React, { useEffect, useState } from 'react';
import './AddToPlanModal.css';

const TERMS = [
  { value: 'FALL', label: 'Fall' },
  { value: 'WINTER', label: 'Winter' },
  { value: 'SPRING', label: 'Spring' },
  { value: 'SUMMER_A', label: 'Summer A' },
  { value: 'SUMMER_C', label: 'Summer C' }
];

function AddToPlanModal({ isOpen, course, userId, onClose }) {
  const [step, setStep] = useState(1); // 1 = Select Plan, 2 = Select Term
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  
  const [selectedPlan, setSelectedPlan] = useState(null);
  
  const [yearIndex, setYearIndex] = useState(1);
  const [term, setTerm] = useState('FALL');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && userId) {
      setStep(1);
      setSelectedPlan(null);
      setYearIndex(1);
      setTerm('FALL');
      setError('');
      setIsSubmitting(false);

      const fetchPlans = async () => {
        setLoadingPlans(true);
        try {
          const res = await fetch('http://localhost:8000/api/plans/', {
            headers: { 'Content-Type': 'application/json', 'X-User-Id': userId }
          });
          if (res.ok) {
            const data = await res.json();
            setPlans(data.plans || []);
          }
        } catch (err) {
          console.error(err);
          setError('Failed to load plans.');
        } finally {
          setLoadingPlans(false);
        }
      };
      fetchPlans();
    }
  }, [isOpen, userId]);

  if (!isOpen || !course) return null;

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    setStep(2);
  };

  const handleAdd = async () => {
    if (!selectedPlan) return;
    setIsSubmitting(true);
    setError('');

    try {
      const payload = {
        year_index: Number(yearIndex),
        term: term,
        course_id: course.id,
        status: 'planned'
      };

      const res = await fetch(`http://localhost:8000/api/plans/${selectedPlan.id}/items/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || `HTTP ${res.status}`);
      }

      // Success
      setIsSubmitting(false);
      onClose(); // Alternatively show a success toast before closing
    } catch (err) {
      console.error(err);
      setError('Failed to add course. It may already be in this plan bucket.');
      setIsSubmitting(false);
    }
  };

  const renderStepOne = () => (
    <>
      <h3 className="atp-title">Select a Plan</h3>
      <p className="atp-sub">Where would you like to add {course.subjectCode} {course.number}?</p>
      
      {loadingPlans ? (
        <p>Loading plans...</p>
      ) : plans.length === 0 ? (
        <p>You don't have any plans yet. Create one in the "Plan" tab first.</p>
      ) : (
        <div className="atp-plan-list">
          {plans.map(p => (
            <button key={p.id} className="atp-plan-item" onClick={() => handlePlanSelect(p)}>
              <h4>{p.name}</h4>
              <p>Starts {p.start_year || 'Unknown Year'}</p>
            </button>
          ))}
        </div>
      )}

      {error && <div className="atp-error">{error}</div>}

      <div className="atp-actions">
        <button className="atp-cancel-btn" onClick={onClose}>Cancel</button>
      </div>
    </>
  );

  const renderStepTwo = () => {
    const startYr = selectedPlan?.start_year || new Date().getFullYear();
    const yearOptions = [1, 2, 3, 4, 5].map(y => {
      const acYears = `${startYr + y - 1}-${startYr + y}`;
      return { value: y, label: `Year ${y} (${acYears})` };
    });

    return (
      <>
        <h3 className="atp-title">Choose Term</h3>
        <p className="atp-sub">Add to <strong>{selectedPlan.name}</strong></p>

        <div className="atp-select-group">
          <label className="atp-label">Year</label>
          <select 
            className="atp-select"
            value={yearIndex}
            onChange={(e) => setYearIndex(e.target.value)}
          >
            {yearOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="atp-select-group">
          <label className="atp-label">Term</label>
          <select
            className="atp-select"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          >
            {TERMS.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {error && <div className="atp-error">{error}</div>}

        <div className="atp-actions">
          <button className="atp-cancel-btn" onClick={() => { setStep(1); setError(''); }}>Back</button>
          <button 
            className="atp-confirm-btn" 
            onClick={handleAdd}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Adding...' : 'Add Course'}
          </button>
        </div>
      </>
    );
  };

  return (
    <div className="atp-overlay" onClick={onClose}>
      <div className="atp-modal" onClick={(e) => e.stopPropagation()}>
        <div className="atp-icon-row">
          <div className="atp-icon-circle">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="#247ad6" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>
        </div>

        {step === 1 ? renderStepOne() : renderStepTwo()}
      </div>
    </div>
  );
}

export default AddToPlanModal;
