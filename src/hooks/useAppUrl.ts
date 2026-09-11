import React from "react";
import { Link, LinkProps, useLocation } from "react-router-dom";
import { isNative } from "../services/nativeService";

/**
 * Resolves internal routes dynamically based on whether the user
 * is in the mobile app shell (`/app/*`) or the website shell.
 */
export function useAppUrl() {
  const location = useLocation();
  const isAppMode = isNative || location.pathname.startsWith("/app");

  const getAppUrl = (path: string): string => {
    if (!path) return isAppMode ? "/app" : "/";
    // External links or anchors remain untouched
    if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("#")) {
      return path;
    }

    const cleanPath = path.startsWith("/") ? path : `/${path}`;

    if (!isAppMode) {
      // In website mode: Keep canonical route without /app
      if (cleanPath === "/app" || cleanPath === "/app/") return "/";
      return cleanPath.replace(/^\/app/, "") || "/";
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
 * Drop-in replacement for `Link` that automatically routes appropriately
 * based on current mode (canonical on web, /app/* in app mode).
 */
export const AppLink: React.FC<LinkProps> = ({ to, children, ...props }) => {
  const { getAppUrl } = useAppUrl();
  const resolvedTo = typeof to === "string" ? getAppUrl(to) : to;

  return React.createElement(Link, { to: resolvedTo, ...props }, children);
};
