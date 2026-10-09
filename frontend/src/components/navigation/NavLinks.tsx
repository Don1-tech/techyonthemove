import { useState } from "react";
import styles from "./navbar.module.css";

const links = [
  {
    label: "HOME",
    target: "home",
  },
  {
    label: "ABOUT US",
    target: "about",
  },
  {
    label: "SERVICES",
    target: "services",
  },
  {
    label: "HOW IT WORKS",
    target: "how-it-works",
  },
  {
    label: "REVIEWS",
    target: "reviews",
  },
  {
    label: "CONTACT",
    target: "contact",
  },
];

export default function NavLinks() {
  const [activeLink, setActiveLink] = useState("home");

  const handleNavigation = (target: string) => {
    setActiveLink(target);

    const section = document.getElementById(target);

    if (section) {
      section.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <nav
      className={styles.navigation}
      aria-label="Main navigation"
    >
      {links.map((link) => (
        <button
          key={link.target}
          type="button"
          className={`${styles.link} ${
            activeLink === link.target
              ? styles.active
              : ""
          }`}
          onClick={() => handleNavigation(link.target)}
        >
          {link.label}
        </button>
      ))}
    </nav>
  );
}