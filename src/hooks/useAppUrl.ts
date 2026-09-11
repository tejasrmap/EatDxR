import React from "react";
import { Link, LinkProps } from "react-router-dom";
import { isNative } from "../services/nativeService";

/**
 * Resolves internal routes cleanly:
 * - On web/desktop (`!isNative`): Always resolves to clean canonical web URLs (e.g. `/map`, `/dishes`, `/profile/...`).
 * - In native Android APK (`isNative = true`): Resolves within the `/app/*` mobile shell.
 */
export function useAppUrl() {
  const isAppMode = isNative;

  const getAppUrl = (path: string): string => {
    if (!path) return isNative ? "/app" : "/";
    // External links or anchors remain untouched
    if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("#")) {
      return path;
    }

    const cleanPath = path.startsWith("/") ? path : `/${path}`;

    if (!isNative) {
      // In web browser: Never prepend /app, strip legacy /app prefix
      if (cleanPath === "/app" || cleanPath === "/app/") return "/";
      return cleanPath.replace(/^\/app/, "");
    }

    // In Native Android APK: Ensure route starts with /app
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
 * based on platform (canonical on web, /app/* in native APK).
 */
export const AppLink: React.FC<LinkProps> = ({ to, children, ...props }) => {
  const { getAppUrl } = useAppUrl();
  const resolvedTo = typeof to === "string" ? getAppUrl(to) : to;

  return React.createElement(Link, { to: resolvedTo, ...props }, children);
};
