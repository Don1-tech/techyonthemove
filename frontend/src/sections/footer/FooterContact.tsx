import styles from "./footer.module.css";

export default function FooterContact() {
  return (
    <div className={styles.contactColumn}>
      <h2 className={styles.columnHeading}>
        CONTACT US
      </h2>

      <div className={styles.contactItems}>
        <a
          href="athmanlaure@gmail.com"
          className={styles.contactItem}
        >
          <span
            className={styles.contactIcon}
            aria-hidden="true"
          >
            @
          </span>

          <span>athmanlaure@gmail.com</span>
        </a>

        <a
          href="tel:0757000390"
          className={styles.contactItem}
        >
          <span
            className={styles.contactIcon}
            aria-hidden="true"
          >
            ☎
          </span>

          <span>0757000390</span>
        </a>
      </div>
    </div>
  );
}