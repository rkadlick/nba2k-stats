// src/components/FaviconSwitcher.tsx
"use client";
import { useEffect, useState } from "react";
import { useFavicon } from "../hooks/useFavicon";

const logos = [
  "https://cdn.nba.com/logos/nba/1610612745/primary/L/logo.svg", // Rockets
  "https://cdn.nba.com/logos/nba/1610612758/primary/L/logo.svg", // Kings
  "https://cdn.nba.com/logos/nba/1610612741/primary/L/logo.svg", // Bulls
  "https://cdn.nba.com/logos/nba/1610612751/primary/L/logo.svg", // Nets
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
          const otherLogos = logos.filter((logo) => logo !== prev);
          return otherLogos[Math.floor(Math.random() * otherLogos.length)];
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