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

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.firebase.FirebaseApp;

@CapacitorPlugin(name = "KailaNative")
public class KailaNativePlugin extends Plugin {
    private static final String CALL_CHANNEL_ID = "kaila-native-calls";
    private static final int INCOMING_CALL_NOTIFICATION_ID = 7001;

    @Override
    public void load() {
        super.load();
        createCallChannel();
    }

    @PluginMethod
    public void showIncomingCall(PluginCall call) {
        String callerName = call.getString("callerName", "KAILA contact");
        String callType = call.getString("callType", "audio");
        String callId = call.getString("callId", "");
        boolean inOtherCall = isPhoneAlreadyInCall();

        if (!notificationsAllowed()) {
            JSObject result = new JSObject();
            result.put("shown", false);
            result.put("reason", "notifications_disabled");
            call.resolve(result);
            return;
        }

        Intent intent = new Intent(getContext(), MainActivity.class);
        intent.setAction(Intent.ACTION_MAIN);
        intent.addCategory(Intent.CATEGORY_LAUNCHER);
        intent.putExtra("kailaAction", "open-call");
        intent.putExtra("kailaCallId", callId);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        PendingIntent contentIntent = PendingIntent.getActivity(
            getContext(),
            7002,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | pendingIntentImmutableFlag()
        );

        Person caller = new Person.Builder()
            .setName(callerName)
            .setImportant(true)
            .build();

        String title = "Incoming KAILA " + ("video".equals(callType) ? "video call" : "audio call");
        String text = callerName + " is calling.";

        NotificationCompat.Builder builder = new NotificationCompat.Builder(getContext(), CALL_CHANNEL_ID)
            .setSmallIcon(R.drawable.kaila_notification_icon)
            .setContentTitle(title)
            .setContentText(text)
            .setStyle(NotificationCompat.CallStyle.forIncomingCall(caller, contentIntent, contentIntent))
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setOngoing(!inOtherCall)
            .setAutoCancel(inOtherCall)
            .setContentIntent(contentIntent)
            .setColor(ContextCompat.getColor(getContext(), R.color.ic_launcher_background))
            .setVibrate(new long[] { 0, 450, 180, 450, 180, 700 });

        if (!inOtherCall) {
            builder.setFullScreenIntent(contentIntent, true);
        }

        NotificationManagerCompat.from(getContext()).notify(INCOMING_CALL_NOTIFICATION_ID, builder.build());

        JSObject result = new JSObject();
        result.put("shown", true);
        result.put("fullScreen", !inOtherCall);
        result.put("ordinaryNotification", inOtherCall);
        call.resolve(result);
    }

    @PluginMethod
    public void cancelIncomingCall(PluginCall call) {
        NotificationManagerCompat.from(getContext()).cancel(INCOMING_CALL_NOTIFICATION_ID);
        call.resolve();
    }

    @PluginMethod
    public void isFirebaseAvailable(PluginCall call) {
        JSObject result = new JSObject();
        try {
            result.put("available", FirebaseApp.getInstance() != null);
        } catch (IllegalStateException error) {
            result.put("available", false);
        }
        call.resolve(result);
    }

    private void createCallChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager manager = (NotificationManager) getContext().getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null || manager.getNotificationChannel(CALL_CHANNEL_ID) != null) return;

        NotificationChannel channel = new NotificationChannel(
            CALL_CHANNEL_ID,
            "KAILA incoming calls",
            NotificationManager.IMPORTANCE_HIGH
        );
        channel.setDescription("Full-screen KAILA incoming audio and video calls.");
        channel.enableVibration(true);
        channel.setVibrationPattern(new long[] { 0, 450, 180, 450, 180, 700 });
        channel.setLockscreenVisibility(android.app.Notification.VISIBILITY_PUBLIC);

        Uri soundUri = Uri.parse("android.resource://" + getContext().getPackageName() + "/raw/kaila_call");
        AudioAttributes attributes = new AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build();
        channel.setSound(soundUri, attributes);
        manager.createNotificationChannel(channel);
    }

    private boolean isPhoneAlreadyInCall() {
        AudioManager audioManager = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
        if (audioManager == null) return false;
        int mode = audioManager.getMode();
        return mode == AudioManager.MODE_IN_CALL || mode == AudioManager.MODE_IN_COMMUNICATION || mode == AudioManager.MODE_CALL_SCREENING;
    }

    private boolean notificationsAllowed() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) return true;
        return getContext().checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == android.content.pm.PackageManager.PERMISSION_GRANTED;
    }

    private int pendingIntentImmutableFlag() {
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0;
    }
}
