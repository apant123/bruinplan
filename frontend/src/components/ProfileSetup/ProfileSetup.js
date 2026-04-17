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
  const { signup, isAuthenticated } = useAuth();
  
  const [searchParams] = useState(new URLSearchParams(window.location.search));
  const isGoogle = searchParams.get('google') === 'true';
  const googleEmail = searchParams.get('email') || '';
  const googleName = searchParams.get('name') || '';

  const [currentStep, setCurrentStep] = useState(isGoogle ? 2 : 1);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  
  // If the user is authenticated, we are deliberately redirecting 
  // so lock the UI into creating mode to suppress unmount flickers
  const isNavigating = isCreatingUser || isAuthenticated;

  const [profileData, setProfileData] = useState({
    firstName: isGoogle && googleName ? googleName.split(' ')[0] : '',
    lastName: isGoogle && googleName ? googleName.split(' ').slice(1).join(' ') : '',
    password: '',
    email: isGoogle && googleEmail ? googleEmail : '',
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

      const endpoint = isGoogle 
        ? `${API_BASE}/api/auth/createProfile/` 
        : `${API_BASE}/api/auth/createUser/`;

      const fetchOptions = {
        method: "POST",
        body: formData,
      };

      if (isGoogle) {
          const token = localStorage.getItem("accessToken");
          if (token) {
              fetchOptions.headers = {
                  "Authorization": "Bearer " + token
              };
          }
      }

      const response = await fetch(endpoint, fetchOptions);

      const data = await response.json();
      if (response.ok) {
        //TEMP FOR TESTING
        console.log("createUser response JSON:", data);
        localStorage.setItem("token", data.accessToken);

        const backendUserId =
          data.user?.id ?? data.id ?? data.user_id ?? data.profile?.id ?? null;

        if (!backendUserId) {
          console.error("No user id returned from backend. Response:", data);
          alert("Error: No user ID returned from backend.");
          return;
        }
        // ... (rest of success logic)
        signup({
          id: backendUserId,
          first_name: finalData.firstName,
          last_name: finalData.lastName,
          email: finalData.email,
          major: data.user?.major || finalData.major,
          minor: data.user?.minor || finalData.minor,
          graduation_year: data.user?.graduation_year || finalData.graduationYear,
          graduation_quarter: data.user?.graduation_quarter || finalData.graduationQuarter,
          dars_connected: data.user?.dars_connected ?? (finalData.darsOption === "sync"),
          units: data.user?.units || 0,
          total_units: data.user?.total_units || 0,
          gpa: data.user?.gpa || 0.0,
        });

        console.log("stored bruinplan_user:", localStorage.getItem("bruinplan_user"));
        navigate("/profile");
        return true;
      }
      else {
        console.error("user creation failed:", data || "Unknown error");
        // The user explicitly requested to remove the alert if the backend duplicate-email trigger fires, as it works as expected on their end.
        return false;
      }
    }
    catch (error) {
      console.error("Error:", error)
      return false;
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

  const handleFileUpload = async (file) => {
    const finalData = { ...profileData, uploadedFile: file };
    setProfileData(finalData);
    console.log('DAR file uploaded!', finalData);
    setShowUploadModal(false);
    
    // Move immediately to account creation if DARS is uploaded
    setIsCreatingUser(true);
    const success = await createUser(finalData);
    if (!success && !isAuthenticated) {
      setIsCreatingUser(false);
    }
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

        {currentStep !== 3.5 && !isCreatingUser && (
          <ProgressBar currentStep={Math.floor(currentStep)} totalSteps={totalSteps} />
        )}

        {isNavigating ? (
          <div className="loading-card" style={{ 
            display: "flex", 
            flexDirection: "column", 
            alignItems: "center", 
            justifyContent: "center", 
            gap: "20px", 
            padding: "40px",
            backgroundColor: "white",
            borderRadius: "16px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
            width: "550px",
            marginTop: "20px"
          }}>
            <h2 style={{ margin: 0, color: "#247ad6", fontFamily: 'Inter', fontWeight: 600 }}>Building Your Profile</h2>
            <p style={{ margin: 0, color: "#666", textAlign: "center", lineHeight: "1.6", fontSize: "16px" }}>
              We're analyzing your DARS text to instantly set up your major, minor, and graduation parameters...
            </p>
            <div className="spinner-container" style={{ position: "relative", width: "64px", height: "64px", marginTop: "15px" }}>
              <style>
                {`
                  @keyframes dash {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                  @keyframes pulse-cap {
                    0% { transform: translate(-50%, -50%) scale(0.9); opacity: 0.8; }
                    50% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
                    100% { transform: translate(-50%, -50%) scale(0.9); opacity: 0.8; }
                  }
                `}
              </style>
              <div style={{
                position: "absolute",
                top: 0, left: 0, right: 0, bottom: 0,
                border: "4px solid #f3f3f3",
                borderTop: "4px solid #247ad6",
                borderRadius: "50%",
                animation: "dash 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite"
              }} />
              <div style={{
                position: "absolute",
                top: "50%", left: "50%",
                animation: "pulse-cap 2s ease-in-out infinite",
                fontSize: "1.5rem"
              }}>
                🎓
              </div>
            </div>
          </div>
        ) : (
          <div className="profile-setup-card-container">
          {currentStep === 1 && (
            <WelcomePage onNext={handleNext} />
          )}

          {currentStep === 2 && (
            <BasicInformation onNext={handleNext} onBack={handleBack} isGoogle={isGoogle} initialData={profileData} />
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
        )}
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
