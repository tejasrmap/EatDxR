import React from "react";
import { Link, LinkProps, useLocation } from "react-router-dom";
import { isNative } from "../services/nativeService";

/**
 * Resolves any internal route dynamically based on whether the user
 * is in the mobile app shell (`/app/*`) or the native Android APK.
 */
export function useAppUrl() {
  const location = useLocation();
  const isAppMode = isNative || location.pathname.startsWith("/app");

  const getAppUrl = (path: string): string => {
    if (!path) return "/app";
    // External links or anchors remain untouched
    if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("#")) {
      return path;
    }

    const cleanPath = path.startsWith("/") ? path : `/${path}`;

    if (!isAppMode) {
      // In website mode:
      // If a path was explicitly /app, keep it, otherwise keep root path
      return cleanPath;
    }

    // In App mode: Ensure route starts with /app
    if (cleanPath === "/" || cleanPath === "/app" || cleanPath === "/app/") {
      return "/app";
    }

    if (cleanPath.startsWith("/app/")) {
      return cleanPath;
    }

    // Map website routes to app routes
    return `/app${cleanPath}`;
  };

  return { getAppUrl, isAppMode };
}

/**
 * Drop-in replacement for `Link` that automatically routes within `/app/*`
 * when inside the mobile app or native APK.
 */
export const AppLink: React.FC<LinkProps> = ({ to, children, ...props }) => {
  const { getAppUrl } = useAppUrl();
  const resolvedTo = typeof to === "string" ? getAppUrl(to) : to;

  return React.createElement(Link, { to: resolvedTo, ...props }, children);
};
