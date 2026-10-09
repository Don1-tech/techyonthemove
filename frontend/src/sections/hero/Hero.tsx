import styles from "./hero.module.css";

import HeroContent from "./HeroContent";
import HeroImage from "./HeroImage";

export default function Hero() {
  return (
    <section
      id="home"
      className={styles.hero}
      aria-labelledby="hero-heading"
    >
      <div className={styles.heroInner}>

        {/* Main headline */}
        <HeroContent />

        {/* Hero images */}
        <HeroImage />

      </div>
    </section>
  );
}