// src/hooks/useFavicon.ts
import { useEffect } from "react";

export function useFavicon(url: string) {
  useEffect(() => {
    let link = document.querySelector<HTMLLinkElement>(
      "link[rel~='icon']"
    );

    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      link.type = "image/svg+xml";
      document.head.appendChild(link);
    }

    link.href = url;
  }, [url]);
}