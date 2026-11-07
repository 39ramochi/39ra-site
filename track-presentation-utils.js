/* Public track presentation helpers. Catalog records remain the source of truth. */
(function(global){
  const isoDate=/^(\d{4})-(\d{2})-(\d{2})$/;
  function dateParts(value){
    const match=typeof value==='string'?value.match(isoDate):null;
    if(!match)return null;
    const year=Number(match[1]),month=Number(match[2]),day=Number(match[3]);
    const date=new Date(0);
    date.setUTCFullYear(year,month-1,day);
    date.setUTCHours(0,0,0,0);
    if(date.getUTCFullYear()!==year||date.getUTCMonth()!==month-1||date.getUTCDate()!==day)return null;
    return {time:date.getTime(),label:`${match[1]}.${match[2]}.${match[3]}`};
  }
  function publishTime(value){return dateParts(value)?.time??null}
  function formatReleaseDate(value){return dateParts(value)?.label??null}
  function sortNewestFirst(items,sourceOrder){return [...items].sort((a,b)=>{
    const at=publishTime(a?.publishedAt),bt=publishTime(b?.publishedAt);
    if(at!==null&&bt!==null)return at===bt?sourceOrder.get(a?.id)-sourceOrder.get(b?.id):bt-at;
    if(at!==null)return-1;
    if(bt!==null)return 1;
    return sourceOrder.get(a?.id)-sourceOrder.get(b?.id);
  })}
  function sunoOfficialUrl(value){
    try{
      const url=new URL(value),host=url.hostname.toLowerCase();
      if(url.protocol!=='https:'||!['suno.com','www.suno.com'].includes(host))return null;
      const share=/^\/s\/[A-Za-z0-9]+\/?$/;
      const song=/^\/song\/[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}\/?$/i;
      return share.test(url.pathname)||song.test(url.pathname)?url.href:null;
    }catch{return null}
  }
  global.TrackPresentationUtils=Object.freeze({publishTime,formatReleaseDate,sortNewestFirst,sunoOfficialUrl});
})(window);
