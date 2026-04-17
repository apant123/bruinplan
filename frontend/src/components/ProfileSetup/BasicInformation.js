import React, { useState } from 'react';
import './BasicInformation.css';

function BasicInformation({ onNext, onBack, isGoogle, initialData }) {
  const [formData, setFormData] = useState({
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    email: initialData?.email || '',
    password: ''
  });

  const [emailError, setEmailError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateEmail = (email) => {
    const validDomains = ['@g.ucla.edu', '@ucla.edu'];
    if (isGoogle) return true; // Accept any domain if from Google auth
    return validDomains.some(domain => email.endsWith(domain));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!isGoogle && !validateEmail(formData.email)) {
      setEmailError('Please use a valid UCLA email (@g.ucla.edu or @ucla.edu)');
      return;
    }

    setEmailError('');
    onNext(formData);
  };

  const handleEmailChange = (e) => {
    setFormData({
      ...formData,
      email: e.target.value
    });
    if (emailError) {
      setEmailError('');
    }
  };

  const isFormValid = formData.firstName && formData.lastName && formData.email && (isGoogle || formData.password);

  return (
    <div className="basic-info-card">
      <h1 className="basic-info-title">Basic Information</h1>
      <p className="basic-info-subtitle">Tell us a bit about yourself</p>

      <form className="basic-info-form" onSubmit={handleSubmit}>
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
          <label className="form-label">Email *</label>
          <input
            type="email"
            name="email"
            className={`form-input ${emailError ? 'input-error' : ''}`}
            placeholder="youremail@ucla.edu"
            value={formData.email}
            onChange={handleEmailChange}
            required
            disabled={isGoogle}
          />
          {emailError && <span className="error-message">{emailError}</span>}
        </div>

        {!isGoogle && (
          <div className="form-group">
            <label className="form-label"> Password (Min. 8 characters, 1 uppercase, 1 number)*</label>
            <input
              type="password"
              name="password"
              className={`form-input`}
              placeholder="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
        )}

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
