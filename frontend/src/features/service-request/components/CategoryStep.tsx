
import { useEffect, useState } from "react";

import styles from "./CategoryStep.module.css";

import wifiInternetIcon from "../../../assets/images/icons/requestcard1/wifi_internet.png";
import networkIssuesIcon from "../../../assets/images/icons/requestcard1/network issues.png";
import pcLaptopsIcon from "../../../assets/images/icons/requestcard1/PC and laptops.png";
import tvEntertainmentIcon from "../../../assets/images/icons/requestcard1/entertainment and other tv.png";
import smartHomeIcon from "../../../assets/images/icons/requestcard1/smart_home.png";
import smartDevicesIcon from "../../../assets/images/icons/requestcard1/smart devices.png";
import cctvIcon from "../../../assets/images/icons/requestcard1/cctv.png";
import otherRepairsIcon from "../../../assets/images/icons/requestcard1/other repairs.png";

import { getServices } from "../../../api/servicesApi";

import type { Service } from "../../../types/service";

export type ServiceCategory = Service & {
  icon: string;
};

const serviceIcons: Record<string, string> = {
  "wifi-internet": wifiInternetIcon,
  "network-issues": networkIssuesIcon,
  "pc-laptops": pcLaptopsIcon,
  "tv-entertainment": tvEntertainmentIcon,
  "smart-home": smartHomeIcon,
  "smart-devices": smartDevicesIcon,
  cctv: cctvIcon,
  "other-repairs": otherRepairsIcon,
};

const categoryDisplayNames: Record<string, string> = {
  cctv: "CCTVs and Security",
  "wifi-internet": "WiFi and Internet Issues",
  "other-repairs": "Other Repairs and Servicing",
  "pc-laptops": "PCs and Laptops",
  "smart-devices": "Smart Devices",
  "smart-home": "Smart Home",
  "tv-entertainment": "TV and Entertainment",
  "network-issues": "Network Installations",
};

type CategoryStepProps = {
  selectedCategory: string | null;
  onSelectCategory: (
    category: ServiceCategory
  ) => void;
  onContinue: () => void;
};

export default function CategoryStep({
  selectedCategory,
  onSelectCategory,
  onContinue,
}: CategoryStepProps) {
  const [serviceCategories, setServiceCategories] =
    useState<ServiceCategory[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let cancelled = false;

    const loadServices = async () => {
      setLoading(true);
      setError("");

      try {
        const services = await getServices();

        if (cancelled) {
          return;
        }

        const categories = services
          .map((service) => {
            const icon =
              serviceIcons[service.id];

            if (!icon) {
              return null;
            }

            return {
              ...service,
              icon,
            };
          })
          .filter(
            (
              service
            ): service is ServiceCategory =>
              service !== null
          );

        setServiceCategories(categories);
      } catch {
        if (!cancelled) {
          setError(
            "We could not load our services. Please try again."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadServices();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className={styles.step}>
      <div className={styles.heading}>
        <h2>Choose the service you need</h2>
      </div>

      {loading && (
        <div className={styles.loadingMessage}>
          Loading services...
        </div>
      )}

      {error && (
        <div
          className={styles.errorMessage}
          role="alert"
        >
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className={styles.categoryGrid}>
          {serviceCategories.map((category) => {
            const isSelected =
              selectedCategory === category.id;

            return (
              <button
                key={category.id}
                type="button"
                className={`${styles.categoryCard} ${
                  isSelected
                    ? styles.selected
                    : ""
                }`}
                onClick={() =>
                  onSelectCategory(category)
                }
                aria-pressed={isSelected}
              >
                <span
                  className={styles.iconContainer}
                >
                  <img
                    src={category.icon}
                    alt=""
                    className={styles.icon}
                    aria-hidden="true"
                  />
                </span>

                <span
                  className={styles.categoryName}
                >
                  {categoryDisplayNames[category.id] ??
                    category.name}
                </span>

                {isSelected && (
                  <span
                    className={
                      styles.selectedIndicator
                    }
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <div className={styles.actionBar}>
        <button
          type="button"
          className={styles.continueButton}
          disabled={
            !selectedCategory ||
            loading ||
            Boolean(error)
          }
          onClick={onContinue}
        >
          <span>Continue</span>

          <span aria-hidden="true">→</span>
        </button>
      </div>
    </section>
  );
}
