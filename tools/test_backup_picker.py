"""Run the shipping Java document picker against a disposable JVM document provider."""
from pathlib import Path
import shutil
import subprocess
import tempfile
from backup_dex import API

ROOT=Path(__file__).resolve().parents[1]
TEST_API=dict(API)
TEST_API.update({
    'android.os.Bundle': '''public class Bundle {
      private boolean value; public boolean getBoolean(String k){return value;}
      public void putBoolean(String k,boolean v){value=v;} }''',
    'android.app.Fragment': '''public class Fragment {
      public static Activity host; public static android.content.Intent intent; public static int launches,request;
      public Activity getActivity(){return host;} public void onCreate(android.os.Bundle b){}
      public void onSaveInstanceState(android.os.Bundle b){} public void onActivityResult(int r,int s,android.content.Intent i){}
      public void startActivityForResult(android.content.Intent i,int r){intent=i;request=r;launches++;} }''',
    'android.app.Activity': '''public class Activity extends android.content.Context {
      public static final int RESULT_OK=-1; public FragmentManager getFragmentManager(){return null;}
      public void runOnUiThread(Runnable r){r.run();} }''',
    'android.content.ContentResolver': '''public abstract class ContentResolver {
      public abstract java.io.InputStream openInputStream(android.net.Uri u) throws java.io.FileNotFoundException;
      public abstract java.io.OutputStream openOutputStream(android.net.Uri u,String mode) throws java.io.FileNotFoundException; }''',
    'android.content.Intent': '''public class Intent {
      public static final String ACTION_CREATE_DOCUMENT="android.intent.action.CREATE_DOCUMENT",ACTION_OPEN_DOCUMENT="android.intent.action.OPEN_DOCUMENT",
        CATEGORY_OPENABLE="android.intent.category.OPENABLE",EXTRA_TITLE="android.intent.extra.TITLE";
      public String action,type,category,title;public android.net.Uri data;
      public Intent(String a){action=a;}public Intent addCategory(String c){category=c;return this;}
      public Intent setType(String t){type=t;return this;}public Intent putExtra(String k,String v){title=v;return this;}
      public android.net.Uri getData(){return data;} }''',
    'android.widget.Toast': '''public class Toast {public static final int LENGTH_LONG=1; public static String last;
      public static Toast makeText(android.content.Context c,CharSequence m,int t){last=m.toString();return new Toast();} public void show(){} }'''
})
HARNESS=r'''
import android.app.*;
import android.content.*;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.*;
import android.widget.Toast;
import java.io.*;
import java.nio.charset.StandardCharsets;
import studio.pocketyears.game.SaveFiles;

public class PickerHarness {
  static void check(boolean ok,String what){if(!ok)throw new AssertionError(what);}
  static class Documents extends ContentResolver{
    byte[] input;ByteArrayOutputStream output=new ByteArrayOutputStream();String mode;
    public InputStream openInputStream(Uri uri) throws FileNotFoundException{
      if(input==null)throw new FileNotFoundException();
      return new ByteArrayInputStream(input);
    }
    public OutputStream openOutputStream(Uri uri,String mode){this.mode=mode;output.reset();return output;}
  }
  static class Host extends Activity{
    final File files; final Documents docs; Fragment mounted;
    Host(File dir,Documents d){files=dir;docs=d;}
    public File getFilesDir(){return files;}
    public ContentResolver getContentResolver(){return docs;}
    public FragmentManager getFragmentManager(){return new FragmentManager(){
      public Fragment findFragmentByTag(String tag){return mounted;}
      public FragmentTransaction beginTransaction(){return new FragmentTransaction(){
        public FragmentTransaction add(Fragment f,String tag){mounted=f;return this;}
        public void commitNow(){}
      };}
    };}
  }
  static class Screen extends WebView{
    SaveFiles.Bridge bridge;String url="file:///android_asset/index.html#life",callback;
    public String getUrl(){return url;}
    public void addJavascriptInterface(Object b,String n){check(n.equals("PocketFiles"),"bridge name");bridge=(SaveFiles.Bridge)b;}
    public void evaluateJavascript(String js,ValueCallback<String> cb){callback=js;}
  }
  public static void main(String[] args)throws Exception{
    File dir=new File(args[0]);Documents docs=new Documents();Host host=new Host(dir,docs);
    Screen screen=new Screen();Fragment.host=host;SaveFiles picker=new SaveFiles();picker.install(host,screen);
    Intent result=new Intent("result");result.data=new Uri(){};
    String payload="{\"name\":\"寿子\",\"value\":173}";
    screen.url="https://outside.invalid/";screen.bridge.exportFile(payload);check(Fragment.launches==0,"local origin");
    screen.url="file:///android_asset/index.html#assets";screen.bridge.exportFile(payload);
    check(Fragment.launches==1&&Fragment.request==41&&Fragment.intent.action.equals(Intent.ACTION_CREATE_DOCUMENT),"create chooser");
    check("application/json".equals(Fragment.intent.type)&&"Pocket-Years-backup.json".equals(Fragment.intent.title),"export type and name");
    check(Intent.CATEGORY_OPENABLE.equals(Fragment.intent.category),"openable");
    screen.bridge.importFile();check(Fragment.launches==1,"no overlapping picker");
    Bundle flags=new Bundle();picker.onSaveInstanceState(flags);
    host=new Host(dir,docs);Fragment.host=host;picker=new SaveFiles();picker.onCreate(flags);screen=new Screen();picker.install(host,screen);
    screen.bridge.importFile();check(Fragment.launches==1,"restored waiting for result");picker.onActivityResult(41,-1,result);
    check("wt".equals(docs.mode)&&payload.equals(docs.output.toString("UTF-8")),"export completed after process recreation");
    check(!new File(dir,"pending-export.json").exists(),"export cleaned");
    screen.bridge.exportFile("second");picker.onActivityResult(41,0,null);
    check(!new File(dir,"pending-export.json").exists()&&payload.equals(docs.output.toString("UTF-8")),"cancel kept existing document");
    screen.bridge.importFile();check(Fragment.request==42&&Fragment.intent.action.equals(Intent.ACTION_OPEN_DOCUMENT),"open chooser");
    docs.input=payload.getBytes(StandardCharsets.UTF_8);picker.onActivityResult(42,-1,result);
    check(payload.equals(screen.bridge.pending())&&screen.callback.contains("pocketFileReady"),"import staged with callback");
    docs.input=new byte[8*1024*1024+1];screen.bridge.importFile();picker.onActivityResult(42,-1,result);
    check(payload.equals(screen.bridge.pending())&&Toast.last.contains("could not"),"oversize did not replace valid staged file");
    host=new Host(dir,docs);Fragment.host=host;picker=new SaveFiles();screen=new Screen();picker.install(host,screen);
    check(payload.equals(screen.bridge.pending()),"unconfirmed file survived restart");screen.bridge.consumed();check(screen.bridge.pending().isEmpty(),"consumed once");
    docs.input=null;screen.bridge.importFile();picker.onActivityResult(42,-1,result);check(screen.bridge.pending().isEmpty(),"provider refusal kept existing saves");
    System.out.println("PASS native document picker export/import, local origin, UTF-8, stalled chooser, process recreation, cancellation, invalid provider, oversize rejection and atomic pending files.");
  }
}
'''

def main():
    with tempfile.TemporaryDirectory() as directory:
        root=Path(directory)
        classes=root/'classes'
        files=root/'files'
        classes.mkdir()
        files.mkdir()
        inputs=[]
        for name,body in TEST_API.items():
            file=root/'api'/(name.replace('.','/')+'.java')
            file.parent.mkdir(parents=True,exist_ok=True)
            file.write_text('package '+name.rsplit('.',1)[0]+';\n'+body)
            inputs.append(str(file))
        harness=root/'PickerHarness.java'
        harness.write_text(HARNESS)
        inputs.extend([str(harness),str(ROOT/'app/src/main/java/studio/pocketyears/game/SaveFiles.java')])
        javac=[shutil.which('javac')] if shutil.which('javac') else ['java','-m','jdk.compiler/com.sun.tools.javac.Main']
        subprocess.run(javac+['-source','8','-target','8','-Xlint:-options','-d',str(classes)]+inputs,check=True)
        subprocess.run(['java','-cp',str(classes),'PickerHarness',str(files)],check=True)

if __name__=='__main__':
    main()
