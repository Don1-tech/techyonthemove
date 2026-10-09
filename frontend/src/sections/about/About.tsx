
import styles from "./about.module.css";
import AboutRow from "./AboutRow";

import premiseImage from "../../assets/images/about_us/techonpremise.jpg";
import internetImage from "../../assets/images/about_us/internetna.jpg";

const whoWeArePoints = [
  "We are a computer networks and hardware support team, working to ensure your computer devices and networks are working.",
  "We operate accross Nairobi and Kiambu.",
  "Whether you are at home, in an office, or somewhere a little harder to reach, we come to you and work around your needs. Nowhere is too far.",
];

const schedulePoints = [
  "You are in control of the Schedule. We Work Around You.",
  "Plan your visit ahead of time, we provide three time slots in a day and booking s open for upto 7 days",
  "Just choose the time that works best for you in the service booking section, get your booking confirmed, and we'll be ready to get to work.",
];

export default function About() {
  return (
    <section
      id="about"
      className={styles.about}
      aria-labelledby="about-heading"
    >
      <div className={styles.aboutInner}>
        <h2 id="about-heading" className={styles.sectionTitle}>
          ABOUT US
        </h2>

        <div className={styles.rows}>
          <AboutRow
            image={premiseImage}
            imageAlt="Techy On The Move technician providing on-premise technology support"
            label="WHO WE ARE"
            points={whoWeArePoints}
            imagePosition="left"
          />

          <AboutRow
            image={internetImage}
            imageAlt="Television showing no signal with a network router nearby"
            points={schedulePoints}
            imagePosition="right"
          />
        </div>
      </div>
    </section>
  );
};