import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import NavBar from '../NavBar';
import ProgressBar from './ProgressBar';
import WelcomePage from './WelcomePage';
import BasicInformation from './BasicInformation';
import ConnectDars from './ConnectDars';
import AcademicProgram from './AcademicProgram';
import ExpectedGraduation from './ExpectedGraduation';
import DarUploadInstructions from './DarUploadInstructions';
import UploadModal from './UploadModal';
import './ProfileSetup.css';

function ProfileSetup() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    darsOption: '',
    uploadedFile: null,
    major: '',
    minor: '',
    graduationYear: '',
    graduationQuarter: ''
  });

  const totalSteps = 5;

  const handleNext = (data = {}) => {
    setProfileData({ ...profileData, ...data });

    // Check if we're on the last step
    if (currentStep === 5) {
      const finalData = { ...profileData, ...data };
      console.log('Profile setup completed!', finalData);

      // Create user account with the profile data
      signup({
        ...finalData,
        darsConnected: finalData.darsOption === 'sync',
        units: 0,
        gpa: 0.0
      });

      // Navigate to profile page
      navigate('/profile');
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleUploadClick = () => {
    setShowUploadModal(true);
  };

  const handleFileUpload = (file) => {
    setProfileData({ ...profileData, uploadedFile: file });
    console.log('DAR file uploaded!', { ...profileData, uploadedFile: file });
    setShowUploadModal(false);
    // Move to Academic Program after upload
    setCurrentStep(4);
  };

  const handleCompleteSetup = (data) => {
    setProfileData({ ...profileData, ...data });

    // If user chose to sync with DARS, show upload instructions
    if (data.darsOption === 'sync') {
      setCurrentStep(3.5); // Substep for DAR upload
    } else {
      // If manual entry, go to Academic Program
      setCurrentStep(4);
    }
  };

  return (
    <div className="profile-setup-container">
      <NavBar />

      <div className="profile-setup-content">
        <div className="profile-setup-header">
          <h1 className="profile-setup-title">Bruin Plan</h1>
          <p className="profile-setup-subtitle">Profile Setup</p>
        </div>

        {currentStep !== 3.5 && (
          <ProgressBar currentStep={Math.floor(currentStep)} totalSteps={totalSteps} />
        )}

        <div className="profile-setup-card-container">
          {currentStep === 1 && (
            <WelcomePage onNext={handleNext} />
          )}

          {currentStep === 2 && (
            <BasicInformation onNext={handleNext} onBack={handleBack} />
          )}

          {currentStep === 3 && (
            <ConnectDars onNext={handleCompleteSetup} onBack={handleBack} />
          )}

          {currentStep === 3.5 && (
            <DarUploadInstructions onUploadClick={handleUploadClick} />
          )}

          {currentStep === 4 && (
            <AcademicProgram onNext={handleNext} onBack={() => setCurrentStep(3)} />
          )}

          {currentStep === 5 && (
            <ExpectedGraduation onNext={handleNext} onBack={handleBack} />
          )}
        </div>
      </div>

      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={handleFileUpload}
      />
    </div>
  );
}

export default ProfileSetup;
