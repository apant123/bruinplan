import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import BasicInformation from "../components/ProfileSetup/BasicInformation";
import { useAuth } from "../contexts/AuthContext";
import { apiUpdateProfile } from "../api/auth";

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const { accessToken, setProfile } = useAuth(); // setProfile optional if your context supports it

  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const next = (partial) => {
    setDraft((prev) => ({ ...prev, ...partial }));
    setStep((s) => s + 1);
  };

  const back = () => setStep((s) => Math.max(0, s - 1));

  const finish = async (finalPartial = {}) => {
    if (!accessToken) {
      setSubmitError("Not authenticated. Please log in again.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      const finalDraft = { ...draft, ...finalPartial };

      // Map wizard fields -> backend fields
      // Your backend expects "name" not firstName/lastName.
      const payload = {
        name: `${finalDraft.firstName} ${finalDraft.lastName}`.trim(),
        // You can store email in Supabase auth; if your UserProfile has email, include it.
        // email: finalDraft.email,
      };

      const updatedProfile = await apiUpdateProfile(accessToken, payload);

      // Update context if you have it
      if (typeof setProfile === "function") setProfile(updatedProfile);

      navigate("/profile");
    } catch (e) {
      setSubmitError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Since you only have step 0 right now, treat "Next" as final submit.
  if (step === 0) {
    return (
      <div>
        <BasicInformation
          initialData={draft}
          onBack={back}
          onNext={(partial) => {
            // Instead of moving to step 1, submit now (until you add more steps)
            setDraft((prev) => ({ ...prev, ...partial }));
            finish(partial);
          }}
        />

        {submitting && <div style={{ marginTop: 12 }}>Saving profile…</div>}
        {submitError && (
          <div style={{ marginTop: 12, color: "red" }}>{submitError}</div>
        )}
      </div>
    );
  }

  // Placeholder for future steps
  return (
    <div>
      <pre>{JSON.stringify(draft, null, 2)}</pre>
      <button onClick={back} disabled={submitting}>Back</button>
      <button onClick={() => finish()} disabled={submitting}>Finish</button>
      {submitError && <div style={{ marginTop: 12, color: "red" }}>{submitError}</div>}
    </div>
  );
}
