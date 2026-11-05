import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).then((registration) => {
      const announceWaitingWorker = () => {
        if (registration.waiting && navigator.serviceWorker.controller) {
          window.dispatchEvent(new CustomEvent("aquabond:sw-update", { detail: registration.waiting }));
        }
      };
      announceWaitingWorker();
      registration.addEventListener("updatefound", () => {
        const installingWorker = registration.installing;
        installingWorker?.addEventListener("statechange", () => {
          if (installingWorker.state === "installed") announceWaitingWorker();
        });
      });
      const checkForUpdates = () => {
        if (document.visibilityState === "visible") {
          void registration.update().catch((error: unknown) => {
            console.error("Could not check for Aqua Bond updates.", error);
          });
        }
      };
      window.addEventListener("focus", checkForUpdates);
      window.setInterval(checkForUpdates, 60 * 60 * 1000);
    }).catch((error: unknown) => {
      console.error("Could not register the Aqua Bond service worker.", error);
    });
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
