"use client";

import { ReactNode } from "react";
import { useDevice } from "@/hooks";

interface ResponsiveLayoutProps {
  children: ReactNode;
  desktop: ReactNode;
  mobile: ReactNode;
}

export function ResponsiveLayout({ children, desktop, mobile }: ResponsiveLayoutProps) {
  const { isMobile, isDesktop, isTablet } = useDevice();

  if (isMobile) {
    return <>{mobile}</>;
  }

  if (isTablet) {
    return (
      <div style={{ padding: "var(--space-md)" }}>
        {children}
      </div>
    );
  }

  return <>{desktop}</>;
}

export function MobileDesktopWrapper({
  mobile,
  desktop,
}: {
  mobile: ReactNode;
  desktop: ReactNode;
}) {
  const { isMobile } = useDevice();
  return isMobile ? <>{mobile}</> : <>{desktop}</>;
}
