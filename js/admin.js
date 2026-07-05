/* Peksu Yönetim Paneli */
(function () {
  'use strict';

  // Varsayılan şifre: peksu2026  (değiştirmek için yeni şifrenin SHA-256'sını buraya yaz)
  var PASS_HASH = 'a042a9ad533c05e6abaaef55a44c10bd5383d1fba9d38b5592f645076ec5150c';
  var LS_CFG = 'peksu_gh_cfg';
  var SS_AUTH = 'peksu_auth';

  var state = null; // düzenlenen içerik

  /* ---------- yardımcılar ---------- */
  function escH(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function escA(s){ return escH(s).replace(/"/g,'&quot;'); }
  function getPath(o,p){ return p.split('.').reduce(function(a,k){return a==null?undefined:a[k];},o); }
  function setPath(o,p,v){
    var ks=p.split('.'), c=o;
    for(var i=0;i<ks.length-1;i++){
      var k=ks[i];
      if(c[k]==null) c[k]=/^\d+$/.test(ks[i+1])?[]:{};
      c=c[k];
    }
    c[ks[ks.length-1]]=v;
  }
  async function sha256(str){
    var buf=await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(function(b){return b.toString(16).padStart(2,'0');}).join('');
  }
  function b64(str){ return btoa(unescape(encodeURIComponent(str))); }
  function status(el,msg,type){
    el.className='status show '+(type||'info');
    el.textContent=msg;
    if(type==='ok'){ setTimeout(function(){el.className='status';},6000); }
  }

  /* ---------- şifre kapısı ---------- */
  var gate=document.getElementById('gate'), app=document.getElementById('app');
  function unlock(){ gate.style.display='none'; app.hidden=false; init(); }
  if(sessionStorage.getItem(SS_AUTH)==='1'){ unlock(); }

  document.getElementById('gateForm').addEventListener('submit', async function(e){
    e.preventDefault();
    var err=document.getElementById('gateErr');
    var h=await sha256(document.getElementById('gatePass').value);
    if(h===PASS_HASH){ sessionStorage.setItem(SS_AUTH,'1'); unlock(); }
    else { err.textContent='Şifre hatalı, tekrar deneyin.'; }
  });
  document.getElementById('logoutBtn') && document.getElementById('logoutBtn').addEventListener('click', function(){
    sessionStorage.removeItem(SS_AUTH); location.reload();
  });

  /* ---------- dizi editör tanımları ---------- */
  var ICON_KEYS = 'drink, use, pool, construction, site, hotel, droplet';
  var objArrays = {
    'heroStats':       { add:'İstatistik Ekle', fields:[{k:'value',l:'Değer',ph:'25+'},{k:'label',l:'Etiket',ph:'Yıllık Deneyim'}] },
    'services.items':  { add:'Hizmet Ekle', fields:[{k:'icon',l:'İkon anahtarı ('+ICON_KEYS+')',ph:'drink'},{k:'title',l:'Başlık',ph:'İçme Suyu'},{k:'desc',l:'Açıklama',type:'area'}] },
    'steps.items':     { add:'Adım Ekle', fields:[{k:'title',l:'Başlık',ph:'Sipariş Oluşturun'},{k:'desc',l:'Açıklama',type:'area'}] },
    'about.badges':    { add:'Rozet Ekle', fields:[{k:'value',l:'Değer',ph:'25+'},{k:'label',l:'Etiket',ph:'Yıl Deneyim'}] },
    'fleet.items':     { add:'Araç Ekle', fields:[{k:'cap',l:'Kapasite',ph:'6'},{k:'unit',l:'Birim',ph:'ton'},{k:'desc',l:'Açıklama',type:'area'}] },
    'faq.items':       { add:'Soru Ekle', fields:[{k:'q',l:'Soru'},{k:'a',l:'Cevap',type:'area'}] }
  };
  var strArrays = {
    'regions.items':   { add:'Bölge Ekle', ph:'Bölge adı', wide:false },
    'about.features':  { add:'Özellik Ekle', ph:'Özellik metni', wide:true },
    'quality.points':  { add:'Madde Ekle', ph:'Analiz maddesi', wide:true },
    'order.waterTypes':{ add:'Su Türü Ekle', ph:'Kullanma Suyu', wide:false }
  };

  /* ---------- alan üreticiler ---------- */
  function inp(path,label,ph){ var v=getPath(state,path); v=v==null?'':v;
    return '<div class="field"><label>'+escH(label)+'</label><input data-path="'+path+'" value="'+escA(v)+'" placeholder="'+escA(ph||'')+'"></div>'; }
  function area(path,label,ph){ var v=getPath(state,path); v=v==null?'':v;
    return '<div class="field ga-full"><label>'+escH(label)+'</label><textarea data-path="'+path+'" placeholder="'+escA(ph||'')+'">'+escH(v)+'</textarea></div>'; }

  function objItems(p){
    var cfg=objArrays[p], arr=getPath(state,p)||[];
    return arr.map(function(it,i){
      var fields=cfg.fields.map(function(f){
        var fp=p+'.'+i+'.'+f.k;
        return f.type==='area'?area(fp,f.l,f.ph):inp(fp,f.l,f.ph);
      }).join('');
      return '<div class="rep-item"><div class="rep-head"><span class="num">'+(i+1)+'</span>'+
        '<span class="drag">☰</span><button type="button" class="btn btn-danger btn-sm" data-del="'+p+'|'+i+'">Sil</button></div>'+
        '<div class="grid2">'+fields+'</div></div>';
    }).join('');
  }
  function strItems(p){
    var cfg=strArrays[p], arr=getPath(state,p)||[];
    if(cfg.wide){
      return arr.map(function(v,i){
        return '<div class="rep-item"><div class="grid2"><div class="field ga-full" style="margin:0"><input data-path="'+p+'.'+i+'" value="'+escA(v)+'" placeholder="'+escA(cfg.ph)+'"></div></div>'+
          '<div style="margin-top:8px"><button type="button" class="btn btn-danger btn-sm" data-del="'+p+'|'+i+'">Sil</button></div></div>';
      }).join('');
    }
    return arr.map(function(v,i){
      return '<span class="chip"><input data-path="'+p+'.'+i+'" value="'+escA(v)+'" placeholder="'+escA(cfg.ph)+'"><button type="button" data-del="'+p+'|'+i+'">×</button></span>';
    }).join('');
  }
  function arrayEditor(p){
    var isObj=!!objArrays[p], cfg=isObj?objArrays[p]:strArrays[p];
    var inner=isObj?objItems(p):strItems(p);
    var wrapCls=(!isObj && !cfg.wide)?'chips':'';
    return '<div class="'+wrapCls+'" id="cont-'+p+'">'+inner+'</div>'+
      '<button type="button" class="btn btn-outline btn-sm rep-add" data-add="'+p+'">+ '+escH(cfg.add)+'</button>';
  }
  function renderArrayInner(p){
    var el=document.getElementById('cont-'+p);
    if(el) el.innerHTML=objArrays[p]?objItems(p):strItems(p);
  }

  function panel(title,body,collapsed){
    return '<section class="panel'+(collapsed?' collapsed':'')+'"><div class="panel-head" data-toggle><h2>'+escH(title)+
      '</h2><span class="chev">▾</span></div><div class="panel-body">'+body+'</div></section>';
  }

  /* ---------- GitHub ayar paneli ---------- */
  function ghPanel(){
    var cfg=JSON.parse(localStorage.getItem(LS_CFG)||'{}');
    return panel('⚙ GitHub Bağlantısı (kaydetmek için gerekli)',
      '<div class="grid3">'+
        '<div class="field"><label>Kullanıcı/Org (owner)</label><input id="ghOwner" value="'+escA(cfg.owner||'')+'" placeholder="gkslavcii"></div>'+
        '<div class="field"><label>Depo (repo)</label><input id="ghRepo" value="'+escA(cfg.repo||'')+'" placeholder="peksu"></div>'+
        '<div class="field"><label>Dal (branch)</label><input id="ghBranch" value="'+escA(cfg.branch||'main')+'" placeholder="main"></div>'+
      '</div>'+
      '<div class="grid2">'+
        '<div class="field"><label>Dosya yolu</label><input id="ghPath" value="'+escA(cfg.path||'data/content.json')+'"></div>'+
        '<div class="field"><label>Erişim Token (PAT)</label><input id="ghToken" type="password" value="'+escA(cfg.token||'')+'" placeholder="ghp_..."><div class="hint">Sadece bu tarayıcıda saklanır. Fine-grained token + Contents: Read/Write yetkisi yeterli.</div></div>'+
      '</div>'+
      '<button type="button" class="btn btn-outline btn-sm" data-action="test">🔌 Bağlantıyı Test Et</button> '+
      '<span class="status" id="ghTest"></span>',
    true);
  }
  function readCfg(){
    var cfg={ owner:val('ghOwner'), repo:val('ghRepo'), branch:val('ghBranch')||'main', path:val('ghPath')||'data/content.json', token:val('ghToken') };
    localStorage.setItem(LS_CFG, JSON.stringify(cfg));
    return cfg;
  }
  function val(id){ var e=document.getElementById(id); return e?e.value.trim():''; }
  function ghHeaders(token){ return { 'Authorization':'Bearer '+token, 'Accept':'application/vnd.github+json' }; }

  /* ---------- formu kur ---------- */
  function buildForm(){
    var f=document.getElementById('form');
    f.innerHTML =
      ghPanel() +
      panel('🏷 Genel',
        inp('brand.name','Firma Adı','Peksu') +
        inp('brand.slogan','Slogan','Temiz su, kapınıza kadar.')) +
      panel('🌊 Hero (üst bölüm)',
        inp('hero.eyebrow','Üst etiket') +
        '<div class="grid3">'+inp('hero.titleLead','Başlık 1. kısım')+inp('hero.titleHighlight','Vurgulu kelime')+inp('hero.titleTail','Başlık son kısım')+'</div>'+
        area('hero.lead','Açıklama') +
        '<div class="grid2">'+inp('hero.primaryBtn','Ana buton')+inp('hero.secondaryBtn','İkincil buton')+'</div>'+
        '<label class="field" style="font-weight:700">İstatistikler</label>'+arrayEditor('heroStats')) +
      panel('📞 İletişim Bilgileri',
        '<div class="grid2">'+
          inp('contact.phoneDisplay','Telefon (görünen)','0 (5xx) xxx xx xx') +
          inp('contact.phoneHref','Telefon (arama no)','+905xxxxxxxxx') +
        '</div><div class="grid2">'+
          inp('contact.whatsapp','WhatsApp no (90 ile)','905xxxxxxxxx') +
          inp('contact.email','E-posta','info@peksu.com') +
        '</div><div class="grid2">'+
          inp('contact.instagram','Instagram adresi','https://instagram.com/peksu') +
          inp('contact.hours','Çalışma Saatleri','7/24 Açık') +
        '</div>'+
        inp('contact.address','Adres')) +
      panel('💧 Hizmetler',
        inp('services.eyebrow','Üst etiket')+inp('services.title','Başlık')+area('services.subtitle','Alt açıklama')+
        arrayEditor('services.items')) +
      panel('🔢 Nasıl Çalışır (adımlar)',
        inp('steps.eyebrow','Üst etiket')+inp('steps.title','Başlık')+arrayEditor('steps.items')) +
      panel('📍 Hizmet Bölgeleri',
        inp('regions.eyebrow','Üst etiket')+inp('regions.title','Başlık')+area('regions.subtitle','Alt açıklama')+
        arrayEditor('regions.items')) +
      panel('🧪 Su Kalitesi & Analiz',
        inp('quality.eyebrow','Üst etiket')+inp('quality.title','Başlık')+area('quality.text','Metin')+
        '<label class="field" style="font-weight:700">Maddeler</label>'+arrayEditor('quality.points')+
        '<div class="grid2" style="margin-top:14px">'+inp('quality.ctaLabel','Buton yazısı','Analiz Raporunu Talep Et')+inp('quality.requestMessage','Talep WhatsApp mesajı')+'</div>') +
      panel('🛒 Sipariş Formu (WhatsApp popup)',
        '<div class="grid2">'+inp('order.title','Başlık','Hızlı Sipariş')+inp('order.subtitle','Alt açıklama')+'</div>'+
        '<div class="grid2">'+inp('order.maxQuantity','Maksimum miktar','20')+inp('order.unitLabel','Birim','ton')+'</div>'+
        inp('order.messageIntro','Mesaj giriş cümlesi',"Merhaba, Peksu'dan su siparişi vermek istiyorum.")+
        '<label class="field" style="font-weight:700">Su Türleri</label>'+arrayEditor('order.waterTypes')) +
      panel('ℹ Hakkımızda',
        inp('about.eyebrow','Üst etiket')+inp('about.title','Başlık')+area('about.text','Metin')+
        '<label class="field" style="font-weight:700">Özellikler</label>'+arrayEditor('about.features')+
        '<label class="field" style="font-weight:700;margin-top:14px">Rozetler</label>'+arrayEditor('about.badges')) +
      panel('🚚 Araç Filosu',
        inp('fleet.eyebrow','Üst etiket')+inp('fleet.title','Başlık')+area('fleet.subtitle','Alt açıklama')+
        arrayEditor('fleet.items')) +
      panel('❓ Sıkça Sorulan Sorular',
        inp('faq.eyebrow','Üst etiket')+inp('faq.title','Başlık')+arrayEditor('faq.items')) +
      panel('✉ İletişim Bölümü (alt CTA)',
        inp('contactSection.eyebrow','Üst etiket')+inp('contactSection.title','Başlık')+area('contactSection.text','Metin'));
  }

  /* ---------- olay dinleyiciler ---------- */
  function bindEvents(){
    var f=document.getElementById('form');
    f.addEventListener('input', function(e){
      var el=e.target.closest('[data-path]');
      if(el) setPath(state, el.getAttribute('data-path'), el.value);
    });
    f.addEventListener('click', function(e){
      var t=e.target.closest('[data-toggle]');
      if(t){ t.parentElement.classList.toggle('collapsed'); return; }
      var add=e.target.closest('[data-add]');
      if(add){ var p=add.getAttribute('data-add'); var arr=getPath(state,p)||[];
        if(objArrays[p]){ var o={}; objArrays[p].fields.forEach(function(fl){o[fl.k]='';}); arr.push(o); }
        else { arr.push(''); }
        setPath(state,p,arr); renderArrayInner(p); return; }
      var del=e.target.closest('[data-del]');
      if(del){ var parts=del.getAttribute('data-del').split('|'); var pp=parts[0]; var idx=+parts[1];
        var a=getPath(state,pp); a.splice(idx,1); renderArrayInner(pp); return; }
      var act=e.target.closest('[data-action]');
      if(act && act.getAttribute('data-action')==='test'){ testConnection(); }
    });

    document.getElementById('saveBtn').addEventListener('click', saveGitHub);
    document.getElementById('downloadBtn').addEventListener('click', downloadJSON);
    document.getElementById('reloadBtn').addEventListener('click', function(){
      if(confirm('Kaydedilmemiş değişiklikler silinsin ve son kayıtlı içerik yüklensin mi?')) loadContent();
    });
  }

  /* ---------- GitHub işlemleri ---------- */
  async function testConnection(){
    var t=document.getElementById('ghTest'); var cfg=readCfg();
    if(!cfg.owner||!cfg.repo||!cfg.token){ status(t,'Owner, repo ve token gerekli.','err'); return; }
    status(t,'Kontrol ediliyor...','info');
    try{
      var r=await fetch('https://api.github.com/repos/'+cfg.owner+'/'+cfg.repo, { headers: ghHeaders(cfg.token) });
      if(r.ok){ status(t,'Bağlantı başarılı ✓','ok'); }
      else { status(t,'Hata: '+r.status+' — token/owner/repo kontrol edin.','err'); }
    }catch(err){ status(t,'Ağ hatası: '+err.message,'err'); }
  }

  async function saveGitHub(){
    var s=document.getElementById('saveStatus'); var cfg=readCfg();
    if(!cfg.owner||!cfg.repo||!cfg.token){ status(s,'GitHub bağlantı bilgileri eksik (⚙ bölümü).','err'); return; }
    var url='https://api.github.com/repos/'+cfg.owner+'/'+cfg.repo+'/contents/'+cfg.path;
    status(s,'Kaydediliyor...','info');
    try{
      var sha=null;
      var g=await fetch(url+'?ref='+encodeURIComponent(cfg.branch), { headers: ghHeaders(cfg.token) });
      if(g.ok){ sha=(await g.json()).sha; }
      else if(g.status!==404){ throw new Error('Dosya okunamadı ('+g.status+')'); }
      var body={ message:'İçerik güncellendi (yönetim paneli)', content:b64(JSON.stringify(state,null,2)), branch:cfg.branch };
      if(sha) body.sha=sha;
      var p=await fetch(url, { method:'PUT', headers: ghHeaders(cfg.token), body: JSON.stringify(body) });
      if(!p.ok){ var e=await p.json().catch(function(){return {};}); throw new Error(e.message||('HTTP '+p.status)); }
      status(s,'Kaydedildi ✓ Site ~1 dakika içinde güncellenir.','ok');
    }catch(err){ status(s,'Kaydedilemedi: '+err.message,'err'); }
  }

  function downloadJSON(){
    var blob=new Blob([JSON.stringify(state,null,2)], {type:'application/json'});
    var a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='content.json'; a.click();
    URL.revokeObjectURL(a.href);
  }

  /* ---------- içerik yükle ---------- */
  function loadContent(){
    fetch('data/content.json',{cache:'no-store'})
      .then(function(r){ if(!r.ok) throw new Error('content.json yüklenemedi'); return r.json(); })
      .then(function(d){ state=d; buildForm(); status(document.getElementById('topStatus'),'İçerik yüklendi','ok'); })
      .catch(function(err){ state={}; buildForm(); status(document.getElementById('topStatus'),'Uyarı: '+err.message,'err'); });
  }

  var started=false;
  function init(){ if(started) return; started=true; loadContent(); bindEvents(); }
})();
