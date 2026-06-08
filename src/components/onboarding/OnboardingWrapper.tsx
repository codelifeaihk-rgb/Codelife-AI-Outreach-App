"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import OnboardingModal from "./OnboardingModal";

export default function OnboardingWrapper() {
  const { user, isLoaded } = useUser();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!isLoaded || !user) return;

    // Check if user has completed onboarding
    const hasCompleted = user.publicMetadata?.hasCompletedOnboarding;

    if (!hasCompleted) {
      setShowOnboarding(true);
    }
  }, [user, isLoaded]);

  const handleCompleteOnboarding = async () => {
    setShowOnboarding(false);

    // Update Clerk metadata
    await user?.update({
      unsafeMetadata: {
        hasCompletedOnboarding: true,
      },
    });
  };

  return (
    <OnboardingModal
      isOpen={showOnboarding}
      onClose={() => setShowOnboarding(false)}
      onComplete={handleCompleteOnboarding}
    />
  );
}