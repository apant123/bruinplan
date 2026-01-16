import React, { useState } from 'react';
import './AcademicProgram.css';

function AcademicProgram({ onNext, onBack }) {
  const [formData, setFormData] = useState({
    major: '',
    minor: ''
  });

  const majors = [
    'Cognitive Science',
    'Computer Science',
    'Psychology',
    'Data Science',
    'Biology',
    'Mathematics',
    'Economics',
    'Engineering',
    'Physics',
    'Chemistry'
  ];

  const minors = [
    'None',
    'Cognitive Science',
    'Computer Science',
    'Psychology',
    'Data Science',
    'Biology',
    'Mathematics',
    'Economics',
    'Statistics',
    'Business'
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext(formData);
  };

  const isFormValid = formData.major;

  return (
    <div className="academic-program-card">
      <h1 className="academic-program-title">Academic Program</h1>
      <p className="academic-program-subtitle">Select your major and minor (if applicable)</p>

      <form className="academic-program-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Major *</label>
          <select
            name="major"
            className="form-select"
            value={formData.major}
            onChange={handleChange}
            required
          >
            <option value="">Select your major</option>
            {majors.map((major) => (
              <option key={major} value={major}>
                {major}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Minor</label>
          <select
            name="minor"
            className="form-select"
            value={formData.minor}
            onChange={handleChange}
          >
            <option value="">Select your minor</option>
            {minors.map((minor) => (
              <option key={minor} value={minor}>
                {minor}
              </option>
            ))}
          </select>
        </div>

        <div className="form-buttons">
          <button type="button" className="secondary-button" onClick={onBack}>
            Back
          </button>
          <button
            type="submit"
            className="next-button"
            disabled={!isFormValid}
          >
            Next
          </button>
        </div>
      </form>
    </div>
  );
}

export default AcademicProgram;
