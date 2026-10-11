
import { useEffect, useRef } from "react";
import styles from "./SuccessStep.module.css";


interface SuccessStepProps {
  requestReference: string;
  phoneNumber?: string;
  approximatePrice?: string | number;
  onDone: () => void;
}

export default function SuccessStep({
  requestReference,
  phoneNumber,
  approximatePrice,
  onDone,
}: SuccessStepProps) {
  const hasPlayedSound = useRef(false);

  useEffect(() => {
    // Play the success chime only once when this screen mounts.
    if (hasPlayedSound.current) return;
    hasPlayedSound.current = true;

    let audioContext: AudioContext | null = null;

    const playSuccessChime = async () => {
      try {
        audioContext = new AudioContext();

        // Some browsers suspend audio until the user interacts
        // with the page. If playback is blocked, the page still works.
        if (audioContext.state === "suspended") {
          await audioContext.resume();
        }

        const context = audioContext;
        const startTime = context.currentTime;

        const playNote = (
          frequency: number,
          startAt: number,
          duration: number,
        ) => {
          const oscillator = context.createOscillator();
          const gain = context.createGain();

          oscillator.type = "sine";
          oscillator.frequency.setValueAtTime(
            frequency,
            startAt,
          );

          gain.gain.setValueAtTime(0.0001, startAt);
          gain.gain.exponentialRampToValueAtTime(
            0.16,
            startAt + 0.025,
          );
          gain.gain.exponentialRampToValueAtTime(
            0.0001,
            startAt + duration,
          );

          oscillator.connect(gain);
          gain.connect(context.destination);

          oscillator.start(startAt);
          oscillator.stop(startAt + duration);
        };

        // A gentle two-note confirmation ding.
        playNote(880, startTime, 0.24);
        playNote(1174.66, startTime + 0.11, 0.38);

        // Release browser audio resources after the chime.
        window.setTimeout(() => {
          void context.close().catch(() => {});
        }, 800);
      } catch {
        // Audio is optional. Never interrupt the success screen
        // if the browser blocks sound or audio is unavailable.
        if (audioContext && audioContext.state !== "closed") {
          void audioContext.close().catch(() => {});
        }
      }
    };

    void playSuccessChime();
  }, []);

  const formattedPrice =
    approximatePrice === undefined ||
    approximatePrice === null ||
    approximatePrice === ""
      ? null
      : typeof approximatePrice === "number"
        ? `KSh ${approximatePrice.toLocaleString("en-KE")}`
        : approximatePrice;

  return (
    <section
      className={styles.step}
      aria-labelledby="success-heading"
      aria-live="polite"
    >
      {/* CONFETTI */}
      <div className={styles.confetti} aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>

      {/* SUCCESS CHECKMARK */}
      <div
        className={styles.successIcon}
        aria-label="Request submitted successfully"
        role="img"
      >
        <span aria-hidden="true">✓</span>
      </div>

      {/* HEADING */}
      <div className={styles.heading}>
        <p className={styles.eyebrow}>REQUEST RECEIVED</p>

        <h2 id="success-heading">
          Request submitted successfully!
        </h2>

        <p>Thank you for choosing Techy On The Move.</p>
      </div>

      {/* REQUEST NUMBER */}
      <div className={styles.referenceCard}>
        <span className={styles.referenceLabel}>
          YOUR REQUEST NUMBER
        </span>

        <strong>{requestReference}</strong>

        <span className={styles.referenceHint}>
          Keep this number for reference.
        </span>
      </div>

      {/* APPROXIMATE PRICE */}
      {formattedPrice && (
        <div className={styles.priceCard}>
          <span className={styles.priceLabel}>
            APPROXIMATE SERVICE PRICE
          </span>

          <strong>{formattedPrice}</strong>

          <span className={styles.priceHint}>
            The final cost may depend on the issue and the work required.
          </span>
        </div>
      )}

      {/* CONFIRMATION MESSAGE */}
      <div className={styles.message}>
        <p className={styles.confirmationText}>
          Your request has been submitted.
        </p>

        <p>A Techy will be contacting you soon on</p>

        <strong className={styles.phoneNumber}>
          {phoneNumber || "the phone number you provided"}
        </strong>

        <p className={styles.finalMessage}>
          to confirm your request.
        </p>

      </div>

      {/* DONE BUTTON */}
      <button
        type="button"
        className={styles.doneButton}
        onClick={onDone}
      >
        Done
        <span aria-hidden="true">✓</span>
      </button>
    </section>
  );
}
