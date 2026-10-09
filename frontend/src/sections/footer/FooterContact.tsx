import styles from "./footer.module.css";

export default function FooterContact() {
  return (
    <div className={styles.contactColumn}>
      <h2 className={styles.columnHeading}>
        CONTACT US
      </h2>

      <div className={styles.contactItems}>
        <a
          href="mailto:techy@move.gmail.com"
          className={styles.contactItem}
        >
          <span
            className={styles.contactIcon}
            aria-hidden="true"
          >
            @
          </span>

          <span>techy@move.gmail.com</span>
        </a>

        <a
          href="tel:0720200500"
          className={styles.contactItem}
        >
          <span
            className={styles.contactIcon}
            aria-hidden="true"
          >
            ☎
          </span>

          <span>0720200500</span>
        </a>
      </div>
    </div>
  );
}