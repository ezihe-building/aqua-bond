import { StrictMode, lazy, Suspense, useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import "./styles.css";
import "./landing.css";

const App = lazy(() => import("./App"));
const LandingPage = lazy(() => import("./LandingPage"));
const isNativeApp = Capacitor.isNativePlatform();
if (isNativeApp && window.location.hash !== "#/app") window.location.hash = "#/app";

if ("serviceWorker" in navigator && !isNativeApp) {
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

function ApplicationRouter() {
  const [isTrackerRoute, setIsTrackerRoute] = useState(isNativeApp || window.location.hash === "#/app");
  useEffect(() => {
    const updateRoute = () => setIsTrackerRoute(isNativeApp || window.location.hash === "#/app");
    window.addEventListener("hashchange", updateRoute);
    return () => window.removeEventListener("hashchange", updateRoute);
  }, []);
  return (
    <Suspense fallback={<div className="app-startup" role="status">AQUA BOND</div>}>
      {isTrackerRoute ? <App /> : <LandingPage />}
    </Suspense>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ApplicationRouter />
  </StrictMode>,
);
