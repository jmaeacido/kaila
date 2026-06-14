package com.kaila.marketplace;

import android.Manifest;
import android.content.ActivityNotFoundException;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
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
    private static String pendingLaunchAction = "";
    private static String pendingLaunchId = "";
    private static String pendingLaunchUrl = "";
    private static long pendingLaunchAt = 0;

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

        PendingIntent contentIntent = appIntent("open-call", callId, 7002);
        PendingIntent answerIntent = appIntent("answer-call", callId, 7003);
        PendingIntent declineIntent = appIntent("decline-call", callId, 7004);

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
            .setStyle(NotificationCompat.CallStyle.forIncomingCall(caller, declineIntent, answerIntent))
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
    public void cancelJobNotification(PluginCall call) {
        String requestId = call.getString("requestId", call.getString("id", ""));
        NotificationManagerCompat.from(getContext()).cancel(KailaMessagingService.jobNotificationId(requestId));
        call.resolve();
    }

    @PluginMethod
    public void consumeLaunchAction(PluginCall call) {
        JSObject result = new JSObject();
        result.put("action", pendingLaunchAction);
        result.put("id", pendingLaunchId);
        result.put("url", pendingLaunchUrl);
        result.put("createdAt", pendingLaunchAt);
        pendingLaunchAction = "";
        pendingLaunchId = "";
        pendingLaunchUrl = "";
        pendingLaunchAt = 0;
        call.resolve(result);
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

    @PluginMethod
    public void getAppInfo(PluginCall call) {
        JSObject result = new JSObject();
        try {
            PackageInfo info = getContext().getPackageManager().getPackageInfo(getContext().getPackageName(), 0);
            long versionCode = Build.VERSION.SDK_INT >= Build.VERSION_CODES.P ? info.getLongVersionCode() : info.versionCode;
            result.put("versionCode", versionCode);
            result.put("versionName", info.versionName);
            result.put("packageName", getContext().getPackageName());
        } catch (PackageManager.NameNotFoundException error) {
            result.put("versionCode", 0);
            result.put("versionName", "");
            result.put("packageName", getContext().getPackageName());
        }
        call.resolve(result);
    }

    @PluginMethod
    public void openUrl(PluginCall call) {
        String url = call.getString("url", "");
        if (url.trim().isEmpty()) {
            call.reject("URL is required");
            return;
        }
        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);
        call.resolve();
    }

    @PluginMethod
    public void openFacebookLogin(PluginCall call) {
        String url = call.getString("url", "");
        if (url.trim().isEmpty()) {
            call.reject("Facebook login URL is required");
            return;
        }
        boolean preferBrowser = Boolean.TRUE.equals(call.getBoolean("preferBrowser", false));
        if (preferBrowser) {
            openFacebookBrowserLogin(call, url);
            return;
        }

        Intent appIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("fb://facewebmodal/f?href=" + Uri.encode(url)));
        appIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        String[] facebookPackages = new String[] {
            "com.facebook.katana",
            "com.facebook.lite",
            "com.facebook.wakizashi"
        };
        for (String packageName : facebookPackages) {
            try {
                Intent packagedIntent = new Intent(appIntent);
                packagedIntent.setPackage(packageName);
                getContext().startActivity(packagedIntent);
                JSObject result = new JSObject();
                result.put("opened", true);
                result.put("target", packageName);
                call.resolve(result);
                return;
            } catch (ActivityNotFoundException | SecurityException ignored) {
                // Try the next installed Facebook package, then the browser fallback.
            }
        }

        try {
            openFacebookBrowserLogin(call, url);
        } catch (ActivityNotFoundException error) {
            call.reject("No app can open Facebook login");
        }
    }

    private void openFacebookBrowserLogin(PluginCall call, String url) {
        Intent browserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
        browserIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(browserIntent);
        JSObject result = new JSObject();
        result.put("opened", true);
        result.put("target", "browser");
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

    private PendingIntent appIntent(String action, String callId, int requestCode) {
        Intent intent = new Intent(getContext(), MainActivity.class);
        intent.setAction(Intent.ACTION_MAIN);
        intent.addCategory(Intent.CATEGORY_LAUNCHER);
        intent.putExtra("kailaAction", action);
        intent.putExtra("kailaCallId", callId);
        intent.putExtra("kailaId", callId);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        return PendingIntent.getActivity(getContext(), requestCode, intent, PendingIntent.FLAG_UPDATE_CURRENT | pendingIntentImmutableFlag());
    }

    static void captureLaunchIntent(Intent intent) {
        if (intent == null) return;
        String action = value(intent.getStringExtra("kailaAction"), "");
        String id = value(intent.getStringExtra("kailaCallId"), value(intent.getStringExtra("kailaId"), ""));
        String url = intent.getDataString() == null ? "" : intent.getDataString();
        if (action.isEmpty() && id.isEmpty() && url.isEmpty()) return;
        if ("answer-call".equals(action) || "decline-call".equals(action)) {
            // Remove the native ringing notification immediately; the web call
            // surface will finish answer/reject once the WebView is active.
        }
        pendingLaunchAction = action;
        pendingLaunchId = id;
        pendingLaunchUrl = url;
        pendingLaunchAt = System.currentTimeMillis();
    }

    private static String value(String value, String fallback) {
        return value == null || value.trim().isEmpty() ? fallback : value;
    }
}
