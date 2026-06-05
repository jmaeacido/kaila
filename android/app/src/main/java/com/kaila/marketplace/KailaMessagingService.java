package com.kaila.marketplace;

import android.Manifest;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.net.Uri;
import android.os.Build;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.app.Person;
import androidx.core.content.ContextCompat;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import java.util.Map;

public class KailaMessagingService extends FirebaseMessagingService {
    private static final String CALL_CHANNEL_ID = "kaila-native-calls";
    private static final String JOB_CHANNEL_ID = "kaila-job-alerts";
    private static final String ALERT_CHANNEL_ID = "kaila-push-alerts";
    private static final int CALL_NOTIFICATION_ID = 7001;

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        Map<String, String> data = remoteMessage.getData();
        if (!notificationsAllowed()) return;
        createChannels();
        if ("call".equals(data.get("type"))) showIncomingCall(data);
        else showAlert(data);
    }

    private void showIncomingCall(Map<String, String> data) {
        String callerName = value(data.get("callerName"), "KAILA contact");
        String callType = value(data.get("callType"), "audio");
        String callId = data.get("callId");
        boolean ordinary = isPhoneAlreadyInCall();
        PendingIntent contentIntent = appIntent("open-call", callId, 7101);
        PendingIntent answerIntent = appIntent("answer-call", callId, 7102);
        PendingIntent declineIntent = appIntent("decline-call", callId, 7103);
        Person caller = new Person.Builder().setName(callerName).setImportant(true).build();
        String title = "Incoming KAILA " + ("video".equals(callType) ? "video call" : "audio call");

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CALL_CHANNEL_ID)
            .setSmallIcon(R.drawable.kaila_notification_icon)
            .setContentTitle(title)
            .setContentText(callerName + " is calling.")
            .setStyle(NotificationCompat.CallStyle.forIncomingCall(caller, declineIntent, answerIntent))
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setOngoing(!ordinary)
            .setAutoCancel(ordinary)
            .setContentIntent(contentIntent)
            .setColor(ContextCompat.getColor(this, R.color.ic_launcher_background))
            .setVibrate(new long[] { 0, 450, 180, 450, 180, 700 });

        if (!ordinary) builder.setFullScreenIntent(contentIntent, true);
        NotificationManagerCompat.from(this).notify(CALL_NOTIFICATION_ID, builder.build());
    }

    private void showAlert(Map<String, String> data) {
        String type = value(data.get("type"), "");
        boolean jobRequest = "request".equals(type);
        String title = value(data.get("title"), jobRequest ? "New KAILA job request" : "KAILA");
        String body = value(data.get("body"), "New KAILA update");
        PendingIntent contentIntent = appIntent(jobRequest ? "job-request" : value(data.get("action"), "open-notifications"), data.get("requestId"), 7201);
        int notificationId = Math.abs(value(data.get("messageId"), title + body).hashCode());

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, jobRequest ? JOB_CHANNEL_ID : ALERT_CHANNEL_ID)
            .setSmallIcon(R.drawable.kaila_notification_icon)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
            .setCategory(jobRequest ? NotificationCompat.CATEGORY_STATUS : NotificationCompat.CATEGORY_MESSAGE)
            .setPriority(jobRequest ? NotificationCompat.PRIORITY_MAX : NotificationCompat.PRIORITY_HIGH)
            .setVisibility(jobRequest ? NotificationCompat.VISIBILITY_PUBLIC : NotificationCompat.VISIBILITY_PRIVATE)
            .setAutoCancel(true)
            .setContentIntent(contentIntent)
            .setColor(ContextCompat.getColor(this, R.color.ic_launcher_background))
            .setVibrate(jobRequest ? new long[] { 0, 500, 120, 500, 120, 700 } : new long[] { 0, 280, 90, 280 })
            .addAction(R.drawable.kaila_notification_icon, jobRequest ? "View request" : "Open KAILA", contentIntent);

        NotificationManagerCompat.from(this).notify(notificationId, builder.build());
    }

    private PendingIntent appIntent(String action, String id, int requestCode) {
        Intent intent = new Intent(this, MainActivity.class);
        intent.setAction(Intent.ACTION_MAIN);
        intent.addCategory(Intent.CATEGORY_LAUNCHER);
        intent.putExtra("kailaAction", action);
        intent.putExtra("kailaId", id);
        intent.putExtra("kailaCallId", id);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        return PendingIntent.getActivity(this, requestCode, intent, PendingIntent.FLAG_UPDATE_CURRENT | pendingIntentImmutableFlag());
    }

    private void createChannels() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) return;
        if (manager.getNotificationChannel(CALL_CHANNEL_ID) == null) {
            NotificationChannel channel = new NotificationChannel(CALL_CHANNEL_ID, "KAILA incoming calls", NotificationManager.IMPORTANCE_HIGH);
            channel.setDescription("Full-screen KAILA incoming audio and video calls.");
            channel.enableVibration(true);
            channel.setVibrationPattern(new long[] { 0, 450, 180, 450, 180, 700 });
            channel.setLockscreenVisibility(android.app.Notification.VISIBILITY_PUBLIC);
            channel.setSound(rawSound("kaila_call"), new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE).setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build());
            manager.createNotificationChannel(channel);
        }
        if (manager.getNotificationChannel(ALERT_CHANNEL_ID) == null) {
            NotificationChannel channel = new NotificationChannel(ALERT_CHANNEL_ID, "KAILA push alerts", NotificationManager.IMPORTANCE_HIGH);
            channel.setDescription("Messages, requests, offers, and job updates.");
            channel.enableVibration(true);
            channel.setSound(rawSound("kaila_notification"), new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_NOTIFICATION).setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build());
            manager.createNotificationChannel(channel);
        }
        if (manager.getNotificationChannel(JOB_CHANNEL_ID) == null) {
            NotificationChannel channel = new NotificationChannel(JOB_CHANNEL_ID, "KAILA job requests", NotificationManager.IMPORTANCE_HIGH);
            channel.setDescription("Urgent provider alerts for new matching job requests.");
            channel.enableVibration(true);
            channel.setVibrationPattern(new long[] { 0, 500, 120, 500, 120, 700 });
            channel.setLockscreenVisibility(android.app.Notification.VISIBILITY_PUBLIC);
            channel.setSound(rawSound("kaila_notification"), new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_NOTIFICATION).setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build());
            manager.createNotificationChannel(channel);
        }
    }

    private Uri rawSound(String name) {
        return Uri.parse("android.resource://" + getPackageName() + "/raw/" + name);
    }

    private boolean isPhoneAlreadyInCall() {
        AudioManager audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
        if (audioManager == null) return false;
        int mode = audioManager.getMode();
        return mode == AudioManager.MODE_IN_CALL || mode == AudioManager.MODE_IN_COMMUNICATION || mode == AudioManager.MODE_CALL_SCREENING;
    }

    private boolean notificationsAllowed() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) return true;
        return checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == android.content.pm.PackageManager.PERMISSION_GRANTED;
    }

    private int pendingIntentImmutableFlag() {
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0;
    }

    private String value(String value, String fallback) {
        return value == null || value.trim().isEmpty() ? fallback : value;
    }
}
