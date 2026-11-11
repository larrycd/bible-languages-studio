// node gencases.js N seed > cases.json : random verses (up to 14 words) in each script
const fs=require('fs'),path=require('path');const N=+process.argv[2]||40;let seed=+process.argv[3]||5;const rnd=()=>{seed=(seed*1103515245+12345)%2147483648;return seed/2147483648;};
const books=JSON.parse(fs.readFileSync(path.join(__dirname,'../src/app/data/books.json')));const out=[];const themes=['parchment','scroll','stone','night'],scales=[0.75,1,1.5,2];
for(let i=0;i<N;i++){const kind=['heb','phn','grk','lxx'][i%4];const pool=books.filter(b=>kind==='heb'||kind==='phn'?b.corpus==='ot':kind==='grk'?b.corpus==='nt':b.corpus==='lxx');const b=pool[Math.floor(rnd()*pool.length)];
 const d=JSON.parse(fs.readFileSync(path.join(__dirname,'../src/app/data/text',b.corpus+'_'+(b.corpus==='lxx'?b.id.slice(3):b.id)+'.json')));const chs=Object.keys(d);const c=chs[Math.floor(rnd()*chs.length)];const vs=Object.keys(d[c]);const v=vs[Math.floor(rnd()*vs.length)];
 const ws=d[c][v].map(w=>w[0].replace(/\//g,'')).slice(0,14);out.push([b.id+' '+c+':'+v,ws.join(' ').replace(/\u05BE\s+/g,'\u05BE'),kind==='lxx'?'grk':kind,themes[Math.floor(rnd()*4)],scales[Math.floor(rnd()*4)],rnd()<0.5?'png':'jpeg',0.8]);}
console.log(JSON.stringify(out));
