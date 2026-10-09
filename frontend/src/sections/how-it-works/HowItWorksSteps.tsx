import styles from "./how-it-works.module.css";

import clickIcon from "../../assets/images/icons/click.png";
import listIcon from "../../assets/images/icons/list.png";
import datetimeIcon from "../../assets/images/icons/datetime.png";
import reviewIcon from "../../assets/images/icons/review.png";
import confirmIcon from "../../assets/images/icons/confirm.png";
import locationIcon from "../../assets/images/icons/location.png";

export default function HowItWorksSteps() {
  return (
    <div className={styles.stepsCanvas}>
      {/* STEP 01 */}
      <article className={`${styles.stepCard} ${styles.step1}`}>
        <span className={styles.stepNumber}>01</span>

        <img
          src={clickIcon}
          alt=""
          className={styles.stepIcon}
        />

        <div className={styles.stepContent}>
          <h3>REQUEST A SERVICE</h3>
          <p>
            Click Request Service and enter your name, contact information,
            and the service you need.
          </p>
        </div>
      </article>

      {/* STEP 02 */}
      <article className={`${styles.stepCard} ${styles.step2}`}>
        <span className={styles.stepNumber}>02</span>

        <img
          src={listIcon}
          alt=""
          className={styles.stepIcon}
        />

        <div className={styles.stepContent}>
          <h3>TELL US WHAT YOU NEED</h3>
          <p>
            Choose the service and subcategory, then briefly describe the
            issue or assistance you need.
          </p>
        </div>
      </article>

      {/* STEP 03 */}
      <article className={`${styles.stepCard} ${styles.step3}`}>
        <span className={styles.stepNumber}>03</span>

        <img
          src={datetimeIcon}
          alt=""
          className={styles.stepIcon}
        />

        <div className={styles.stepContent}>
          <h3>CHOOSE DATE &amp; TIME</h3>
          <p>
            Select a convenient service date and an available time for your
            visit.
          </p>
        </div>
      </article>

      {/* STEP 04 */}
      <article className={`${styles.stepCard} ${styles.step4}`}>
        <span className={styles.stepNumber}>04</span>

        <img
          src={reviewIcon}
          alt=""
          className={styles.stepIcon}
        />

        <div className={styles.stepContent}>
          <h3>REVIEW YOUR REQUEST</h3>
          <p>
            Check your information, service details, appointment time, and
            estimated price before submitting.
          </p>
        </div>
      </article>

      {/* STEP 05 */}
      <article className={`${styles.stepCard} ${styles.step5}`}>
        <span className={styles.stepNumber}>05</span>

        <img
          src={confirmIcon}
          alt=""
          className={styles.stepIcon}
        />

        <div className={styles.stepContent}>
          <h3>CONFIRM YOUR REQUEST</h3>
          <p>
            Confirm your request, receive your request number, and get a
            receipt copy sent to your email.
          </p>
        </div>
      </article>

      {/* STEP 06 */}
      <article className={`${styles.stepCard} ${styles.step6}`}>
        <span className={styles.stepNumber}>06</span>

        <img
          src={locationIcon}
          alt=""
          className={styles.stepIcon}
        />

        <div className={styles.stepContent}>
          <h3>WE COME TO YOU</h3>
          <p>
            We contact you to acknowledge the request and confirm directions
            before heading to your location.
          </p>
        </div>
      </article>
    </div>
  );
}