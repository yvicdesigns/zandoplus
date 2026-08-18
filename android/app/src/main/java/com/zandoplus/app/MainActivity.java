package com.zandoplus.app;

import android.os.Build;
import android.os.Bundle;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Only Android 15+ (API 35, VANILLA_ICE_CREAM) forces edge-to-edge rendering.
        // On older OS versions the system already reserves space for the status/nav
        // bars by default — opting into setDecorFitsSystemWindows(false) there just
        // pushes the WebView's own bottom nav bar under the system nav bar instead
        // (regression seen on a Galaxy S9+ running an older Android version).
        if (Build.VERSION.SDK_INT >= 35) {
            WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
            ViewCompat.setOnApplyWindowInsetsListener(getBridge().getWebView(), (view, windowInsets) -> {
                Insets systemBars = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars());
                view.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
                return WindowInsetsCompat.CONSUMED;
            });
        }
    }
}
