"""Compile the game's native document-picker fragment with the pinned AOSP dx compiler."""
import hashlib
from pathlib import Path
import shutil
import subprocess
from zipfile import ZipFile

# Compile-time Android API declarations. The device supplies the implementations.
API = {
    'android.os.Bundle': 'public class Bundle { public boolean getBoolean(String k){return false;} public void putBoolean(String k,boolean v){} }',
    'android.app.Fragment': '''public class Fragment {
        public Activity getActivity(){return null;} public void onCreate(android.os.Bundle s){}
        public void onSaveInstanceState(android.os.Bundle s){} public void startActivityForResult(android.content.Intent i,int r){}
        public void onActivityResult(int r,int s,android.content.Intent i){} }''',
    'android.app.FragmentManager': 'public abstract class FragmentManager { public abstract Fragment findFragmentByTag(String t); public abstract FragmentTransaction beginTransaction(); }',
    'android.app.FragmentTransaction': 'public abstract class FragmentTransaction { public abstract FragmentTransaction add(Fragment f,String t); public abstract void commitNow(); }',
    'android.app.Activity': '''public class Activity extends android.content.Context {
        public static final int RESULT_OK=-1; public FragmentManager getFragmentManager(){return null;}
        public void runOnUiThread(Runnable r){} }''',
    'android.content.Context': '''public class Context { public java.io.File getFilesDir(){return null;}
        public ContentResolver getContentResolver(){return null;} }''',
    'android.content.ContentResolver': '''public abstract class ContentResolver {
        public final java.io.InputStream openInputStream(android.net.Uri u) throws java.io.FileNotFoundException{return null;}
        public final java.io.OutputStream openOutputStream(android.net.Uri u,String m) throws java.io.FileNotFoundException{return null;} }''',
    'android.content.Intent': '''public class Intent {
        public static final String ACTION_CREATE_DOCUMENT="android.intent.action.CREATE_DOCUMENT",ACTION_OPEN_DOCUMENT="android.intent.action.OPEN_DOCUMENT",CATEGORY_OPENABLE="android.intent.category.OPENABLE",EXTRA_TITLE="android.intent.extra.TITLE";
        public Intent(String cmd){} public Intent addCategory(String c){return this;} public Intent setType(String t){return this;}
        public Intent putExtra(String k,String v){return this;} public android.net.Uri getData(){return null;} }''',
    'android.net.Uri': 'public abstract class Uri {}',
    'android.webkit.JavascriptInterface': '@java.lang.annotation.Retention(java.lang.annotation.RetentionPolicy.RUNTIME) public @interface JavascriptInterface {}',
    'android.webkit.ValueCallback': 'public interface ValueCallback<T> { void onReceiveValue(T value); }',
    'android.webkit.WebView': '''public class WebView { public void addJavascriptInterface(Object o,String n){}
        public String getUrl(){return null;} public void evaluateJavascript(String js,ValueCallback<String> cb){} }''',
    'android.widget.Toast': 'public class Toast { public static final int LENGTH_LONG=1; public static Toast makeText(android.content.Context c,CharSequence s,int d){return null;} public void show(){} }'
}

def compile_files(source, temp):
    folder=Path(temp)/'native-picker'
    api=folder/'api'
    out=folder/'classes'
    out.mkdir(parents=True)
    files=[]
    for name,definition in API.items():
        dest=api/(name.replace('.','/')+'.java')
        dest.parent.mkdir(parents=True,exist_ok=True)
        dest.write_text('package '+name.rsplit('.',1)[0]+';\n'+definition)
        files.append(str(dest))
    javac=[shutil.which('javac')] if shutil.which('javac') else ['java','-m','jdk.compiler/com.sun.tools.javac.Main']
    subprocess.run(javac+['-source','8','-target','8','-Xlint:-options','-g:none','-d',str(out)]+files+[str(source)],check=True)
    compiler=Path(__file__).parent/'vendor/dx.jar'
    if hashlib.sha256(compiler.read_bytes()).hexdigest()!='5f37023cdab507f4f2ece1c80dabd056254e30cc9f4aef39dd84c4e0a0031615':
        raise ValueError('AOSP dx checksum mismatch')
    archive=folder/'picker.jar'
    with ZipFile(archive,'w') as jar:
        for path in (out/'studio').rglob('*.class'):jar.write(path,path.relative_to(out))
    dest=folder/'classes2.dex'
    subprocess.run(['java','-cp',str(compiler),'com.android.dx.command.Main','--dex','--no-optimize','--output='+str(dest),str(archive)],check=True)
    return dest.read_bytes()
