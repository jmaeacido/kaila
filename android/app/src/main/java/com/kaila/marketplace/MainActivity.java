package com.kaila.marketplace;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.webkit.WebSettings;
import android.webkit.WebView;

import androidx.core.app.NotificationManagerCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final int INCOMING_CALL_NOTIFICATION_ID = 7001;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(KailaNativePlugin.class);
        clearCallNotificationForAction(getIntent());
        clearJobNotificationForAction(getIntent());
        KailaNativePlugin.captureLaunchIntent(getIntent());
        super.onCreate(savedInstanceState);

        WebView webView = getBridge().getWebView();
        if (webView == null) return;

        WebSettings settings = webView.getSettings();
        settings.setSaveFormData(true);
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            webView.setImportantForAutofill(View.IMPORTANT_FOR_AUTOFILL_YES);
            settings.setOffscreenPreRaster(true);
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        clearCallNotificationForAction(intent);
        clearJobNotificationForAction(intent);
        KailaNativePlugin.captureLaunchIntent(intent);
    }

    private void clearCallNotificationForAction(Intent intent) {
        if (intent == null) return;
        String action = intent.getStringExtra("kailaAction");
        if (!"answer-call".equals(action) && !"decline-call".equals(action) && !"open-call".equals(action)) return;
        NotificationManagerCompat.from(this).cancel(INCOMING_CALL_NOTIFICATION_ID);
    }

    private void clearJobNotificationForAction(Intent intent) {
        if (intent == null) return;
        String action = intent.getStringExtra("kailaAction");
        if (!"job-request".equals(action) && !"clear-job-request".equals(action)) return;
        String requestId = intent.getStringExtra("kailaId");
        NotificationManagerCompat.from(this).cancel(KailaMessagingService.jobNotificationId(requestId));
    }
}
