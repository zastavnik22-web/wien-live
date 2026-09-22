export function parseCSV(text) {
  const rows=[]; let row=[], value="", quoted=false;
  for(let i=0;i<text.length;i++){const c=text[i];
    if(quoted){if(c==='"'&&text[i+1]==='"'){value+='"';i++;}else if(c==='"')quoted=false;else value+=c;}
    else if(c==='"')quoted=true; else if(c===';'){row.push(value.trim());value="";}
    else if(c==='\n'){row.push(value.trim());if(row.some(Boolean))rows.push(row);row=[];value="";}
    else if(c!=='\r')value+=c;
  }
  if(value||row.length){row.push(value.trim());rows.push(row);} if(!rows.length)return[];
  const h=rows.shift().map(x=>x.replace(/^\uFEFF/,"")); return rows.map(r=>Object.fromEntries(h.map((k,i)=>[k,r[i]??""])));
}
export const norm=v=>String(v??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/ß/g,"ss").replace(/[^a-z0-9]+/g," ").trim();
export function pick(row,names){const wanted=names.map(norm);const key=Object.keys(row).find(k=>wanted.includes(norm(k)));return key?row[key]:"";}
