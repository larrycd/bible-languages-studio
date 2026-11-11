const {chromium}=require('playwright');const {spawn}=require('child_process');const path=require('path');const cases=JSON.parse(require('fs').readFileSync(process.argv[2],'utf8'));
(async()=>{const srv=spawn('python3',['-m','http.server','8851'],{cwd:path.join(__dirname,'..'),stdio:'ignore'});await new Promise(r=>setTimeout(r,800));
 const b=await chromium.launch();const p=await b.newPage();await p.goto('http://localhost:8851/test/img.html');console.log('templates ms',await p.evaluate(()=>init()));
 const tot={};for(const c of cases){const r=await p.evaluate(c=>run(...c.slice(1)),c);const k=c[2]+(c[0].startsWith('LXX')?'(LXX)':'');tot[k]=tot[k]||[0,0,0,0];tot[k][0]++;if(r.exact)tot[k][1]++;if(r.letters)tot[k][2]++;if(!r.exact&&(!r.got||r.unc>0))tot[k][3]++;
  console.log((r.exact?'OK  ':r.letters?'LETT':'FAIL'),c[0],c[2],c[3],c[4],c[5],r.w+'x'+r.h,'conf',r.conf,'unc',r.unc,r.ms+'ms');if(!r.exact)console.log('   want',r.want,'\n   got ',r.got||r.reason);}
 for(const k in tot)console.log('TOTAL',k,'cases',tot[k][0],'exact',tot[k][1],'letters-right',tot[k][2],'misses-flagged',tot[k][3]);await b.close();srv.kill();})();
