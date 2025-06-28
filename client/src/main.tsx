import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Font loading optimization for iPhone Safari
document.addEventListener('DOMContentLoaded', () => {
  // Add fonts-loaded class to body when fonts are ready
  if (document.fonts) {
    document.fonts.ready.then(() => {
      document.body.classList.add('fonts-loaded');
    });
  } else {
    // Fallback for older browsers
    setTimeout(() => {
      document.body.classList.add('fonts-loaded');
    }, 100);
  }
});

createRoot(document.getElementById("root")!).render(<App />);
