import { useState } from "react";
import styles from "./footer.module.css";
import LegalDocument, {
  type LegalDocumentType,
} from "../../components/legal/LegalDocument";

export default function FooterLegal() {
  const [activeDocument, setActiveDocument] =
    useState<LegalDocumentType | null>(null);

  const openDocument = (document: LegalDocumentType) => {
    setActiveDocument(document);
  };

  const closeDocument = () => {
    setActiveDocument(null);
  };

  return (
    <>
      <div className={styles.legalColumn}>
        <button
          type="button"
          className={styles.legalLink}
          onClick={() => openDocument("terms")}
        >
          Terms of services
        </button>

        <button
          type="button"
          className={styles.legalLink}
          onClick={() => openDocument("privacy")}
        >
          Data Privacy
        </button>
      </div>

      {activeDocument && (
        <LegalDocument
          type={activeDocument}
          onClose={closeDocument}
        />
      )}
    </>
  );
}