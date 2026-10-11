import { useEffect, useRef, useState } from "react";

import type { VerificationChallenge } from "../../../api/requestsApi";
import styles from "./PhoneVerificationModal.module.css";

interface PhoneVerificationModalProps {
  challenge: VerificationChallenge;
  phoneNumber: string;
  error: string;
  busy: boolean;
  onVerify: (code: string) => void;
  onResend: () => void;
  onCancel: () => void;
}

function formatRemaining(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function PhoneVerificationModal({
  challenge,
  phoneNumber,
  error,
  busy,
  onVerify,
  onResend,
  onCancel,
}: PhoneVerificationModalProps) {
  const dialogRef = useRef<HTMLElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [code, setCode] = useState("");
  const [now, setNow] = useState<number | null>(null);
  const expiresAt = new Date(challenge.expiresAt).getTime();
  const resendAt = new Date(challenge.resendAt).getTime();
  const currentTime = now ?? expiresAt - 10 * 60 * 1000;
  const expired = currentTime >= expiresAt;
  const resendSeconds = Math.max(
    0,
    Math.ceil((resendAt - currentTime) / 1000)
  );

  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
    const timer = window.setInterval(() => setNow(Date.now()), 1000);

    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          "button:not([disabled]), input:not([disabled])"
        )
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (
        event.shiftKey &&
        (document.activeElement === first ||
          !dialogRef.current.contains(document.activeElement))
      ) {
        event.preventDefault();
        last?.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last ||
          !dialogRef.current.contains(document.activeElement))
      ) {
        event.preventDefault();
        first?.focus();
      }
    };

    document.addEventListener("keydown", trapFocus);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("keydown", trapFocus);
    };
  }, []);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!busy && !expired && /^\d{6}$/.test(code)) {
      onVerify(code);
    }
  };

  return (
    <div className={styles.overlay}>
      <section
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="phone-verification-title"
        aria-describedby="phone-verification-description"
      >
        <div className={styles.icon} aria-hidden="true">
          <span>✓</span>
        </div>

        <h2 id="phone-verification-title">
          Verify your phone number
        </h2>

        <p id="phone-verification-description" className={styles.description}>
          Enter the six-digit verification code sent by SMS to{" "}
          <strong>{phoneNumber}</strong>.
        </p>

        <form onSubmit={handleSubmit}>
          <label className={styles.codeLabel} htmlFor="phone-verification-code">
            Verification code
          </label>
          <input
            ref={inputRef}
            id="phone-verification-code"
            className={styles.codeInput}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            value={code}
            onChange={(event) =>
              setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
            }
            aria-invalid={Boolean(error)}
            aria-describedby={
              error ? "phone-verification-error" : "phone-verification-timer"
            }
            readOnly={busy || expired}
          />

          <p
            id="phone-verification-timer"
            className={expired ? styles.expired : styles.timer}
            role="timer"
          >
            {expired
              ? "This code has expired."
              : `Code expires in ${formatRemaining(expiresAt - currentTime)}`}
          </p>

          {error && (
            <p
              id="phone-verification-error"
              className={styles.error}
              role="alert"
              aria-live="assertive"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            className={styles.verifyButton}
            disabled={busy || expired || code.length !== 6}
            aria-busy={busy}
          >
            {busy ? "Verifying..." : "Verify"}
          </button>
        </form>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.resendButton}
            onClick={onResend}
            disabled={busy || expired || resendSeconds > 0}
          >
            {resendSeconds > 0
              ? `Resend code in ${resendSeconds}s`
              : "Resend code"}
          </button>

          <button
            type="button"
            className={styles.cancelButton}
            onClick={onCancel}
            disabled={busy}
          >
            Cancel
          </button>
        </div>
      </section>
    </div>
  );
}
