import { createRoot } from "react-dom/client";
import TestApp from "./test-app.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<TestApp />);

// Register PWA service worker when available
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    // vite-plugin-pwa injects /sw.js in production
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
