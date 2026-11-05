import { StrictMode, Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import "./styles.css";

const App = lazy(() => import("./App"));

ReactDOM.createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Suspense fallback={<div className="app-startup" role="status">AQUA BOND</div>}>
      <App />
    </Suspense>
  </StrictMode>,
);
