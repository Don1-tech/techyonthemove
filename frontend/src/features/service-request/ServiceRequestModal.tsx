
import { useCallback, useEffect, useRef, useState } from "react";

import styles from "./ServiceRequestModal.module.css";

import CategoryStep, {
  type ServiceCategory,
} from "./components/CategoryStep";

import IssueStep from "./components/IssueStep";

import InformationLocationStep from "./components/InformationLocationStep";

import AvailabilityStep from "./components/AvailabilityStep";

import ConfirmationStep from "./components/ConfirmationStep";

import SuccessStep from "./components/SuccessStep";

import ServiceRequestHeader from "./components/ServiceRequestHeader";
import ServiceRequestProgress from "./components/ServiceRequestProgress";
import {
  cancelRequestVerification,
  resendRequestVerification,
  startRequestVerification,
  verifyRequestPhone,
  type VerificationChallenge,
} from "../../api/requestsApi";
import PhoneVerificationModal from "./components/PhoneVerificationModal";

interface ServiceRequestModalProps {
  open: boolean;
  onClose: () => void;
}

interface CustomerInformation {
  fullName: string;
  phone: string;
  email: string;
  location: string;
  directions: string;
}

export default function ServiceRequestModal({
  open,
  onClose,
}: ServiceRequestModalProps) {
  if (!open) {
    return null;
  }

  return <ServiceRequestDialog onClose={onClose} />;
}

function ServiceRequestDialog({
  onClose,
}: Pick<ServiceRequestModalProps, "onClose">) {
  const dialogRef = useRef<HTMLElement | null>(null);
  const modalBodyRef = useRef<HTMLDivElement | null>(null);

  const [currentStep, setCurrentStep] = useState(1);

  const [selectedCategory, setSelectedCategory] =
    useState<ServiceCategory | null>(null);

  const [issueDetails, setIssueDetails] = useState("");

  const [customerInformation, setCustomerInformation] =
    useState<CustomerInformation>({
      fullName: "",
      phone: "",
      email: "",
      location: "",
      directions: "",
    });

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  /*
   * Price comes from the selected service returned
   * by the backend.
   */
  const [approximatePrice, setApproximatePrice] =
    useState<number | null>(null);

  /*
   * Controls the processing state on Step 5.
   */
  const [isSubmitting, setIsSubmitting] = useState(false);

  /*
   * Stores any submission error shown on Step 5.
   */
  const [submitError, setSubmitError] = useState("");

  const [requestReference, setRequestReference] =
    useState("");

  const [verificationChallenge, setVerificationChallenge] =
    useState<
      (VerificationChallenge & { idempotencyKey: string }) | null
    >(null);
  const [verificationError, setVerificationError] = useState("");

  const handleCloseRequest = useCallback(async () => {
    if (isSubmitting) {
      return;
    }

    if (verificationChallenge) {
      try {
        await cancelRequestVerification(
          verificationChallenge.verificationId
        );
      } catch {
        setVerificationError(
          "We couldn't cancel verification. No request was created; the code will expire automatically. Please try Cancel again."
        );
        return;
      }
      setVerificationChallenge(null);
    }

    onClose();
  }, [isSubmitting, onClose, verificationChallenge]);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const previousBodyOverflow = document.body.style.overflow;

    const previousRootOverflow =
      document.documentElement.style.overflow;

    const focusableSelector = [
      "button:not([disabled])",
      "a[href]",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      "[tabindex]:not([tabindex='-1'])",
    ].join(", ");

    const getFocusableElements = () =>
      Array.from(
        dialog.querySelectorAll<HTMLElement>(focusableSelector)
      ).filter(
        (element) =>
          element.getAttribute("aria-hidden") !== "true" &&
          element.getClientRects().length > 0
      );

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    dialog
      .querySelector<HTMLElement>(
        '[aria-label="Close request service"]'
      )
      ?.focus({ preventScroll: true });

    const handleTab = (event: KeyboardEvent) => {
      if (event.key !== "Tab") {
        return;
      }

      const focusableElements = getFocusableElements();

      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];

      const lastElement =
        focusableElements[focusableElements.length - 1];

      const activeElement = document.activeElement;

      if (
        event.shiftKey &&
        (activeElement === firstElement ||
          !dialog.contains(activeElement))
      ) {
        event.preventDefault();
        lastElement.focus();
      } else if (
        !event.shiftKey &&
        (activeElement === lastElement ||
          !dialog.contains(activeElement))
      ) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    const handleFocusIn = (event: FocusEvent) => {
      if (
        event.target instanceof Node &&
        !dialog.contains(event.target)
      ) {
        dialog
          .querySelector<HTMLElement>(
            '[aria-label="Close request service"]'
          )
          ?.focus({ preventScroll: true });
      }
    };

    document.addEventListener("keydown", handleTab);
    document.addEventListener("focusin", handleFocusIn);

    return () => {
      document.removeEventListener("keydown", handleTab);
      document.removeEventListener("focusin", handleFocusIn);

      document.body.style.overflow = previousBodyOverflow;

      document.documentElement.style.overflow =
        previousRootOverflow;

      if (previouslyFocused?.isConnected) {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
  }, []);

  useEffect(() => {
    const firstStepControl =
      modalBodyRef.current?.querySelector<HTMLElement>(
        [
          "button:not([disabled])",
          "input:not([disabled])",
          "select:not([disabled])",
          "textarea:not([disabled])",
          "[tabindex]:not([tabindex='-1'])",
        ].join(", ")
      );

    firstStepControl?.focus({ preventScroll: true });
  }, [currentStep]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      /*
       * Do not allow Escape to close the modal while
       * a request is actively being submitted.
       */
      if (event.key === "Escape" && !isSubmitting) {
        void handleCloseRequest();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [handleCloseRequest, isSubmitting]);

  const handleOverlayClick = (
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    /*
     * Only close when the actual overlay is clicked.
     * Clicking inside the modal does nothing.
     */
    if (
      event.target === event.currentTarget &&
      !isSubmitting
    ) {
      void handleCloseRequest();
    }
  };

  /* =========================================================
     STEP 1 — SERVICE CATEGORY
     ========================================================= */

  const handleCategorySelect = (
    category: ServiceCategory
  ) => {
    setSelectedCategory(category);

    /*
     * The price comes directly from the backend
     * service object.
     */
    setApproximatePrice(category.basePrice);
  };

  const handleCategoryContinue = () => {
    if (!selectedCategory) {
      return;
    }

    setCurrentStep(2);
  };

  /* =========================================================
     STEP 2 — ISSUE
     ========================================================= */

  const handleIssueBack = () => {
    setCurrentStep(1);
  };

  const handleIssueContinue = (details: string) => {
    setIssueDetails(details);
    setCurrentStep(3);
  };

  /* =========================================================
     STEP 3 — CUSTOMER INFORMATION & LOCATION
     ========================================================= */

  const handleInformationBack = () => {
    setCurrentStep(2);
  };

  const handleInformationContinue = (
    information: CustomerInformation
  ) => {
    setCustomerInformation(information);
    setCurrentStep(4);
  };

  /* =========================================================
     STEP 4 — DATE & TIME
     ========================================================= */

  const handleAvailabilityBack = () => {
    setCurrentStep(3);
  };

  const handleAvailabilityContinue = (
    date: string,
    time: string
  ) => {
    setSelectedDate(date);
    setSelectedTime(time);

    setCurrentStep(5);
  };

  /* =========================================================
     STEP 5 — CONFIRM REQUEST
     ========================================================= */

  const handleConfirmRequest = async () => {
    /*
     * Prevent duplicate submissions.
     */
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");
    setVerificationError("");

    try {
      if (!selectedCategory) {
        throw new Error(
          "Select a service before confirming your request."
        );
      }

      const challenge = await startRequestVerification({
        serviceId: selectedCategory.id,
        issueDetails,
        fullName: customerInformation.fullName,
        phone: customerInformation.phone,
        email: customerInformation.email,
        location: customerInformation.location,
        directions: customerInformation.directions,
        requestedDate: selectedDate,
        requestedTime: selectedTime,
      });

      setVerificationChallenge({
        ...challenge,
        idempotencyKey: crypto.randomUUID(),
      });
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "We could not submit your request. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyCode = async (code: string) => {
    if (!verificationChallenge || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setVerificationError("");

    try {
      const createdRequest = await verifyRequestPhone(
        verificationChallenge.verificationId,
        code,
        verificationChallenge.idempotencyKey
      );
      setRequestReference(createdRequest.reference);
      setApproximatePrice(createdRequest.approximatePrice);
      setVerificationChallenge(null);
      setCurrentStep(6);
    } catch (error) {
      setVerificationError(
        error instanceof Error
          ? error.message
          : "We could not verify your phone number. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    if (!verificationChallenge || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setVerificationError("");

    try {
      const challenge = await resendRequestVerification(
        verificationChallenge.verificationId
      );
      setVerificationChallenge({
        ...challenge,
        idempotencyKey: verificationChallenge.idempotencyKey,
      });
    } catch (error) {
      setVerificationError(
        error instanceof Error
          ? error.message
          : "We could not resend the verification code."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelVerification = async () => {
    if (!verificationChallenge || isSubmitting) {
      return;
    }

    try {
      await cancelRequestVerification(
        verificationChallenge.verificationId
      );
      setVerificationChallenge(null);
      setVerificationError("");
      setSubmitError(
        "Phone verification was cancelled. Your request has not been submitted."
      );
    } catch (error) {
      setVerificationError(
        error instanceof Error
          ? error.message
          : "We couldn't cancel verification. Please try again."
      );
    }
  };

  /* =========================================================
     STEP 6 — SUCCESS
     ========================================================= */

  const handleSuccessDone = () => {
    void handleCloseRequest();
  };

  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <div
      className={styles.modalOverlay}
      onMouseDown={handleOverlayClick}
      role="presentation"
    >
      <section
        ref={dialogRef}
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="request-service-title"
        aria-label="Request a service"
      >
        <ServiceRequestHeader onClose={() => void handleCloseRequest()} />

        <ServiceRequestProgress
          currentStep={currentStep}
          totalSteps={6}
        />

        <div ref={modalBodyRef} className={styles.modalBody}>
          {/* =================================================
              STEP 1 — SERVICE CATEGORY
              ================================================= */}

          {currentStep === 1 && (
            <CategoryStep
              selectedCategory={selectedCategory?.id ?? null}
              onSelectCategory={handleCategorySelect}
              onContinue={handleCategoryContinue}
            />
          )}

          {/* =================================================
              STEP 2 — ISSUE
              ================================================= */}

          {currentStep === 2 && (
            <IssueStep
              value={issueDetails}
              onBack={handleIssueBack}
              onContinue={handleIssueContinue}
            />
          )}

          {/* =================================================
              STEP 3 — CUSTOMER INFORMATION & LOCATION
              ================================================= */}

          {currentStep === 3 && (
            <InformationLocationStep
              value={customerInformation}
              onBack={handleInformationBack}
              onContinue={handleInformationContinue}
            />
          )}

          {/* =================================================
              STEP 4 — DATE & TIME
              ================================================= */}

          {currentStep === 4 && (
            <AvailabilityStep
              value={{
                date: selectedDate,
                time: selectedTime,
              }}
              onBack={handleAvailabilityBack}
              onContinue={handleAvailabilityContinue}
            />
          )}

          {/* =================================================
              STEP 5 — CONFIRMATION
              ================================================= */}

          {currentStep === 5 && (
            <ConfirmationStep
              serviceName={selectedCategory?.name ?? ""}
              issueDetails={issueDetails}
              fullName={customerInformation.fullName}
              phone={customerInformation.phone}
              email={customerInformation.email}
              location={customerInformation.location}
              directions={customerInformation.directions}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              approximatePrice={approximatePrice}
              submitting={isSubmitting}
              error={submitError}
              onBack={() => setCurrentStep(4)}
              onConfirm={handleConfirmRequest}
            />
          )}

          {/* =================================================
              STEP 6 — SUCCESS
              ================================================= */}

          {currentStep === 6 && (
            <SuccessStep
              requestReference={requestReference}
              phoneNumber={customerInformation.phone}
              approximatePrice={approximatePrice ?? undefined}
              onDone={handleSuccessDone}
            />
          )}
        </div>

        {verificationChallenge && (
          <PhoneVerificationModal
            key={verificationChallenge.expiresAt}
            challenge={verificationChallenge}
            phoneNumber={customerInformation.phone}
            error={verificationError}
            busy={isSubmitting}
            onVerify={handleVerifyCode}
            onResend={handleResendCode}
            onCancel={handleCancelVerification}
          />
        )}
      </section>
    </div>
  );
}
