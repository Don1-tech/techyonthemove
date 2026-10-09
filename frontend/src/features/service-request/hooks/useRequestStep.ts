import { useState } from "react";

export default function useRequestStep() {
  const [step, setStep] = useState(1);

  const nextStep = () => {
    setStep((currentStep) => currentStep + 1);
  };

  const previousStep = () => {
    setStep((currentStep) => Math.max(1, currentStep - 1));
  };

  return {
    step,
    nextStep,
    previousStep,
  };
}