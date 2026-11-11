require('./hb.js')().then(B=>{
const cases=[['heb','בְּרֵאשִׁ֖ית בָּרָ֣א אֱלֹהִ֑ים אֵ֥ת הַשָּׁמַ֖יִם וְאֵ֥ת הָאָֽרֶץ׃'],['heb','שְׁמַע יִשְׂרָאֵל יְהוָה אֱלֹהֵינוּ יְהוָה אֶחָד'],['grk','Ἐν ἀρχῇ ἦν ὁ λόγος, καὶ ὁ λόγος ἦν πρὸς τὸν θεόν, καὶ θεὸς ἦν ὁ λόγος.'],['phn','בְּרֵאשִׁית בָּרָא אֱלֹהִים'],['grk','Ἰησοῦς Χριστὸς υἱὸς θεοῦ σωτήρ· ᾠδή ᾅδης Ὑψίστου ῥῆμα ἀΐδιος']];
let ok=0;for(const [sc,t] of cases){const svg=B.render(t,{script:sc,size:40,width:700,sep:true});const r=B.readSVG(svg);const want=(sc==='phn'?B.toPaleo(t,true):t).normalize('NFC');const same=r.text.replace(/\s+/g,' ')===want.replace(/\s+/g,' ');ok+=same;console.log(sc, r.ok, same, same?'':JSON.stringify(r.text.replace(/\s+/g,' '))+'\n want '+JSON.stringify(want));}
console.log('svg',ok,'/',cases.length);});
