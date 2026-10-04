const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const root=path.join(__dirname,'matchday-studio'),ts=require(path.join(root,'node_modules/typescript')),React=require(path.join(root,'node_modules/react')),render=require(path.join(root,'node_modules/react-dom/server')).renderToStaticMarkup;
const original=Module._resolveFilename;
Module._resolveFilename=function(request,parent,...rest){if(request.startsWith('@/'))request=path.join(root,'src',request.slice(2));if(request.endsWith('.png?inline'))return path.resolve(path.dirname(parent.filename),request.slice(0,-7));return original.call(this,request,parent,...rest);};
require.extensions['.png']=(m,f)=>m.exports='data:image/png;base64,'+fs.readFileSync(f).toString('base64');
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,f);
const {PosterSVG}=require(path.join(root,'src/components/formation/PosterSVG.tsx'));
const data={matchNumber:1,matchTitle:'Test <script>',matchDate:'2026-10-04',startTime:'20:00',endTime:'21:00',venue:'Doha & QFK',description:'Friendly',teamAName:'Team A',teamBName:'Team B',teamAPrimary:'#00f',teamASecondary:'#fff',teamAText:'#fff',teamAGK:'#000',teamBPrimary:'#fff',teamBSecondary:'#000',teamBText:'#000',teamBGK:'#000',teamAFormation:null,teamBFormation:null,players:[]};
for(const theme of ['stadium','matchday','split','premium','community','dynamic'])test('Cloud poster '+theme+' renders portable SVG with shared logo and escaped text',()=>{const s=render(React.createElement(PosterSVG,{data,theme}));assert.match(s,/viewBox="0 0 2400 3200"/);assert.match(s,/data:image\/png;base64,/);assert.doesNotMatch(s,/<foreignObject|<script>/);assert.match(s,/Doha &amp; QFK/);});
test('Export encodes before reporting completion and uses full-size SVG',()=>{const s=fs.readFileSync(path.join(root,'src/lib/poster-export.ts'),'utf8');assert.match(s,/clone.style.width = '2400px'/);assert.match(s,/clone.style.height = '3200px'/);assert.match(s,/await new Promise<Blob>/);assert.match(s,/PNG encoding failed/);});
test('App uses Finance theme loader and saved preference',()=>{assert.match(fs.readFileSync(path.join(root,'index.html'),'utf8'),/src="\.\.\/theme.js"/);assert.match(fs.readFileSync(path.join(root,'src/App.tsx'),'utf8'),/window.QFKTheme\?\.set/);});
test('Match form preserves edit values and requires key details',()=>{const {MatchForm}=require(path.join(root,'src/components/formation/MatchForm.tsx'));const s=render(React.createElement(MatchForm,{initial:{match_number:18,venue:'Doha'},formations:[],onSubmit:()=>{},onCancel:()=>{}}));assert.match(s,/type="number"[^>]*value="18"/);assert.ok((s.match(/required=""/g)||[]).length>=8);assert.match(s,/value="Doha"/);});
test('Poster scales to its container while keeping portrait proportions',()=>{const s=render(React.createElement(PosterSVG,{data,theme:'split'}));assert.match(s,/max-width:100%;height:auto;aspect-ratio:2400\/3200/);});
const {downloadPosterPNG}=require(path.join(root,'src/lib/poster-export.ts'));
test('PNG export waits for encoding and downloads full-size image',async()=>{
 const old={document:global.document,Image:global.Image,XMLSerializer:global.XMLSerializer};let encode,clicked=false,dimensions;
 const clone={style:{},setAttribute(){}};
 global.XMLSerializer=class{serializeToString(){return '<svg xmlns="http://www.w3.org/2000/svg"/>';}};
 global.Image=class{set src(v){queueMicrotask(()=>this.onload());}};
 global.document={createElement(tag){if(tag==='a')return{click(){clicked=true;}};return{getContext(){return{fillRect(){},drawImage(){}};},toBlob(cb){dimensions=[this.width,this.height];encode=cb;}};}};
 try{let done=false;const pending=downloadPosterPNG({cloneNode:()=>clone},'test.png').then(()=>done=true);await new Promise(r=>setImmediate(r));assert.equal(done,false);assert.equal(clicked,false);assert.deepEqual(dimensions,[2400,3200]);encode(new Blob(['png']));await pending;assert.equal(clicked,true);assert.equal(done,true);}finally{Object.assign(global,old);}
});
test('PNG export reports encoding failures instead of fake success',async()=>{
 const old={document:global.document,Image:global.Image,XMLSerializer:global.XMLSerializer};global.XMLSerializer=class{serializeToString(){return '<svg/>';}};global.Image=class{set src(v){queueMicrotask(()=>this.onload());}};global.document={createElement(){return{getContext(){return{fillRect(){},drawImage(){}};},toBlob(cb){cb(null);}};}};
 try{await assert.rejects(downloadPosterPNG({cloneNode:()=>({style:{},setAttribute(){}})},'test.png'),/PNG encoding failed/);}finally{Object.assign(global,old);}
});
