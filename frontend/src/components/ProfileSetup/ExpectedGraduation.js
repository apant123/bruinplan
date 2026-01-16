import React, { useState } from 'react';
import './ExpectedGraduation.css';

function ExpectedGraduation({ onNext, onBack }) {
  const [formData, setFormData] = useState({
    graduationYear: '',
    graduationQuarter: ''
  });

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear + i);

  const quarters = ['Fall', 'Winter', 'Spring'];

  const handleYearChange = (e) => {
    setFormData({
      ...formData,
      graduationYear: e.target.value
    });
  };

  const handleQuarterSelect = (quarter) => {
    setFormData({
      ...formData,
      graduationQuarter: quarter
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext(formData);
  };

  const isFormValid = formData.graduationYear && formData.graduationQuarter;

  return (
    <div className="expected-graduation-card">
      <h1 className="expected-graduation-title">Expected Graduation</h1>
      <p className="expected-graduation-subtitle">When do you plan to graduate?</p>

      <form className="expected-graduation-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Graduation Year *</label>
          <select
            name="graduationYear"
            className="form-select"
            value={formData.graduationYear}
            onChange={handleYearChange}
            required
          >
            <option value="">Select Year</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Graduation Quarter *</label>
          <div className="quarter-buttons">
            {quarters.map((quarter) => (
              <button
                key={quarter}
                type="button"
                className={`quarter-button ${formData.graduationQuarter === quarter ? 'selected' : ''}`}
                onClick={() => handleQuarterSelect(quarter)}
              >
                {quarter}
              </button>
            ))}
          </div>
        </div>

        <div className="form-buttons">
          <button type="button" className="secondary-button" onClick={onBack}>
            Back
          </button>
          <button
            type="submit"
            className="complete-button"
            disabled={!isFormValid}
          >
            Complete Setup
          </button>
        </div>
      </form>
    </div>
  );
}

export default ExpectedGraduation;
