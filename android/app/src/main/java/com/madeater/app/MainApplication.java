package com.madeater.app;

import android.app.Application;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;

public class MainApplication extends Application {
    public static final String CHANNEL_ID = "madeater_messages";

    @Override
    public void onCreate() {
        super.onCreate();

        // Create high-importance WhatsApp-style notification channel natively for FCM
        createNotificationChannel();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            CharSequence name = "Direct Messages";
            String description = "Instant foodie direct messages and food critic alerts";
            int importance = NotificationManager.IMPORTANCE_HIGH; // WhatsApp heads-up banner

            NotificationChannel channel = new NotificationChannel(CHANNEL_ID, name, importance);
            channel.setDescription(description);
            channel.enableVibration(true);
            channel.setVibrationPattern(new long[]{0, 250, 100, 250}); // WhatsApp-style double buzz
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC); // Lock screen display
            channel.enableLights(true);
            channel.setLightColor(0xFFF97316); // Brand orange

            Uri defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .setUsage(AudioAttributes.USAGE_NOTIFICATION_COMMUNICATION_INSTANT)
                .build();
            channel.setSound(defaultSoundUri, audioAttributes);

            NotificationManager notificationManager = getSystemService(NotificationManager.class);
            if (notificationManager != null) {
                notificationManager.createNotificationChannel(channel);
            }
        }
    }
}
