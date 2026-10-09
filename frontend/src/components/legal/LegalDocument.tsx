import styles from "./legalDocument.module.css";

export type LegalDocumentType = "terms" | "privacy";

interface LegalDocumentProps {
  type: LegalDocumentType;
  onClose: () => void;
}

const documentContent = {
  terms: {
    title: "TERMS OF SERVICES",
    effectiveDate: "October 2026",
  },
  privacy: {
    title: "DATA PRIVACY",
    effectiveDate: "October 2026",
  },
};

export default function LegalDocument({
  type,
  onClose,
}: LegalDocumentProps) {
  const document = documentContent[type];

  return (
    <div
      className={styles.overlay}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <article
        className={styles.document}
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-document-title"
      >
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close document"
        >
          ×
        </button>

        <div className={styles.documentHeader}>
          <p className={styles.documentLabel}>
            TECHY ON THE MOVE
          </p>

          <h1 id="legal-document-title">
            {document.title}
          </h1>

          <p className={styles.effectiveDate}>
            Effective Date: {document.effectiveDate}
          </p>
        </div>

        <div className={styles.documentBody}>
          {type === "terms" ? (
            <>
              <section className={styles.documentSection}>
                <h2>1. INTRODUCTION</h2>

                <p>
                  These Terms of Services govern the use of
                  Techy On The Move services and the submission
                  of technology service requests through our
                  website.
                </p>

                <p>
                  Techy On The Move provides technology support,
                  installation, troubleshooting, setup, and
                  related technical services at locations where
                  our services are available.
                </p>

                <p>
                  By submitting a service request, you acknowledge
                  that you have read and understood these terms
                  and agree to be bound by them.
                </p>
              </section>

              <section className={styles.documentSection}>
                <h2>2. SERVICE REQUESTS</h2>

                <p>
                  Customers may submit a service request through
                  the Techy On The Move website by providing the
                  information required to understand and arrange
                  the requested service.
                </p>

                <p>
                  Submitting a request does not automatically
                  guarantee that a technician will be available
                  to perform the requested service. Requests are
                  subject to availability, service coverage,
                  scheduling, and confirmation.
                </p>

                <p>
                  We may contact you using the contact details
                  provided in your request to clarify the issue,
                  confirm details, arrange the visit, or discuss
                  the requested service.
                </p>
              </section>

              <section className={styles.documentSection}>
                <h2>3. SERVICE AVAILABILITY</h2>

                <p>
                  Service availability may depend on location,
                  technician availability, the nature of the
                  requested work, and other operational factors.
                </p>

                <p>
                  The availability of a date or time slot shown
                  on the website is an indication that a request
                  can be submitted for that period. A service
                  appointment may require confirmation from
                  Techy On The Move.
                </p>
              </section>

              <section className={styles.documentSection}>
                <h2>4. SERVICE INFORMATION</h2>

                <p>
                  Customers are responsible for providing accurate
                  and useful information about the technology issue,
                  service location, contact details, and any other
                  information required to perform the requested
                  work.
                </p>

                <p>
                  Incomplete or inaccurate information may affect
                  our ability to diagnose an issue, prepare for a
                  visit, or provide the requested service.
                </p>
              </section>

              <section className={styles.documentSection}>
                <h2>5. PRICING AND CHARGES</h2>

                <p>
                  Where a service charge is displayed or quoted,
                  it may be based on the information available at
                  the time of the request.
                </p>

                <p>
                  Additional work, parts, equipment, or services
                  that were not included in the original request
                  may result in additional charges. Where practical,
                  such additional work will be discussed with the
                  customer before it is carried out.
                </p>
              </section>

              <section className={styles.documentSection}>
                <h2>6. CANCELLATIONS AND CHANGES</h2>

                <p>
                  Customers should contact Techy On The Move as
                  soon as possible if they need to change or cancel
                  a service request.
                </p>

                <p>
                  Changes to the requested service, location, date,
                  or time may be subject to availability.
                </p>
              </section>

              <section className={styles.documentSection}>
                <h2>7. CUSTOMER RESPONSIBILITIES</h2>

                <p>
                  Customers should provide reasonable access to the
                  equipment, premises, network, or other technology
                  involved in the requested service.
                </p>

                <p>
                  Customers are responsible for backing up important
                  personal or business data before service where
                  reasonably possible.
                </p>

                <p>
                  Customers should also provide any passwords,
                  access information, or permissions required for
                  the requested work only where necessary and through
                  an appropriate and secure method.
                </p>
              </section>

              <section className={styles.documentSection}>
                <h2>8. THIRD-PARTY EQUIPMENT AND SERVICES</h2>

                <p>
                  Technology support may involve equipment,
                  software, networks, internet connections, or
                  services supplied by third parties.
                </p>

                <p>
                  Techy On The Move cannot guarantee the continued
                  operation, availability, compatibility, or
                  performance of third-party products or services
                  that are outside our control.
                </p>
              </section>

              <section className={styles.documentSection}>
                <h2>9. SERVICE LIMITATIONS</h2>

                <p>
                  Some technical problems may require replacement
                  parts, specialist support, manufacturer assistance,
                  internet service provider intervention, or other
                  services outside the scope of the original request.
                </p>

                <p>
                  Where a problem cannot reasonably be resolved during
                  the requested service, we will communicate the
                  available next steps where possible.
                </p>
              </section>

              <section className={styles.documentSection}>
                <h2>10. LIABILITY</h2>

                <p>
                  Techy On The Move will take reasonable care when
                  providing its services. However, technical work
                  can involve existing faults, damaged equipment,
                  software limitations, data loss risks, or other
                  circumstances that may be outside our control.
                </p>

                <p>
                  Customers should maintain appropriate backups of
                  important data and information before technical
                  work is performed.
                </p>
              </section>

              <section className={styles.documentSection}>
                <h2>11. CHANGES TO THESE TERMS</h2>

                <p>
                  Techy On The Move may update these Terms of Services
                  when necessary to reflect changes to our services,
                  operations, or applicable requirements.
                </p>

                <p>
                  The updated version will be made available through
                  the website and will include an updated effective
                  date where appropriate.
                </p>
              </section>

              <section className={styles.documentSection}>
                <h2>12. CONTACT</h2>

                <p>
                  If you have questions about these Terms of Services,
                  please contact Techy On The Move.
                </p>

                <p>
                  Email:{" "}
                  <a href="mailto:techy@move.gmail.com">
                    techy@move.gmail.com
                  </a>
                </p>

                <p>
                  Phone:{" "}
                  <a href="tel:0720200500">
                    0720200500
                  </a>
                </p>
              </section>
            </>
          ) : (
            <>
              <section className={styles.documentSection}>
                <h2>1. INTRODUCTION</h2>

                <p>
                  Techy On The Move respects the privacy of
                  customers and visitors who use our website
                  and services.
                </p>

                <p>
                  This Data Privacy notice explains what information
                  we may collect, why we collect it, how we use it,
                  and the steps we take to protect it.
                </p>
              </section>

              <section className={styles.documentSection}>
                <h2>2. INFORMATION WE COLLECT</h2>

                <p>
                  When you submit a service request, we may collect
                  information necessary to arrange and provide the
                  requested service.
                </p>

                <p>
                  This may include your name, telephone number,
                  email address, service location, directions,
                  preferred service date and time, selected service,
                  description of the technology problem, and other
                  information you choose to provide.
                </p>
              </section>

              <section className={styles.documentSection}>
                <h2>3. HOW WE USE YOUR INFORMATION</h2>

                <p>
                  Information submitted through the website may be
                  used to process and manage your service request,
                  communicate with you, arrange a technician visit,
                  provide technical support, and follow up on the
                  requested service.
                </p>

                <p>
                  We may also use relevant information to maintain
                  service records, respond to enquiries, resolve
                  service issues, and improve our services.
                </p>
              </section>

              <section className={styles.documentSection}>
                <h2>4. COMMUNICATIONS</h2>

                <p>
                  We may use the contact information you provide to
                  communicate with you about your service request.
                </p>

                <p>
                  This may include request confirmations,
                  appointment communication, clarification of
                  technical information, service updates, and
                  follow-up communication.
                </p>
              </section>

              <section className={styles.documentSection}>
                <h2>5. SERVICE LOCATION INFORMATION</h2>

                <p>
                  Location and directions provided in a service
                  request are used to help our team identify where
                  the requested service should be performed.
                </p>

                <p>
                  We ask customers to provide only the location
                  information reasonably necessary for arranging
                  the service.
                </p>
              </section>

              <section className={styles.documentSection}>
                <h2>6. SHARING INFORMATION</h2>

                <p>
                  We do not sell customer information.
                </p>

                <p>
                  Information may be shared internally or with
                  service personnel where reasonably necessary to
                  process and fulfil a customer's service request.
                </p>

                <p>
                  Information may also be disclosed where required
                  by applicable law or where necessary to protect
                  the rights, safety, or security of Techy On The
                  Move, our customers, or others.
                </p>
              </section>

              <section className={styles.documentSection}>
                <h2>7. DATA SECURITY</h2>

                <p>
                  Techy On The Move takes reasonable measures to
                  protect information against unauthorized access,
                  misuse, loss, alteration, or disclosure.
                </p>

                <p>
                  No method of storing or transmitting information
                  over the internet can be guaranteed to be
                  completely secure.
                </p>
              </section>

              <section className={styles.documentSection}>
                <h2>8. DATA RETENTION</h2>

                <p>
                  We may retain service request and related
                  information for as long as reasonably necessary
                  for operational, customer-service, record-keeping,
                  legal, or other legitimate business purposes.
                </p>

                <p>
                  Information that is no longer reasonably required
                  may be deleted or securely disposed of in accordance
                  with our internal practices and applicable
                  requirements.
                </p>
              </section>

              <section className={styles.documentSection}>
                <h2>9. YOUR INFORMATION</h2>

                <p>
                  Customers may contact Techy On The Move to ask
                  questions about personal information associated
                  with their service request or to request appropriate
                  corrections where information is inaccurate.
                </p>

                <p>
                  Requests relating to personal information will be
                  handled in accordance with applicable data-protection
                  requirements.
                </p>
              </section>

              <section className={styles.documentSection}>
                <h2>10. THIRD-PARTY SERVICES</h2>

                <p>
                  Our website or service operations may rely on
                  third-party technology providers for hosting,
                  communication, payment processing, analytics, or
                  other operational functions.
                </p>

                <p>
                  Where third parties process information on our
                  behalf, we expect appropriate safeguards to be
                  applied in accordance with their role and applicable
                  requirements.
                </p>
              </section>

              <section className={styles.documentSection}>
                <h2>11. CHANGES TO THIS NOTICE</h2>

                <p>
                  We may update this Data Privacy notice from time
                  to time to reflect changes in our services,
                  technology, business practices, or applicable
                  requirements.
                </p>

                <p>
                  The effective date at the top of this document
                  indicates when the current version came into effect.
                </p>
              </section>

              <section className={styles.documentSection}>
                <h2>12. CONTACT US</h2>

                <p>
                  If you have questions or concerns about this Data
                  Privacy notice or the handling of your information,
                  please contact Techy On The Move.
                </p>

                <p>
                  Email:{" "}
                  <a href="mailto:techy@move.gmail.com">
                    techy@move.gmail.com
                  </a>
                </p>

                <p>
                  Phone:{" "}
                  <a href="tel:0720200500">
                    0720200500
                  </a>
                </p>
              </section>
            </>
          )}
        </div>

        <footer className={styles.documentFooter}>
          <span>Techy On The Move</span>
          <span>{document.title}</span>
        </footer>
      </article>
    </div>
  );
}