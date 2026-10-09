import { useState } from "react";
import styles from "./navbar.module.css";
import NavLinks from "./NavLinks";
import MobileMenu from "./MobileMenu";
import logo from "../../assets/images/hero/LOGO.png";

interface NavbarProps {
  onRequestService: () => void;
}

export default function Navbar({
  onRequestService,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className={styles.navbar}>
        <div className={styles.container}>

          <a
            href="#home"
            className={styles.logo}
            aria-label="Techy On The Move home"
            onClick={closeMobileMenu}
          >
            {/* Existing Techy On The Move logo asset goes here */}
            <img
  src={logo}
  alt="Techy On The Move"
  className={styles.logoImage}
/>
          </a>

          <NavLinks />

          <button
            type="button"
            className={styles.requestButton}
            onClick={onRequestService}
          >
            Request Service
          </button>

          <button
            type="button"
            className={styles.menuButton}
            aria-label={
              mobileMenuOpen
                ? "Close navigation menu"
                : "Open navigation menu"
            }
            aria-expanded={mobileMenuOpen}
            onClick={() =>
              setMobileMenuOpen((current) => !current)
            }
          >
            ☰
          </button>

        </div>
      </header>

      <MobileMenu
        open={mobileMenuOpen}
        onClose={closeMobileMenu}
        onRequestService={onRequestService}
      />
    </>
  );
}