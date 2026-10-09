
interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  onRequestService: () => void;
}

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

export default function MobileMenu({
  open,
  onClose,
  onRequestService,
}: MobileMenuProps) {
  if (!open) {
    return null;
  }

  const handleNavigation = (target: string) => {
    onClose();

    const section = document.getElementById(target);

    if (section) {
      section.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <div
      role="dialog"
      aria-label="Mobile navigation"
    >
      {links.map((link) => (
        <button
          key={link.target}
          type="button"
          onClick={() => handleNavigation(link.target)}
        >
          {link.label}
        </button>
      ))}

      <button
        type="button"
        onClick={() => {
          onClose();
          onRequestService();
        }}
      >
        Request Service
      </button>
    </div>
  );
}
