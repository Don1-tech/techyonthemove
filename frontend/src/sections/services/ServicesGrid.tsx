import styles from "./services.module.css";

import networkInstallation from "../../assets/images/services/network-installation.jpg";
import homeSmartNetwork from "../../assets/images/services/home-smart-network.jpg";
import pcBuilding from "../../assets/images/services/pc-building.jpg";
import diagnostics from "../../assets/images/services/diagnostics.jpg";
import mount from "../../assets/images/services/mount.webp";

export default function ServicesGrid() {
  return (
    <div className={styles.servicesCanvas}>

      {/* =====================================================
          CARD 1 — NETWORK INSTALLATION
          ===================================================== */}

      <article className={`${styles.serviceCard} ${styles.card1}`}>
        <img
          src={networkInstallation}
          alt="Network rack with switches, patch panels, cabling, and access point"
          className={styles.cardImage}
        />

        <div className={styles.cardOverlay} />

        <div className={styles.cardContent}>
          <h3>Network Installation & Setup</h3>

          <p>
            Professional installation and configuration of wired and
            wireless networks for homes, offices, and small businesses.
            We handle LAN cabling, switches, routers, access points,
            IP configuration, and complete network setup.
          </p>
        </div>
      </article>


      {/* =====================================================
          CARD 2 — HOME & SMART NETWORK
          ===================================================== */}

      <article className={`${styles.serviceCard} ${styles.card2}`}>
        <img
          src={homeSmartNetwork}
          alt="Modern home entertainment area with connected network equipment"
          className={styles.cardImage}
        />

        <div className={styles.cardOverlay} />

        <div className={styles.cardContent}>
          <h3>Home & Smart Network Setup</h3>

          <p>
            Get your home devices connected, configured, and working
            together. We set up and optimize Wi-Fi, routers, access
            points, smart TVs, cameras, printers, IoT devices, and
            other connected home technology.
          </p>
        </div>
      </article>


      {/* =====================================================
          CARD 3 — PC BUILDING
          ===================================================== */}

      <article className={`${styles.serviceCard} ${styles.card3}`}>
        <img
          src={pcBuilding}
          alt="Open gaming PC with RGB components on a desk"
          className={styles.cardImage}
        />

        <div className={styles.cardOverlay} />

        <div className={styles.cardContent}>
          <h3>PC Building & Hardware Upgrades</h3>

          <p>
            Build, assemble, or upgrade your computer to match your
            needs. We handle PC assembly, component installation,
            storage and memory upgrades, hardware configuration,
            and component replacements.
          </p>
        </div>
      </article>


      {/* =====================================================
          CARD 4 — COMPUTER TROUBLESHOOTING
          ===================================================== */}

      <article className={`${styles.serviceCard} ${styles.card4}`}>
        <img
          src={diagnostics}
          alt="Computer diagnostics workspace showing system diagnostics"
          className={styles.cardImage}
        />

        <div className={styles.cardOverlay} />

        <div className={styles.cardContent}>
          <h3>Computer Troubleshooting & Repair</h3>

          <p>
            Diagnose and resolve computer hardware and software
            problems. From faulty or replaceable components and
            performance issues to corrupted operating systems,
            driver problems, system configuration, and other PC issues.
          </p>
        </div>
      </article>


      {/* =====================================================
          CARD 5 — NETWORK TROUBLESHOOTING
          ===================================================== */}

      <article className={`${styles.serviceCard} ${styles.card5}`}>
        <img
          src={mount}
          alt="Network equipment installation and mounting setup"
          className={styles.cardImage}
        />

        <div className={styles.cardOverlay} />

        <div className={styles.cardContent}>
          <h3>Network Troubleshooting & Optimization</h3>

          <p>
            Find and fix network problems affecting connectivity,
            performance, and reliability. Troubleshoot cabling faults,
            access points, routers, switches, Wi-Fi coverage,
            configuration issues, and perform network adjustments,
            installations, and equipment mounting.
          </p>
        </div>
      </article>

    </div>
  );
}