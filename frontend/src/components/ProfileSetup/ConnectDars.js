import React, { useState } from 'react';
import './ConnectDars.css';

function ConnectDars({ onNext, onBack }) {
  const [selectedOption, setSelectedOption] = useState('sync');

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext({ darsOption: selectedOption });
  };

  return (
    <div className="connect-dars-card">
      <h1 className="connect-dars-title">Connect with DARS</h1>
      <p className="connect-dars-subtitle">
        Sync your degree requirements automatically or continue without
      </p>

      <form className="connect-dars-form" onSubmit={handleSubmit}>
        <div className="radio-options">
          <label className={`radio-option ${selectedOption === 'sync' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="darsOption"
              value="sync"
              checked={selectedOption === 'sync'}
              onChange={(e) => setSelectedOption(e.target.value)}
            />
            <div className="radio-content">
              <div className="radio-header">
                <div className="radio-circle">
                  {selectedOption === 'sync' && <div className="radio-inner" />}
                </div>
                <h3 className="radio-title">Sync with DARS (Recommended)</h3>
              </div>
              <p className="radio-description">
                Automatically import your degree requirements, completed courses, and progress from UCLA's DARS system.
              </p>
            </div>
          </label>

          <label className={`radio-option ${selectedOption === 'manual' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="darsOption"
              value="manual"
              checked={selectedOption === 'manual'}
              onChange={(e) => setSelectedOption(e.target.value)}
            />
            <div className="radio-content">
              <div className="radio-header">
                <div className="radio-circle">
                  {selectedOption === 'manual' && <div className="radio-inner" />}
                </div>
                <h3 className="radio-title">Continue without DARS Entry</h3>
              </div>
              <p className="radio-description">
                Enter your courses and requirements manually. You can always sync with DARS later in settings.
              </p>
            </div>
          </label>
        </div>

        <div className="form-buttons">
          <button type="button" className="secondary-button" onClick={onBack}>
            Back
          </button>
          <button type="submit" className="next-button">
            Next
          </button>
        </div>
      </form>
    </div>
  );
}

export default ConnectDars;
