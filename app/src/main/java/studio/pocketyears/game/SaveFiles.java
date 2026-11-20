package studio.pocketyears.game;

import android.app.Activity;
import android.app.Fragment;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.widget.Toast;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

/** A system document picker for the bundled offline game. Storage access is scoped to the user's chosen file. */
public final class SaveFiles extends Fragment {
    private static final int EXPORT = 41;
    private static final int IMPORT = 42;
    private static final int LIMIT = 8 * 1024 * 1024;
    private static final String TAG = "pocket-years-files";
    private WebView game;
    private File directory;
    private boolean busy;

    public void install(Activity host, WebView view) {
        SaveFiles owner = (SaveFiles) host.getFragmentManager().findFragmentByTag(TAG);
        if (owner == null) {
            owner = this;
            host.getFragmentManager().beginTransaction().add(owner, TAG).commitNow();
        }
        owner.game = view;
        owner.directory = host.getFilesDir();
        view.addJavascriptInterface(owner.new Bridge(), "PocketFiles");
    }

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        busy = state != null && state.getBoolean("choosing");
    }
    @Override public void onSaveInstanceState(Bundle state) {
        super.onSaveInstanceState(state);
        state.putBoolean("choosing", busy);
    }

    public final class Bridge {
        @JavascriptInterface public void exportFile(final String json) {
            final Activity host = getActivity();
            if (host == null || json == null || json.length() > LIMIT) return;
            host.runOnUiThread(new Runnable() { public void run() { choose(EXPORT, json); } });
        }
        @JavascriptInterface public void importFile() {
            final Activity host = getActivity();
            if (host != null) host.runOnUiThread(new Runnable() { public void run() { choose(IMPORT, null); } });
        }
        @JavascriptInterface public String pending() {
            if (directory == null) return "";
            File file = new File(directory, "pending-import.json");
            if (!file.isFile()) return "";
            try (InputStream in = new FileInputStream(file)) {
                return new String(read(in), StandardCharsets.UTF_8);
            } catch (IOException ignored) { return ""; }
        }
        @JavascriptInterface public void consumed() {
            if (directory != null) new File(directory, "pending-import.json").delete();
        }
    }

    private static byte[] read(InputStream in) throws IOException {
        if (in == null) throw new IOException("Unreadable file");
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        byte[] buffer = new byte[8192];
        int count;
        while ((count = in.read(buffer)) != -1) {
            if (out.size() + count > LIMIT) throw new IOException("File too large");
            out.write(buffer, 0, count);
        }
        return out.toByteArray();
    }
    private void stage(String name, byte[] bytes) throws IOException {
        if (bytes.length > LIMIT) throw new IOException("File too large");
        File temp = new File(directory, name + ".tmp");
        try (FileOutputStream out = new FileOutputStream(temp)) { out.write(bytes); out.getFD().sync(); }
        if (!temp.renameTo(new File(directory, name))) throw new IOException("Could not stage backup");
    }
    private void choose(int action, String json) {
        Activity host = getActivity();
        if (busy || host == null || game == null || game.getUrl() == null || !"file:///android_asset/index.html".equals(game.getUrl().split("#", 2)[0])) return;
        try {
            Intent intent = new Intent(action == EXPORT ? Intent.ACTION_CREATE_DOCUMENT : Intent.ACTION_OPEN_DOCUMENT);
            intent.addCategory(Intent.CATEGORY_OPENABLE);
            intent.setType(action == EXPORT ? "application/json" : "*/*");
            if (action == EXPORT) {
                stage("pending-export.json", json.getBytes(StandardCharsets.UTF_8));
                intent.putExtra(Intent.EXTRA_TITLE, "Pocket-Years-backup.json");
            }
            busy = true;
            startActivityForResult(intent, action);
        } catch (Exception e) {
            busy = false;
            notifyUser("Could not open the file picker.");
        }
    }
    private void notifyUser(String text) {
        Activity host = getActivity();
        if (host != null) Toast.makeText(host, text, Toast.LENGTH_LONG).show();
    }
    @Override public void onActivityResult(int request, int result, Intent data) {
        super.onActivityResult(request, result, data);
        if (request != IMPORT && request != EXPORT) return;
        busy = false;
        Activity host = getActivity();
        if (host == null) return;
        directory = host.getFilesDir();
        File staged = new File(directory, "pending-export.json");
        try {
            if (result != Activity.RESULT_OK || data == null) return;
            Uri uri = data.getData();
            if (uri == null) return;
            if (request == EXPORT) {
                try (InputStream in = new FileInputStream(staged);
                     OutputStream out = host.getContentResolver().openOutputStream(uri, "wt")) {
                    if (out == null) throw new IOException("File not writable");
                    out.write(read(in)); out.flush();
                }
                notifyUser("Pocket Years backup exported.");
            } else {
                try (InputStream in = host.getContentResolver().openInputStream(uri)) {
                    stage("pending-import.json", read(in));
                }
                if (game != null) game.evaluateJavascript("if(window.pocketFileReady) window.pocketFileReady()", null);
            }
        } catch (Exception e) {
            notifyUser("The backup file could not be transferred.");
        } finally {
            if (request == EXPORT) staged.delete();
        }
    }
}
