import { useState } from "react";

import styles from "./InformationLocationStep.module.css";

interface InformationLocationStepProps {
  value?: {
    fullName?: string;
    phone?: string;
    email?: string;
    location?: string;
    directions?: string;
  };

  onBack: () => void;

  onContinue: (information: {
    fullName: string;
    phone: string;
    email: string;
    location: string;
    directions: string;
  }) => void;
}

export default function InformationLocationStep({
  value,
  onBack,
  onContinue,
}: InformationLocationStepProps) {
  const [fullName, setFullName] = useState(value?.fullName ?? "");
  const [phone, setPhone] = useState(value?.phone ?? "");
  const [email, setEmail] = useState(value?.email ?? "");
  const [location, setLocation] = useState(value?.location ?? "");
  const [directions, setDirections] = useState(
    value?.directions ?? ""
  );

  const canContinue =
    fullName.trim().length >= 2 &&
    phone.trim().length >= 7 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) &&
    location.trim().length >= 2;

  const handleContinue = () => {
    if (!canContinue) {
      return;
    }

    onContinue({
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      location: location.trim(),
      directions: directions.trim(),
    });
  };

  return (
    <div className={styles.step}>
      {/* =====================================================
          HEADING
          ===================================================== */}

      <div className={styles.heading}>
  

        <h2>
          Tell us how to reach you and where the service is needed.
        </h2>
      </div>

      {/* =====================================================
          CONTENT
          ===================================================== */}

      <div className={styles.content}>
        {/* ===================================================
            CONTACT INFORMATION
            =================================================== */}

        <div className={styles.contactGrid}>
          {/* FULL NAME */}

          <div className={styles.fieldGroup}>
            <label htmlFor="full-name">
              Full name
              <span className={styles.required}>*</span>
            </label>

            <input
              id="full-name"
              type="text"
              className={styles.input}
              value={fullName}
              onChange={(event) =>
                setFullName(event.target.value)
              }
              placeholder="Enter your full name"
              autoComplete="name"
              maxLength={100}
            />
          </div>

          {/* PHONE */}

          <div className={styles.fieldGroup}>
            <label htmlFor="phone">
              Phone number
              <span className={styles.required}>*</span>
            </label>

            <input
              id="phone"
              type="tel"
              className={styles.input}
              value={phone}
              onChange={(event) =>
                setPhone(event.target.value)
              }
              placeholder="e.g. 0712 345 678"
              autoComplete="tel"
              maxLength={20}
            />
          </div>

          {/* EMAIL */}

          <div className={styles.fieldGroup}>
            <label htmlFor="email">
              Email address
              <span className={styles.required}>*</span>
            </label>

            <input
              id="email"
              type="email"
              className={styles.input}
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="you@example.com"
              autoComplete="email"
              maxLength={150}
            />
          </div>
        </div>

        {/* ===================================================
            LOCATION
            =================================================== */}

        <div className={styles.locationSection}>
          <div className={styles.sectionTitle}>
            Service location
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="service-location">
              Location / address
              <span className={styles.required}>*</span>
            </label>

            <input
              id="service-location"
              type="text"
              className={styles.input}
              value={location}
              onChange={(event) =>
                setLocation(event.target.value)
              }
              placeholder="Enter the location where the service is needed"
              autoComplete="street-address"
              maxLength={200}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="directions">
              Directions or landmark
              <span className={styles.optional}>
                (optional)
              </span>
            </label>

            <textarea
              id="directions"
              className={`${styles.input} ${styles.directions}`}
              value={directions}
              onChange={(event) =>
                setDirections(event.target.value)
              }
              placeholder="e.g. Near the main gate, opposite the shopping centre..."
              maxLength={300}
            />

         </div>
        </div>
      </div>

      {/* =====================================================
          ACTION BAR
          ===================================================== */}

      <div className={styles.actionBar}>
        <button
          type="button"
          className={styles.backButton}
          onClick={onBack}
        >
          ← Back
        </button>

        <button
          type="button"
          className={styles.continueButton}
          disabled={!canContinue}
          onClick={handleContinue}
        >
          Continue →
        </button>
      </div>
    </div>
  );
}