import { useEffect, useRef, useState } from "react";

import styles from "./TurnstileWidget.module.css";

interface TurnstileRenderOptions {
  sitekey: string;
  action: string;
  theme: "light";
  callback: (token: string) => void;
  "expired-callback": () => void;
  "error-callback": () => void;
  "timeout-callback": () => void;
}

interface TurnstileApi {
  render: (
    container: HTMLElement,
    options: TurnstileRenderOptions
  ) => string;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

interface TurnstileWidgetProps {
  action: "request_create" | "review_submit";
  siteKey: string;
  onTokenChange: (token: string) => void;
}

let turnstileScriptPromise: Promise<TurnstileApi> | null = null;

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) {
    return Promise.resolve(window.turnstile);
  }
  if (turnstileScriptPromise) {
    return turnstileScriptPromise;
  }

  turnstileScriptPromise = new Promise<TurnstileApi>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-turnstile-script="true"]'
    );
    const script = existing ?? document.createElement("script");
    if (!existing) {
      script.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.dataset.turnstileScript = "true";
    }

    const handleLoad = () => {
      if (window.turnstile) {
        resolve(window.turnstile);
      } else {
        reject(new Error("Turnstile did not initialize."));
      }
    };
    const handleError = () => reject(new Error("Turnstile failed to load."));

    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });
    if (!existing) {
      document.head.append(script);
    }
  }).catch((error: unknown) => {
    turnstileScriptPromise = null;
    throw error;
  });

  return turnstileScriptPromise;
}

export default function TurnstileWidget({
  action,
  siteKey,
  onTokenChange,
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const tokenCallbackRef = useRef(onTokenChange);
  const [widgetError, setWidgetError] = useState("");
  const [widgetReady, setWidgetReady] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    tokenCallbackRef.current = onTokenChange;
  }, [onTokenChange]);

  useEffect(() => {
    let cancelled = false;
    let widgetId: string | null = null;

    if (!siteKey) {
      tokenCallbackRef.current("");
      return;
    }

    void loadTurnstile()
      .then((turnstile) => {
        if (cancelled || !containerRef.current) {
          return;
        }
        widgetId = turnstile.render(containerRef.current, {
          sitekey: siteKey,
          action,
          theme: "light",
          callback: (token) => {
            setHasToken(true);
            setWidgetError("");
            tokenCallbackRef.current(token);
          },
          "expired-callback": () => {
            setHasToken(false);
            setWidgetError("The security check expired. Complete it again.");
            tokenCallbackRef.current("");
          },
          "error-callback": () => {
            setHasToken(false);
            setWidgetError(
              "The security check could not load. Please retry shortly."
            );
            tokenCallbackRef.current("");
          },
          "timeout-callback": () => {
            setHasToken(false);
            setWidgetError("The security check timed out. Complete it again.");
            tokenCallbackRef.current("");
          },
        });
        setWidgetReady(true);
        setWidgetError("");
      })
      .catch(() => {
        if (!cancelled) {
          setWidgetReady(false);
          setWidgetError(
            "The security check is temporarily unavailable. Please retry shortly."
          );
          tokenCallbackRef.current("");
        }
      });

    return () => {
      cancelled = true;
      if (widgetId && window.turnstile) {
        window.turnstile.remove(widgetId);
      }
    };
  }, [action, siteKey]);

  const displayError =
    widgetError ||
    (!siteKey
      ? "Security verification is not configured. Please try again later."
      : "");

  return (
    <div className={styles.container}>
      <div ref={containerRef} />
      {displayError && (
        <p className={styles.message} role="status" aria-live="polite">
          {displayError}
        </p>
      )}
      {!widgetReady && !displayError && (
        <p className={styles.message} role="status">
          Loading security check...
        </p>
      )}
      {widgetReady && !displayError && !hasToken && (
        <p className={styles.message} role="status">
          Complete the security check to enable submission.
        </p>
      )}
    </div>
  );
}
