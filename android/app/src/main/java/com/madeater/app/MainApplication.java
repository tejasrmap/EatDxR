package com.madeater.app;

import android.app.Application;
import com.onesignal.OneSignal;
import com.onesignal.debug.LogLevel;

public class MainApplication extends Application {
    // OneSignal App ID provided by user
    public static final String ONESIGNAL_APP_ID = "56fec73b-c36f-4a1b-be32-272b1f4d6729";

    @Override
    public void onCreate() {
        super.onCreate();

        // Verbose logging for debug verification
        OneSignal.getDebug().setLogLevel(LogLevel.VERBOSE);

        // OneSignal Initialization
        OneSignal.initWithContext(this, ONESIGNAL_APP_ID);
    }
}
