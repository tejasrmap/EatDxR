import React, { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { App as CapacitorApp } from "@capacitor/app";
import { isNative, triggerHaptic } from "../services/nativeService";
import { toast } from "sonner";

export function NativeBackHandler() {
  const location = useLocation();
  const navigate = useNavigate();
  const locationRef = useRef(location);
  const lastBackPressRef = useRef<number>(0);

  // Keep location ref up to date
  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  // Core universal back handler function
  const handleBack = () => {
    const currentPath = locationRef.current.pathname;

    // 1. Check if any overlay, drawer, or modal is currently active in DOM
    const bodyIsLocked = document.body.style.overflow === "hidden";
    const openModalElements = Array.from(
      document.querySelectorAll('.fixed.inset-0, [role="dialog"], [data-modal-open="true"]')
    ).filter(el => {
      const zIndexStr = window.getComputedStyle(el).zIndex;
      const zIndex = parseInt(zIndexStr, 10);
      return !isNaN(zIndex) && zIndex >= 50;
    });

    if (bodyIsLocked || openModalElements.length > 0) {
      triggerHaptic();
      // Dispatch Escape key event so the topmost modal dismisses cleanly
      const escEvent = new KeyboardEvent("keydown", {
        key: "Escape",
        code: "Escape",
        keyCode: 27,
        which: 27,
        bubbles: true,
        cancelable: true,
      });
      window.dispatchEvent(escEvent);
      return;
    }

    // 2. Check if user is at the Root Home Screen
    const isRoot = 
      currentPath === "/app" || 
      currentPath === "/app/" || 
      currentPath === "/" || 
      currentPath === "";

    if (!isRoot) {
      // User is on a sub-screen (dish, restaurant, profile, cravings, map, etc.) -> Navigate Back inside App!
      triggerHaptic();
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate("/app");
      }
      return;
    }

    // 3. User is at the root screen: Double-back to exit/minimize
    const now = Date.now();
    if (now - lastBackPressRef.current < 2000) {
      // Exit app cleanly on second press
      if (isNative) {
        CapacitorApp.exitApp();
      }
    } else {
      lastBackPressRef.current = now;
      triggerHaptic();
      toast("Swipe back again to exit Madeater", { duration: 2000 });
    }
  };

  // 1. Capacitor Native Back Button / System Gesture Listener
  useEffect(() => {
    if (!isNative) return;

    const backListenerPromise = CapacitorApp.addListener("backButton", () => {
      handleBack();
    });

    return () => {
      backListenerPromise.then((handle) => handle.remove()).catch(() => {});
    };
  }, []);

  // 2. Screen Edge-Swipe Gesture Listener (Left-to-right swipe from edge)
  useEffect(() => {
    let startX = -1;
    let startY = -1;
    let isEdgeSwipe = false;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      // Left edge swipe zone (within 35px from left edge)
      if (touch.clientX <= 35) {
        startX = touch.clientX;
        startY = touch.clientY;
        isEdgeSwipe = true;
      } else {
        isEdgeSwipe = false;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isEdgeSwipe || startX < 0) return;
      const touch = e.touches[0];
      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;

      // Detect deliberate horizontal swipe from edge (travel > 75px and mostly horizontal)
      if (deltaX > 75 && Math.abs(deltaY) < deltaX * 0.55) {
        isEdgeSwipe = false;
        startX = -1;
        handleBack();
      }
    };

    const onTouchEnd = () => {
      isEdgeSwipe = false;
      startX = -1;
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  return null;
}
