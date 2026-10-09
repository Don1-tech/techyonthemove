import styles from "./how-it-works.module.css";
import HowItWorksSteps from "./HowItWorksSteps";

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className={styles.howItWorks}
      aria-labelledby="how-it-works-heading"
    >
      <div className={styles.howItWorksInner}>
        <h2 id="how-it-works-heading" className={styles.sectionTitle}>
          HOW TO LET US KNOW YOU NEED A SERVICE
        </h2>

        <HowItWorksSteps />
      </div>
    </section>
  );
}