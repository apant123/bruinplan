import React, { useState } from 'react';
import './BasicInformation.css';

function BasicInformation({ onNext, onBack }) {
  const [formData, setFormData] = useState({
    about: '',
    firstName: '',
    lastName: '',
    email: ''
  });

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

  const isFormValid = formData.firstName && formData.lastName && formData.email;

  return (
    <div className="basic-info-card">
      <h1 className="basic-info-title">Basic Information</h1>
      <p className="basic-info-subtitle">Tell us a bit about yourself</p>

      <form className="basic-info-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <textarea
            name="about"
            className="form-textarea"
            rows="3"
            value={formData.about}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label className="form-label">First Name *</label>
          <input
            type="text"
            name="firstName"
            className="form-input"
            placeholder="Enter your first name"
            value={formData.firstName}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Last Name *</label>
          <input
            type="text"
            name="lastName"
            className="form-input"
            placeholder="Enter your last name"
            value={formData.lastName}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">UCLA Email *</label>
          <input
            type="email"
            name="email"
            className="form-input"
            placeholder="youremail@g.ucla.edu"
            value={formData.email}
            onChange={handleChange}
            required
          />
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

export default BasicInformation;
