import React, { useState } from 'react';
import './BasicInformation.css';

function BasicInformation({ onNext, onBack }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
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
    return validDomains.some(domain => email.endsWith(domain));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate UCLA email
    if (!validateEmail(formData.email)) {
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
    // Clear error when user types
    if (emailError) {
      setEmailError('');
    }
  };

  const isFormValid = formData.firstName && formData.lastName && formData.email && formData.password;

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
          <label className="form-label">UCLA Email *</label>
          <input
            type="email"
            name="email"
            className={`form-input ${emailError ? 'input-error' : ''}`}
            placeholder="youremail@g.ucla.edu"
            value={formData.email}
            onChange={handleEmailChange}
            required
          />
          {emailError && <span className="error-message">{emailError}</span>}
        </div>

        <div className="form-group">
          <label className="form-label"> Password (Min. 8 characters, 1 uppercase, 1 number)*</label>
          <input
            type="text"
            name="password"
            className={`form-input`}
            placeholder="passwoed"
            value={formData.password}
            onChange={handleChange}
            required
          />
          {emailError && <span className="error-message">{emailError}</span>}
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