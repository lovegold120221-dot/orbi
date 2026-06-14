"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      // Wait for the page to fully load before registering
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").then(
          () => {
            // Registration succeeded
          },
          (err) => {
            console.warn("ServiceWorker registration failed:", err);
          }
        );
      });
    }
  }, []);

  return null;
}
