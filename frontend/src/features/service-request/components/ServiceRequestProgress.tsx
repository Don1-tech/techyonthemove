import styles from "../ServiceRequestModal.module.css";

interface ServiceRequestProgressProps {
  currentStep: number;
  totalSteps: number;
}

export default function ServiceRequestProgress({
  currentStep,
  totalSteps,
}: ServiceRequestProgressProps) {
  return (
    <div className={styles.progressArea}>
      <div
        className={styles.progressStepper}
        aria-label={`Step ${currentStep} of ${totalSteps}`}
      >
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;

          return (
            <div
              key={stepNumber}
              className={styles.progressItem}
            >
              <span
                className={[
                  styles.progressCircle,
                  isActive ? styles.progressCircleActive : "",
                  isCompleted ? styles.progressCircleCompleted : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {stepNumber}
              </span>

              {stepNumber < totalSteps && (
                <span className={styles.progressLine} />
              )}
            </div>
          );
        })}
      </div>

      <span className={styles.progressLabel}>
        {currentStep} of {totalSteps}
      </span>
    </div>
  );
}