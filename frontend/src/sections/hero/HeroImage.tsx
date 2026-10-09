import styles from "./hero.module.css";

import techy from "../../assets/images/hero/techyonbike.png";
import extender from "../../assets/images/hero/extender.png";
import laptop from "../../assets/images/hero/laptop.png";
import unify from "../../assets/images/hero/unify.png";
import pc from "../../assets/images/hero/pc.png";
import router from "../../assets/images/hero/router.png";
import switchImage from "../../assets/images/hero/switch.png";

export default function HeroImage() {
  return (
    <div className={styles.heroVisuals}>

      {/* =====================================================
          LEFT GADGETS
          ===================================================== */}

      <img
        src={extender}
        alt=""
        aria-hidden="true"
        className={`${styles.gadget} ${styles.gadgetLeftOne}`}
      />

      <img
        src={laptop}
        alt=""
        aria-hidden="true"
        className={`${styles.gadget} ${styles.gadgetLeftTwo}`}
      />

      <img
        src={pc}
        alt=""
        aria-hidden="true"
        className={`${styles.gadget} ${styles.gadgetLeftThree}`}
      />


      {/* =====================================================
          RIGHT GADGETS
          ===================================================== */}

      <img
        src={router}
        alt=""
        aria-hidden="true"
        className={`${styles.gadget} ${styles.gadgetRightOne}`}
      />

      <img
        src={unify}
        alt=""
        aria-hidden="true"
        className={`${styles.gadget} ${styles.gadgetRightTwo}`}
      />

      <img
        src={switchImage}
        alt=""
        aria-hidden="true"
        className={`${styles.gadget} ${styles.gadgetRightThree}`}
      />


      {/* =====================================================
          CENTRAL TECHNICIAN + MOTORCYCLE
          ===================================================== */}

      <img
        src={techy}
        alt="Techy On The Move technician with motorcycle"
        className={styles.mascot}
      />

    </div>
  );
}