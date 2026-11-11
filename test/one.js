const {chromium}=require('playwright');const {spawn}=require('child_process');const path=require('path');
(async()=>{const srv=spawn('python3',['-m','http.server','8852'],{cwd:path.join(__dirname,'..'),stdio:'ignore'});await new Promise(r=>setTimeout(r,800));
 const b=await chromium.launch();const p=await b.newPage();await p.goto('http://localhost:8852/test/img.html');await p.evaluate(()=>init());
 const r=await p.evaluate(async()=>{const t='בְּרֵאשִׁ֖ית בָּרָ֣א אֱלֹהִ֑ים אֵ֥ת הַשָּׁמַ֖יִם וְאֵ֥ת הָאָֽרֶץ׃';const out=[];for(const sz of [34,46,64]){const svg=BL.render(t,{script:'heb',size:sz,width:900,noCant:true,theme:'parchment'});const id=await rasterise(svg,1,'png');const r=BL.readImage(id,'heb');out.push(sz+' '+r.text+' | '+BL.stripCantillation(t));}return out;});
 console.log(r.join('\n'));await b.close();srv.kill();})();
