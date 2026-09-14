package com.madeater.app;

import android.app.AlertDialog;
import android.content.SharedPreferences;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.onesignal.OneSignal;
import com.onesignal.user.subscriptions.IPushSubscriptionObserver;
import com.onesignal.user.subscriptions.PushSubscriptionChangedState;
import com.onesignal.Continue;

public class MainActivity extends BridgeActivity {
    private static final String PREFS_NAME = "OneSignalVerification";
    private static final String KEY_VERIFIED = "integration_dialog_shown";

    // Retain the observer reference for the lifetime of the activity
    private IPushSubscriptionObserver pushSubscriptionObserver;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        setupPushSubscriptionObserver();

        // OneSignal Lock Screen Notification Click Listener
        OneSignal.getNotifications().addClickListener(event -> {
            try {
                if (event != null && event.getNotification() != null && event.getNotification().getAdditionalData() != null) {
                    String jsonData = event.getNotification().getAdditionalData().toString();
                    if (bridge != null && bridge.getWebView() != null) {
                        bridge.getWebView().post(() -> {
                            bridge.getWebView().evaluateJavascript(
                                "window.dispatchEvent(new CustomEvent('madeater_onesignal_click', { detail: " + jsonData + " }));",
                                null
                            );
                        });
                    }
                }
            } catch (Exception ignored) {}
        });

        // Expose NativeOneSignal interface to webview so React can link logged-in user and query push diagnostics
        if (bridge != null && bridge.getWebView() != null) {
            bridge.getWebView().addJavascriptInterface(new Object() {
                @android.webkit.JavascriptInterface
                public void login(String userId) {
                    if (userId != null && !userId.trim().isEmpty()) {
                        OneSignal.login(userId.trim());
                    }
                }

                @android.webkit.JavascriptInterface
                public void logout() {
                    OneSignal.logout();
                }

                @android.webkit.JavascriptInterface
                public String getSubscriptionId() {
                    try {
                        return OneSignal.getUser().getPushSubscription().getId();
                    } catch (Exception e) {
                        return "";
                    }
                }

                @android.webkit.JavascriptInterface
                public boolean hasPermission() {
                    try {
                        return OneSignal.getNotifications().getPermission();
                    } catch (Exception e) {
                        return false;
                    }
                }

                @android.webkit.JavascriptInterface
                public void promptPermission() {
                    runOnUiThread(() -> {
                        OneSignal.getNotifications().requestPermission(true, Continue.none());
                    });
                }
            }, "NativeOneSignal");
        }
    }

    private void setupPushSubscriptionObserver() {
        // 1. Create and retain observer
        pushSubscriptionObserver = new IPushSubscriptionObserver() {
            @Override
            public void onPushSubscriptionChange(PushSubscriptionChangedState state) {
                if (state != null && state.getCurrent() != null) {
                    String subId = state.getCurrent().getId();
                    checkAndShowVerificationDialog(subId);
                }
            }
        };

        // 2. Add observer to OneSignal push subscription
        OneSignal.getUser().getPushSubscription().addObserver(pushSubscriptionObserver);

        // 3. Evaluate immediately at observer-registration time
        String currentId = OneSignal.getUser().getPushSubscription().getId();
        checkAndShowVerificationDialog(currentId);
    }

    private void checkAndShowVerificationDialog(String subscriptionId) {
        // Treat device as registered only when ID is real, server-assigned (non-empty & not starting with 'local-')
        if (subscriptionId == null || subscriptionId.trim().isEmpty() || subscriptionId.startsWith("local-")) {
            return;
        }

        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        boolean alreadyShown = prefs.getBoolean(KEY_VERIFIED, false);
        if (alreadyShown) {
            return;
        }

        // Mark as shown once
        prefs.edit().putBoolean(KEY_VERIFIED, true).apply();

        // Show dialog on UI thread
        runOnUiThread(() -> {
            if (isFinishing() || isDestroyed()) return;

            new AlertDialog.Builder(this)
                .setTitle("Your OneSignal SDK integration is complete!")
                .setMessage("You can now send Push Notifications & In-App Messages through OneSignal. Tap below to enable push notifications.")
                .setPositiveButton("Got it", (dialog, which) -> {
                    // On button tap, request push permission
                    OneSignal.getNotifications().requestPermission(false, Continue.none());
                })
                .setCancelable(false)
                .show();
        });
    }

    @Override
    public void onDestroy() {
        if (pushSubscriptionObserver != null) {
            OneSignal.getUser().getPushSubscription().removeObserver(pushSubscriptionObserver);
            pushSubscriptionObserver = null;
        }
        super.onDestroy();
    }
}
