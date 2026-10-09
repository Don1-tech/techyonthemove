import styles from "./footer.module.css";
import FooterCoverage from "./FooterCoverage";
import FooterContact from "./FooterContact";
import FooterLegal from "./FooterLegal";

import logo from "../../assets/images/hero/LOGO.png";

interface FooterProps {
  onRequestService: () => void;
}

const quickLinks = [
  { label: "HOME", target: "home" },
  { label: "ABOUT US", target: "about" },
  { label: "SERVICES", target: "services" },
  { label: "HOW IT WORKS", target: "how-it-works" },
  { label: "REVIEWS", target: "reviews" },
];

function handleSectionNavigation(target: string) {
  const section = document.getElementById(target);

  if (section) {
    section.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
}

export default function Footer({
  onRequestService,
}: FooterProps) {
  return (
    <footer
  id="contact"
  className={styles.footer}
>
      <div className={styles.footerInner}>

        <div className={styles.brandColumn}>
          <a
            href="#home"
            className={styles.logoLink}
            aria-label="Techy On The Move home"
          >
            <img
              src={logo}
              alt="Techy On The Move"
              className={styles.logo}
            />
          </a>

          <p className={styles.tagline}>
            Anytime you need a hand, just let us know. We are just one button click away
          </p>

          <button
            type="button"
            className={styles.requestButton}
            onClick={onRequestService}
          >
            Request Service
          </button>
        </div>

        <FooterCoverage />

        <nav
          className={styles.quickLinksColumn}
          aria-label="Footer navigation"
        >
          <h2 className={styles.columnHeading}>
            QUICK LINKS
          </h2>

          <div className={styles.quickLinks}>
            {quickLinks.map((link) => (
              <button
                key={link.target}
                type="button"
                className={styles.quickLink}
                onClick={() => handleSectionNavigation(link.target)}
              >
                {link.label}
              </button>
            ))}
          </div>
        </nav>

        <FooterContact />

        <FooterLegal />

      </div>
    </footer>
  );
}