import { useEffect, useState } from "react";
import styles from "./hero.module.css";

const claims = [
  "EXPERIENCING WEAK WI-FI SIGNALS?",
  "NEED A GAMING PC BUILD?",
  "HAVING NETWORK CONNECTION PROBLEMS?",
  "SMART GADGETS ACTING UP?",
];

const ROTATION_INTERVAL = 30000;

export default function RotatingClaim() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setVisible(false);

      window.setTimeout(() => {
        setCurrentIndex(
          (current) =>
            (current + 1) % claims.length,
        );

        setVisible(true);
      }, 300);
    }, ROTATION_INTERVAL);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  return (
    <span
      className={`${styles.rotatingText} ${
        !visible
          ? styles.rotatingTextHidden
          : ""
      }`}
    >
      {claims[currentIndex]}
    </span>
  );
}