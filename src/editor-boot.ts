/**
 * Runs in the proxied tweakcn document before its bundles.
 * Registers the host app theme as a saved preset named from package.json.
 */
export const EDITOR_BOOT_SCRIPT = `(function(){
  var KEY="tweakcn-devtools-app-theme";
  var seeded=false;
  function read(){
    try{return JSON.parse(localStorage.getItem(KEY)||"null")}catch(e){return null}
  }
  function same(a,b){return JSON.stringify(a)===JSON.stringify(b)}
  function apply(){
    var app=read();
    if(!app||!app.id||!app.styles)return false;
    var presets=globalThis.__tdPresetStore;
    var editor=globalThis.__tdEditorStore;
    if(presets){
      presets.getState().registerPreset(app.id,{
        label:app.label||app.id,
        styles:app.styles,
        source:"SAVED",
        createdAt:app.createdAt||"2020-01-01T00:00:00.000Z"
      });
    }
    if(editor&&!seeded){
      seeded=true;
      var state=editor.getState();
      var current=state.themeState||{};
      if(current.preset!==app.id||!same(current.styles,app.styles)){
        var next={
          styles:app.styles,
          currentMode:current.currentMode||"light",
          hslAdjustments:current.hslAdjustments||{hueShift:0,saturationScale:1,lightnessScale:1},
          preset:app.id
        };
        editor.setState({themeState:next,themeCheckpoint:next,history:[],future:[]});
      }
    }
    return !!(presets&&editor);
  }
  globalThis.__tdApplyAppTheme=apply;
  var started=Date.now();
  var timer=setInterval(function(){
    if(apply()||Date.now()-started>8000)clearInterval(timer);
  },50);
})();`;
