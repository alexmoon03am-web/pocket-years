package studio.pocketyears.game;

import android.app.Activity;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.webkit.WebSettings;
import android.webkit.WebView;

public final class MainActivity extends Activity {
    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        Window window = getWindow();
        window.setStatusBarColor(0xfff8f6ee);
        window.setNavigationBarColor(0xfff8f6ee);
        window.getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);

        WebView game = new WebView(this);
        game.setId(1);
        game.setBackgroundColor(0xfff8f6ee);
        WebSettings settings = game.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setBlockNetworkLoads(true);
        new SaveFiles().install(this, game);
        setContentView(game);
        game.loadUrl("file:///android_asset/index.html");
    }

    @Override
    public void onBackPressed() {
        WebView game = (WebView) findViewById(1);
        if (game != null && game.canGoBack()) {
            game.goBack();
            return;
        }
        super.onBackPressed();
    }
}
