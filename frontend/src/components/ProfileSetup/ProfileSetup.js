import React, { useState } from 'react';
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
    password: '',
    email: '',
    darsOption: '',
    uploadedFile: null,
    major: '',
    minor: '',
    graduationYear: '',
    graduationQuarter: ''
  });

  const totalSteps = 5;

  const createUser = async (finalData) => {
    //calling backend to create a user in the supabase auth and userprofile tables
    try {
      console.log("Attempting to create user:", { finalData });
      const profile_name = finalData.firstName + " " + finalData.lastName;
      const int_year = Number(finalData.graduationYear)

      const formData = new FormData();
      formData.append('email', finalData.email);
      formData.append('password', finalData.password);
      formData.append('name', profile_name);
      formData.append('major', finalData.major);
      formData.append('minor', finalData.minor);
      formData.append('expected_grad', finalData.graduationQuarter);
      formData.append('year', int_year);

      if (finalData.uploadedFile) {
        formData.append('file', finalData.uploadedFile);
      }

      const response = await fetch('http://localhost:8000/api/auth/createUser/', {   //passwords passed via http endpoint which is not good, but django runs http so not sure how to work around this. For now testing with http 
        method: "POST",
        // headers: {
        //     'Content-Type': 'application/json' 
        // }, // Let browser set Content-Type for FormData
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        //TEMP FOR TESTING
        console.log("createUser response JSON:", data);
        localStorage.setItem("token", data.accessToken);

        const backendUserId =
          data.user?.id ?? data.id ?? data.user_id ?? data.profile?.id ?? null;

        if (!backendUserId) {
          console.error("No user id returned from backend. Response:", data);
          return;
        }
        // Create user account with the profile data
        signup({
          id: backendUserId,
          // IMPORTANT: map snake_case if your signup() expects it,
          // OR update signup() to accept camelCase.
          first_name: finalData.firstName,
          last_name: finalData.lastName,
          email: finalData.email,
          major: finalData.major,
          minor: finalData.minor,
          graduation_year: finalData.graduationYear,
          graduation_quarter: finalData.graduationQuarter,
          dars_connected: finalData.darsOption === "sync",
          units: 0,
          gpa: 0.0,
        });

        console.log("stored bruinplan_user:", localStorage.getItem("bruinplan_user"));
        navigate("/profile");
      }
      else {
        console.error("user creation failed:", data || "Unknown error");
      }
    }
    catch (error) {
      console.error("Error:", error)
    }
  }

  const handleNext = async (data = {}) => {
    setProfileData({ ...profileData, ...data });
    // Check if we're on the last step
    if (currentStep === 5) {
      const finalData = { ...profileData, ...data };
      await createUser(finalData)

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
