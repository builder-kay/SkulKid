"use client";

import { useEffect, useState } from "react";

export function isBrowserOnline() {
  return typeof navigator === "undefined" ? true : navigator.onLine !== false;
}

export function useOnlineStatus() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    function sync() {
      setOnline(isBrowserOnline());
    }
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  return online;
}

export function onlineRequiredMessage(_action?: string) {
  return "Try again when you are connected.";
}
