import React, { useState } from 'react';
import './EditProfileModal.css';

function EditProfileModal({ user, onClose, onSave }) {
  const [formData, setFormData] = useState({
    major: user.major || '',
    minor: user.minor || '',
    graduationQuarter: user.graduationQuarter || '',
    graduationYear: user.graduationYear || '',
    units: user.units || 0,
    gpa: user.gpa || 0.0
  });

  const majors = [
    'Computer Science',
    'Cognitive Science',
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
    'Computer Science',
    'Cognitive Science',
    'Psychology',
    'Data Science',
    'Biology',
    'Mathematics',
    'Economics',
    'Statistics',
    'Business'
  ];

  const quarters = ['Fall', 'Winter', 'Spring', 'Summer'];
  const years = ['2024', '2025', '2026', '2027', '2028', '2029', '2030'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Academic Information</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="major">Major</label>
              <select
                id="major"
                name="major"
                value={formData.major}
                onChange={handleChange}
              >
                <option value="">Select a major</option>
                {majors.map(major => (
                  <option key={major} value={major}>{major}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="minor">Minor</label>
              <select
                id="minor"
                name="minor"
                value={formData.minor}
                onChange={handleChange}
              >
                {minors.map(minor => (
                  <option key={minor} value={minor}>{minor}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="graduationQuarter">Graduation Quarter</label>
              <select
                id="graduationQuarter"
                name="graduationQuarter"
                value={formData.graduationQuarter}
                onChange={handleChange}
              >
                <option value="">Select quarter</option>
                {quarters.map(quarter => (
                  <option key={quarter} value={quarter}>{quarter}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="graduationYear">Graduation Year</label>
              <select
                id="graduationYear"
                name="graduationYear"
                value={formData.graduationYear}
                onChange={handleChange}
              >
                <option value="">Select year</option>
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="units">Units Completed</label>
              <input
                type="number"
                id="units"
                name="units"
                value={formData.units}
                onChange={handleChange}
                min="0"
                max="300"
              />
            </div>

            <div className="form-group">
              <label htmlFor="gpa">GPA</label>
              <input
                type="number"
                id="gpa"
                name="gpa"
                value={formData.gpa}
                onChange={handleChange}
                min="0"
                max="4"
                step="0.01"
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="cancel-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="save-button">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProfileModal;
