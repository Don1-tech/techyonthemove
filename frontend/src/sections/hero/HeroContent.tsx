import styles from "./hero.module.css";
import RotatingClaim from "./RotatingClaim";

export default function HeroContent() {
  return (
    <div className={styles.headlineArea}>
      <h1
        id="hero-heading"
        className={styles.headline}
      >
        <RotatingClaim />
      </h1>
    </div>
  );
}