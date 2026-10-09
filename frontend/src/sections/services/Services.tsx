import styles from "./services.module.css";
import ServicesGrid from "./ServicesGrid";

export default function Services() {
  return (
    <section
      id="services"
      className={styles.services}
      aria-labelledby="services-heading"
    >
      <div className={styles.servicesInner}>
        <h2 id="services-heading" className={styles.sectionTitle}>
          OUR SERVICES
        </h2>

        <ServicesGrid />
      </div>
    </section>
  );
}