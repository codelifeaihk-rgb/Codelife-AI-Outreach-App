"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function OnboardingModal({
  isOpen,
  onClose,
  onComplete,
}: OnboardingModalProps) {
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  const steps = [
    {
      title: "Welcome to CodeLife Outreach",
      content: "This tool helps you find professors and decision-makers, generate personalized emails, and send them efficiently.",
    },
    {
      title: "Step 1: Create a Campaign",
      content: "Start by creating a campaign. Choose your target country and focus area (Biotech, AI in Biology, etc.).",
    },
    {
      title: "Step 2: Discover Contacts",
      content: "Find relevant professors and staff. We automatically score how good of a fit they are for CodeLife.ai.",
    },
    {
      title: "Step 3: Generate & Send Emails",
      content: "Generate AI-powered email drafts, review them, and send only after your approval. All emails go through your connected Gmail or Microsoft account.",
    },
  ];

  const currentStep = steps[step - 1];

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{currentStep.title}</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="text-slate-600">{currentStep.content}</p>
        </div>

        <div className="flex justify-between items-center">
          <Button variant="ghost" onClick={handleSkip}>
            Skip Tutorial
          </Button>

          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">
              {step} / {totalSteps}
            </span>
            <Button onClick={handleNext}>
              {step === totalSteps ? "Get Started" : "Next"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}