import styles from "./footer.module.css";

import locationIcon from "../../assets/images/icons/location.png";

const locations = ["NAIROBI", "KIAMBU"];

export default function FooterCoverage() {
  return (
    <div className={styles.coverageColumn}>
      <h2 className={styles.columnHeading}>
        WE ARE HERE WHEN YOU NEED US
      </h2>

      <p className={styles.coverageSubheading}>
        WE BRING TECH SUPPORT WHEREVER YOU ARE IN:
      </p>

      <div className={styles.locations}>
        {locations.map((location) => (
          <div
            key={location}
            className={styles.locationItem}
          >
            <img
              src={locationIcon}
              alt=""
              aria-hidden="true"
              className={styles.locationIcon}
            />

            <span>{location}</span>
          </div>
        ))}
      </div>
    </div>
  );
}