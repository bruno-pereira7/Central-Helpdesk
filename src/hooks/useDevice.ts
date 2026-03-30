"use client";

import { useState, useEffect } from "react";

export type DeviceType = "mobile" | "tablet" | "desktop";

interface DeviceInfo {
  type: DeviceType;
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

export function useDevice(): DeviceInfo {
  const [device, setDevice] = useState<DeviceInfo>({
    type: "desktop",
    width: 0,
    height: 0,
    isMobile: false,
    isTablet: false,
    isDesktop: true,
  });

  useEffect(() => {
    const updateDevice = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      let type: DeviceType = "desktop";
      let isMobile = false;
      let isTablet = false;
      let isDesktop = true;

      if (width < 768) {
        type = "mobile";
        isMobile = true;
        isDesktop = false;
      } else if (width >= 768 && width < 1024) {
        type = "tablet";
        isTablet = true;
        isDesktop = false;
      }

      setDevice({ type, width, height, isMobile, isTablet, isDesktop });
    };

    updateDevice();
    window.addEventListener("resize", updateDevice);
    return () => window.removeEventListener("resize", updateDevice);
  }, []);

  return device;
}
