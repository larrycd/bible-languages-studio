// SVG round trip over Bible verses: node corpusrt.js N seed
const fs=require('fs'),path=require('path');
require('./hb.js')().then(B=>{
 const N=+process.argv[2]||300; let seed=+process.argv[3]||7; const rnd=()=>{seed=(seed*1103515245+12345)%2147483648;return seed/2147483648;};
 const books=JSON.parse(fs.readFileSync(path.join(__dirname,'../src/app/data/books.json')));const cache={};
 const res={heb:[0,0],grk:[0,0],phn:[0,0],lxx:[0,0]};const fails=[];
 for(let i=0;i<N;i++){const b=books[Math.floor(rnd()*books.length)];const f=path.join(__dirname,'../src/app/data/text',b.corpus+'_'+(b.corpus==='lxx'?b.id.slice(3):b.id)+'.json');const d=cache[f]||(cache[f]=JSON.parse(fs.readFileSync(f)));
  const chs=Object.keys(d);const c=chs[Math.floor(rnd()*chs.length)];const vs=Object.keys(d[c]);const v=vs[Math.floor(rnd()*vs.length)];
  const words=d[c][v].map(w=>w[0].replace(/\//g,''));let text=b.lang==='heb'?B.joinWords(words):words.join(' ');
  const kinds=b.lang==='heb'?['heb','phn']:[b.corpus==='lxx'?'lxx':'grk'];
  for(const k of kinds){const sc=k==='lxx'?'grk':k;const svg=B.render(text,{script:sc,size:36,width:900,sep:true});const r=B.readSVG(svg);const want=(sc==='phn'?B.toPaleo(text,true):sc==='grk'?text.normalize('NFC'):text).normalize('NFC').replace(/\s+/g,' ');
   const got=(r.text||'').replace(/\s+/g,' ');res[k][1]++;if(got===want)res[k][0]++;else if(fails.length<12){const G=Array.from(got),Wt=Array.from(want);let i=0;while(i<G.length&&G[i]===Wt[i])i++;fails.push(b.id+' '+c+':'+v+' '+k+' at '+i+': got '+JSON.stringify(G.slice(i,i+4).join(''))+' want '+JSON.stringify(Wt.slice(i,i+4).join('')));}}}
 console.log(JSON.stringify(res));fails.forEach(f=>console.log(f));});
