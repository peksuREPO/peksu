/* Peksu — içerik render + sipariş modalı + etkileşimler */
(function () {
  'use strict';

  var data = null;

  var esc = function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };
  function get(o, p) { return p.split('.').reduce(function (a, k) { return a == null ? undefined : a[k]; }, o); }
  function regionName(r) { return typeof r === 'string' ? r : (r && r.name) || ''; }
  function regionStreets(r) { return (r && typeof r === 'object' && Array.isArray(r.streets)) ? r.streets : []; }

  // Çizgi ikon seti (tek renk, emoji yok)
  var ICONS = {
    drink: '<path d="M5 4h14l-1.5 15a2 2 0 0 1-2 1.8H8.5a2 2 0 0 1-2-1.8L5 4Z"/><path d="M6 9h12"/>',
    use: '<rect x="5" y="8" width="14" height="12" rx="2"/><path d="M9 8V5h6v3"/><path d="M9 13h6"/>',
    pool: '<path d="M2 12c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2"/><path d="M2 17c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2"/>',
    construction: '<path d="M3 21h18"/><path d="M6 21V7l7-4v18"/><path d="M13 21V9l5 2v10"/>',
    site: '<path d="M4 16a8 8 0 0 1 16 0"/><path d="M12 8V5"/><path d="M9 5h6"/><path d="M2 16h20v2H2z"/>',
    hotel: '<path d="M4 21V4a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v17"/><path d="M9 21v-4h6v4"/><path d="M8 7h.01M12 7h.01M16 7h.01M8 11h.01M12 11h.01M16 11h.01"/>',
    droplet: '<path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11Z"/>'
  };
  function iconSvg(key) {
    var p = ICONS[key] || ICONS.droplet;
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>';
  }

  function brandHtml(name) {
    name = name || 'Peksu';
    if (name.length <= 2) return esc(name);
    return esc(name.slice(0, -2)) + '<span>' + esc(name.slice(-2)) + '</span>';
  }

  function fill(id, arr, tpl) {
    var el = document.getElementById(id);
    if (el) el.innerHTML = (arr || []).map(tpl).join('');
  }

  function render(d) {
    data = d;
    var c = d.contact || {};
    c.telHref = 'tel:' + (c.phoneHref || '');
    c.mailHref = 'mailto:' + (c.email || '');

    document.querySelectorAll('[data-field]').forEach(function (el) {
      var path = el.getAttribute('data-field');
      if (path === 'brand.nameHtml') { el.innerHTML = brandHtml(get(d, 'brand.name')); return; }
      var v = get(d, path);
      if (v != null) el.textContent = v;
    });
    document.querySelectorAll('[data-attr]').forEach(function (el) {
      el.getAttribute('data-attr').split(',').forEach(function (pair) {
        var i = pair.indexOf(':'); var attr = pair.slice(0, i).trim(); var v = get(d, pair.slice(i + 1).trim());
        if (v != null) el.setAttribute(attr, v);
      });
    });

    // Logo (varsa görsel, yoksa metin marka)
    var logo = get(d, 'brand.logo'), logoEl = document.getElementById('brandLogo');
    if (logo && logoEl) {
      logoEl.src = logo; logoEl.hidden = false;
      var dr = document.getElementById('brandDrop'), tx = document.getElementById('brandText');
      if (dr) dr.style.display = 'none';
      if (tx) tx.style.display = 'none';
    }

    fill('heroStats', d.heroStats, function (s) {
      return '<li><strong>' + esc(s.value) + '</strong><span>' + esc(s.label) + '</span></li>';
    });
    fill('servicesGrid', get(d, 'services.items'), function (s) {
      return '<article class="card service"><span class="icon-box">' + iconSvg(s.icon) +
        '</span><h3>' + esc(s.title) + '</h3><p>' + esc(s.desc) + '</p></article>';
    });
    fill('stepsGrid', get(d, 'steps.items'), function (s, i) {
      return '<div class="step"><span class="step-no">' + (i + 1) + '</span><h3>' + esc(s.title) + '</h3><p>' + esc(s.desc) + '</p></div>';
    });
    fill('regionList', get(d, 'regions.items'), function (r) { return '<li>' + esc(regionName(r)) + '</li>'; });
    fill('qualityPoints', get(d, 'quality.points'), function (p) { return '<li>' + esc(p) + '</li>'; });
    fill('featureList', get(d, 'about.features'), function (f) { return '<li>' + esc(f) + '</li>'; });
    fill('aboutBadges', get(d, 'about.badges'), function (b) {
      return '<div class="badge-card"><strong>' + esc(b.value) + '</strong><span>' + esc(b.label) + '</span></div>';
    });
    fill('whyGrid', get(d, 'about.why.items'), function (w) {
      return '<article class="card why-card"><span class="why-ic">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>' +
        '</span><h3>' + esc(w.title) + '</h3><p>' + esc(w.desc) + '</p></article>';
    });
    fill('fleetGrid', get(d, 'fleet.items'), function (f) {
      var imgs = Array.isArray(f.images) ? f.images.filter(Boolean) : (f.img ? [f.img] : []);
      var alt = esc(f.cap) + ' ' + esc(f.unit) + ' su tankeri';
      var photo = '';
      if (imgs.length) {
        var slides = imgs.map(function (src, i) {
          return '<img class="fg-slide' + (i === 0 ? ' active' : '') + '" src="' + esc(src) + '" alt="' + alt + '" loading="lazy">';
        }).join('');
        var dots = imgs.length > 1 ? '<div class="fg-dots">' + imgs.map(function (_, i) {
          return '<button type="button" class="fg-dot' + (i === 0 ? ' active' : '') + '" data-i="' + i + '" aria-label="Fotoğraf ' + (i + 1) + '"></button>';
        }).join('') + '</div>' : '';
        photo = '<div class="fleet-photo"><div class="fgal">' + slides + '</div>' + dots + '</div>';
      }
      return '<article class="card fleet' + (imgs.length ? ' has-photo' : '') + '">' + photo +
        '<div class="fleet-body"><span class="fleet-cap">' + esc(f.cap) + '<small>' + esc(f.unit) + '</small></span><p>' + esc(f.desc) + '</p></div></article>';
    });
    fill('faqList', get(d, 'faq.items'), function (f) {
      return '<details><summary>' + esc(f.q) + '</summary><p>' + esc(f.a) + '</p></details>';
    });

    document.title = (get(d, 'brand.name') || 'Peksu') + ' | Turgutreis Tanker Su | Kullanma Suyu | 7/24 Hizmet';
    buildOrderModal(d);
    initInteractions();
  }

  /* ---------- Sipariş modalı ---------- */
  var sel = { type: null, qty: null };
  function buildOrderModal(d) {
    var o = d.order || {};
    // Su türleri
    var wt = document.getElementById('optWaterType');
    if (wt) wt.innerHTML = (o.waterTypes || []).map(function (t, i) {
      return '<button type="button" class="opt' + (i === 0 ? ' sel' : '') + '" data-type="' + esc(t) + '">' + esc(t) + '</button>';
    }).join('');
    sel.type = (o.waterTypes && o.waterTypes[0]) || '';

    // Miktar: 1..max + ekstra aralıklar (20+, 50+...) + manuel giriş
    var max = parseInt(o.maxQuantity, 10) || 20;
    var qty = document.getElementById('optQty');
    var opts = '';
    for (var n = 1; n <= max; n++) opts += '<option value="' + n + '">' + n + '</option>';
    (o.extraQuantities || []).forEach(function (x) { opts += '<option value="' + esc(x) + '">' + esc(x) + '</option>'; });
    if (o.allowCustomQuantity !== false) opts += '<option value="__custom__">Diğer (elle gir)</option>';
    if (qty) qty.innerHTML = opts;
    var cust = document.getElementById('optQtyCustom');
    if (cust) { cust.hidden = true; cust.value = ''; }

    // Bölgeler
    var reg = document.getElementById('optRegion');
    if (reg) reg.innerHTML = (get(d, 'regions.items') || []).map(function (r) {
      var n = regionName(r);
      return '<option value="' + esc(n) + '">' + esc(n) + '</option>';
    }).join('');
  }

  function openM(id) { var m = document.getElementById(id); if (m) { m.classList.add('open'); m.setAttribute('aria-hidden', 'false'); } }
  function closeM() { document.querySelectorAll('.modal.open').forEach(function (m) { m.classList.remove('open'); m.setAttribute('aria-hidden', 'true'); }); }
  function contactWhatsApp() {
    var msg = get(data, 'contact.contactMessage') || 'Merhaba, bilgi almak istiyorum.';
    closeM();
    goWhatsApp(msg);
  }
  function qtyValue() {
    var q = document.getElementById('optQty');
    var v = q ? q.value : '';
    if (v === '__custom__') { var c = document.getElementById('optQtyCustom'); return (c && c.value) ? c.value.trim() : ''; }
    return v;
  }

  function waNumber() { return String(get(data, 'contact.whatsapp') || '').replace(/[^0-9]/g, ''); }

  function sendOrder() {
    var o = (data && data.order) || {};
    var note = ((document.getElementById('optNote') || {}).value || '').trim();
    var region = (document.getElementById('optRegion') || {}).value || '';
    var address = ((document.getElementById('optAddress') || {}).value || '').trim();
    var unit = o.unitLabel || 'ton';
    var lines = [
      o.messageIntro || 'Merhaba, su siparişi vermek istiyorum.',
      '',
      'Su Türü: ' + (sel.type || '-'),
      'Miktar: ' + (qtyValue() || '-') + ' ' + unit,
      'Bölge: ' + (region || '-')
    ];
    if (address) lines.push('Açık Adres: ' + address);
    if (note) lines.push('Not: ' + note);
    goWhatsApp(lines.join('\n'));
    closeM();
  }
  function goWhatsApp(text) {
    window.location.href = 'https://wa.me/' + waNumber() + '?text=' + encodeURIComponent(text);
  }

  function requestReport() {
    var msg = get(data, 'quality.requestMessage') || 'Merhaba, güncel su analiz raporunu talep etmek istiyorum.';
    goWhatsApp(msg);
  }

  /* ---------- Etkileşimler ---------- */
  var bound = false;
  function initInteractions() {
    if (!bound) {
      bound = true;
      // Global tıklama yakalama (modal aç/kapa, sipariş, rapor)
      document.addEventListener('click', function (e) {
        if (e.target.closest('[data-choice]')) { e.preventDefault(); openM('choiceModal'); return; }
        if (e.target.closest('[data-order]')) { e.preventDefault(); closeM(); openM('orderModal'); return; }
        if (e.target.closest('[data-contact]')) { e.preventDefault(); contactWhatsApp(); return; }
        if (e.target.closest('[data-request]')) { e.preventDefault(); requestReport(); return; }
        if (e.target.closest('[data-close]')) { closeM(); return; }
        var typeBtn = e.target.closest('[data-type]');
        if (typeBtn) { sel.type = typeBtn.getAttribute('data-type'); markSel(typeBtn); return; }
      });
      var send = document.getElementById('orderSend');
      if (send) send.addEventListener('click', sendOrder);
      var qtySel = document.getElementById('optQty');
      if (qtySel) qtySel.addEventListener('change', function () {
        var c = document.getElementById('optQtyCustom');
        if (c) { var custom = qtySel.value === '__custom__'; c.hidden = !custom; if (custom) c.focus(); else c.value = ''; }
      });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeM(); });

      // Mobil menü
      var toggle = document.getElementById('navToggle');
      var nav = document.getElementById('mainNav');
      if (toggle && nav) {
        toggle.addEventListener('click', function () {
          var open = nav.classList.toggle('open');
          toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
        nav.querySelectorAll('a').forEach(function (a) {
          a.addEventListener('click', function () { nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); });
        });
      }
    }

    // Scroll reveal
    var revealEls = document.querySelectorAll('.section .card, .section .step, .region-list li, .badge-card');
    if ('IntersectionObserver' in window && revealEls.length) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e, i) {
          if (e.isIntersecting) { e.target.style.transitionDelay = (Math.min(i, 6) * 55) + 'ms'; e.target.classList.add('is-visible'); io.unobserve(e.target); }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      revealEls.forEach(function (el) { io.observe(el); });
    } else { revealEls.forEach(function (el) { el.classList.add('is-visible'); }); }

    var yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    initScrollSpy();
    initGalleries();
  }

  // Filo kartlarındaki çoklu fotoğraf galerisi (fade + noktalar + otomatik)
  function initGalleries() {
    document.querySelectorAll('.fleet-photo').forEach(function (fp) {
      var slides = fp.querySelectorAll('.fg-slide');
      if (slides.length < 2 || fp.dataset.galInit) return;
      fp.dataset.galInit = '1';
      var dots = fp.querySelectorAll('.fg-dot'), idx = 0, timer;
      function show(n) {
        idx = (n + slides.length) % slides.length;
        slides.forEach(function (s, i) { s.classList.toggle('active', i === idx); });
        dots.forEach(function (d, i) { d.classList.toggle('active', i === idx); });
      }
      function start() { timer = setInterval(function () { show(idx + 1); }, 4000); }
      function stop() { clearInterval(timer); }
      dots.forEach(function (d) { d.addEventListener('click', function () { stop(); show(+d.getAttribute('data-i')); start(); }); });
      fp.addEventListener('mouseenter', stop);
      fp.addEventListener('mouseleave', start);
      start();
    });
  }

  // Ziyaretçi sayacı (Abacus) — oturum başına 1 kez artır
  function bumpVisitor() {
    try {
      if (sessionStorage.getItem('peksu_counted') === '1') return;
      sessionStorage.setItem('peksu_counted', '1');
      var d = new Date(), p = function (n) { return n < 10 ? '0' + n : '' + n; };
      var day = 'd-' + d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
      var mon = 'm-' + d.getFullYear() + '-' + p(d.getMonth() + 1);
      ['all', mon, day].forEach(function (k) {
        fetch('https://abacus.jasoncameron.dev/hit/peksu-com-bodrum/' + k).catch(function () {});
      });
    } catch (e) {}
  }
  bumpVisitor();

  // Bulunulan bölümü nav'da vurgula
  function initScrollSpy() {
    if (!('IntersectionObserver' in window)) return;
    var links = [].slice.call(document.querySelectorAll('.main-nav a[href^="#"]'));
    var map = {};
    links.forEach(function (a) { var id = a.getAttribute('href').slice(1); if (document.getElementById(id)) map[id] = a; });
    var ids = Object.keys(map);
    if (!ids.length) return;
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          links.forEach(function (a) { a.classList.remove('active'); });
          if (map[e.target.id]) map[e.target.id].classList.add('active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    ids.forEach(function (id) { spy.observe(document.getElementById(id)); });
  }

  function markSel(btn) {
    var siblings = btn.parentElement.querySelectorAll('.opt');
    siblings.forEach(function (s) { s.classList.remove('sel'); });
    btn.classList.add('sel');
  }

  fetch('data/content.json', { cache: 'no-store' })
    .then(function (r) { if (!r.ok) throw new Error('content.json yüklenemedi'); return r.json(); })
    .then(render)
    .catch(function (err) { console.error(err); initInteractions(); });
})();
