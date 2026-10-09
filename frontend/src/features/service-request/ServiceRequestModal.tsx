
import { useEffect, useState } from "react";

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
import { createRequest } from "../../api/requestsApi";

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

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      /*
       * Do not allow Escape to close the modal while
       * a request is actively being submitted.
       */
      if (event.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose, isSubmitting]);

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
      onClose();
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

    try {
      if (!selectedCategory) {
        throw new Error("Select a service before confirming your request.");
      }

      const createdRequest = await createRequest({
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

      setRequestReference(createdRequest.reference);

      setCurrentStep(6);
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

  /* =========================================================
     STEP 6 — SUCCESS
     ========================================================= */

  const handleSuccessDone = () => {
    onClose();
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
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="request-service-title"
      >
        <ServiceRequestHeader onClose={onClose} />

        <ServiceRequestProgress
          currentStep={currentStep}
          totalSteps={6}
        />

        <div className={styles.modalBody}>
          {/* =================================================
              STEP 1
              ================================================= */}

          {currentStep === 1 && (
            <CategoryStep
              selectedCategory={
                selectedCategory?.id ?? null
              }
              onSelectCategory={handleCategorySelect}
              onContinue={handleCategoryContinue}
            />
          )}

          {/* =================================================
              STEP 2
              ================================================= */}

          {currentStep === 2 && (
            <IssueStep
              value={issueDetails}
              onBack={handleIssueBack}
              onContinue={handleIssueContinue}
            />
          )}

          {/* =================================================
              STEP 3
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
              onContinue={
                handleAvailabilityContinue
              }
            />
          )}

          {/* =================================================
              STEP 5 — CONFIRMATION
              ================================================= */}

          {currentStep === 5 && (
            <ConfirmationStep
              serviceName={
                selectedCategory?.name ?? ""
              }
              issueDetails={issueDetails}
              fullName={
                customerInformation.fullName
              }
              phone={customerInformation.phone}
              email={customerInformation.email}
              location={
                customerInformation.location
              }
              directions={
                customerInformation.directions
              }
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
              email={customerInformation.email}
              onDone={handleSuccessDone}
            />
          )}
        </div>
      </section>
    </div>
  );
}
