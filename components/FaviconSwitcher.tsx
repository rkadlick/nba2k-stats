// src/components/FaviconSwitcher.tsx
"use client";
import { useEffect, useState } from "react";
import { useFavicon } from "../hooks/useFavicon";

const logos = [
  "https://cdn.nba.com/logos/nba/1610612745/primary/L/logo.svg", // Rockets
  "https://cdn.nba.com/logos/nba/1610612758/primary/L/logo.svg", // Kings
];

export function FaviconSwitcher() {
  // Lazy initializer - only runs once on mount
  const [currentLogo, setCurrentLogo] = useState(() => 
    logos[Math.floor(Math.random() * logos.length)]
  );

  useFavicon(currentLogo);

  useEffect(() => {
    // Random interval between 1-3 hours (in milliseconds)
    const getRandomInterval = () =>
      Math.random() * (3 * 60 * 60 * 1000 - 1 * 60 * 60 * 1000) +
      1 * 60 * 60 * 1000;

    const scheduleSwitchFavicon = () => {
      const interval = getRandomInterval();

      const timer = setTimeout(() => {
        setCurrentLogo((prev) => {
          const otherLogo = logos.find((logo) => logo !== prev);
          return otherLogo || logos[0];
        });
        scheduleSwitchFavicon(); // Schedule next switch
      }, interval);

      return timer;
    };

    const timer = scheduleSwitchFavicon();

    return () => clearTimeout(timer);
  }, []);

  return null;
}