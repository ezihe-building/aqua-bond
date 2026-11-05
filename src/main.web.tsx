import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import LandingPage from "./LandingPage";
import "./styles.css";
import "./landing.css";

if ("serviceWorker" in navigator) {
  const appScope = new URL(import.meta.env.BASE_URL, window.location.origin).toString();
  void navigator.serviceWorker.getRegistrations().then((registrations) =>
    Promise.all(registrations.filter((registration) => registration.scope.startsWith(appScope)).map((registration) => registration.unregister())),
  ).catch((error: unknown) => {
    console.error("Could not remove the retired Aqua Bond web app worker.", error);
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LandingPage />
  </StrictMode>,
);
