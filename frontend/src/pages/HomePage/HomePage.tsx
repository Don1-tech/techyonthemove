import { useState } from "react";

import Navbar from "../../components/navigation/Navbar";
import Hero from "../../sections/hero/Hero";
import About from "../../sections/about/About";
import Services from "../../sections/services/Services";
import HowItWorks from "../../sections/how-it-works/HowItWorks";
import Reviews from "../../sections/reviews/Reviews";
import Footer from "../../sections/footer/Footer";

import ServiceRequestModal from "../../features/service-request/ServiceRequestModal";
import styles from "./HomePage.module.css";

export default function HomePage() {
  const [requestServiceOpen, setRequestServiceOpen] = useState(false);

  const handleRequestService = () => {
    setRequestServiceOpen(true);
  };

  const handleCloseRequestService = () => {
    setRequestServiceOpen(false);
  };

  return (
    <main className={styles.home}>
      <Navbar onRequestService={handleRequestService} />

      <Hero />

      <About />

      <Services />

      <HowItWorks />

      <Reviews />

      <Footer onRequestService={handleRequestService} />

      <ServiceRequestModal
        open={requestServiceOpen}
        onClose={handleCloseRequestService}
      />
    </main>
  );
}