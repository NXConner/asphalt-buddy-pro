import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Register PWA service worker when available
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    // vite-plugin-pwa injects /sw.js in production
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
