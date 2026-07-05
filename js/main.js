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
    fill('fleetGrid', get(d, 'fleet.items'), function (f) {
      return '<article class="card fleet"><span class="fleet-cap">' + esc(f.cap) + '<small>' + esc(f.unit) + '</small></span><p>' + esc(f.desc) + '</p></article>';
    });
    fill('faqList', get(d, 'faq.items'), function (f) {
      return '<details><summary>' + esc(f.q) + '</summary><p>' + esc(f.a) + '</p></details>';
    });

    document.title = (get(d, 'brand.name') || 'Peksu') + ' | Temiz Su Dağıtım Hizmeti';
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

    // Miktar 1..max
    var max = o.maxQuantity || 20;
    var qty = document.getElementById('optQty');
    var qhtml = '';
    for (var n = 1; n <= max; n++) qhtml += '<button type="button" class="opt' + (n === 1 ? ' sel' : '') + '" data-qty="' + n + '">' + n + '</button>';
    if (qty) qty.innerHTML = qhtml;
    sel.qty = 1;

    // Bölgeler
    var reg = document.getElementById('optRegion');
    if (reg) reg.innerHTML = (get(d, 'regions.items') || []).map(function (r) {
      var n = regionName(r);
      return '<option value="' + esc(n) + '">' + esc(n) + '</option>';
    }).join('');
    updateStreetField();
  }

  function currentRegion() {
    var name = (document.getElementById('optRegion') || {}).value;
    var items = get(data, 'regions.items') || [];
    for (var i = 0; i < items.length; i++) { if (regionName(items[i]) === name) return items[i]; }
    return null;
  }
  // Seçilen mahalleye göre sokak alanını doldur (varsa dropdown, yoksa serbest metin)
  function updateStreetField() {
    var selEl = document.getElementById('optStreetSelect');
    var txtEl = document.getElementById('optStreetText');
    if (!selEl || !txtEl) return;
    var streets = regionStreets(currentRegion());
    if (streets.length) {
      selEl.innerHTML = '<option value="">Sokak/Cadde seçin</option>' +
        streets.map(function (s) { return '<option value="' + esc(s) + '">' + esc(s) + '</option>'; }).join('');
      selEl.style.display = ''; txtEl.style.display = 'none'; txtEl.value = '';
    } else {
      selEl.style.display = 'none'; selEl.innerHTML = '';
      txtEl.style.display = '';
    }
  }
  function streetValue() {
    var selEl = document.getElementById('optStreetSelect');
    var txtEl = document.getElementById('optStreetText');
    if (selEl && selEl.style.display !== 'none' && selEl.value) return selEl.value;
    if (txtEl && txtEl.style.display !== 'none') return txtEl.value.trim();
    return '';
  }

  function openModal() { var m = document.getElementById('orderModal'); if (m) { m.classList.add('open'); m.setAttribute('aria-hidden', 'false'); } }
  function closeModal() { var m = document.getElementById('orderModal'); if (m) { m.classList.remove('open'); m.setAttribute('aria-hidden', 'true'); } }

  function waNumber() { return String(get(data, 'contact.whatsapp') || '').replace(/[^0-9]/g, ''); }

  function sendOrder() {
    var o = (data && data.order) || {};
    var note = (document.getElementById('optNote') || {}).value || '';
    var region = (document.getElementById('optRegion') || {}).value || '';
    var street = streetValue();
    var bno = ((document.getElementById('optBuildingNo') || {}).value || '').trim();
    var dno = ((document.getElementById('optDoorNo') || {}).value || '').trim();
    var unit = o.unitLabel || 'ton';
    var lines = [
      o.messageIntro || 'Merhaba, su siparişi vermek istiyorum.',
      '',
      'Su Türü: ' + (sel.type || '-'),
      'Miktar: ' + (sel.qty || '-') + ' ' + unit,
      'Bölge: ' + (region || '-')
    ];
    if (street) lines.push('Sokak/Cadde: ' + street);
    if (bno) lines.push('Bina No: ' + bno);
    if (dno) lines.push('Daire No: ' + dno);
    if (note.trim()) lines.push('Not: ' + note.trim());
    var url = 'https://wa.me/' + waNumber() + '?text=' + encodeURIComponent(lines.join('\n'));
    window.open(url, '_blank');
    closeModal();
  }

  function requestReport() {
    var msg = get(data, 'quality.requestMessage') || 'Merhaba, güncel su analiz raporunu talep etmek istiyorum.';
    window.open('https://wa.me/' + waNumber() + '?text=' + encodeURIComponent(msg), '_blank');
  }

  /* ---------- Etkileşimler ---------- */
  var bound = false;
  function initInteractions() {
    if (!bound) {
      bound = true;
      // Global tıklama yakalama (modal aç/kapa, sipariş, rapor)
      document.addEventListener('click', function (e) {
        if (e.target.closest('[data-order]')) { e.preventDefault(); openModal(); return; }
        if (e.target.closest('[data-request]')) { e.preventDefault(); requestReport(); return; }
        if (e.target.closest('[data-close]')) { closeModal(); return; }
        var typeBtn = e.target.closest('[data-type]');
        if (typeBtn) { sel.type = typeBtn.getAttribute('data-type'); markSel(typeBtn); return; }
        var qtyBtn = e.target.closest('[data-qty]');
        if (qtyBtn) { sel.qty = +qtyBtn.getAttribute('data-qty'); markSel(qtyBtn); return; }
      });
      var send = document.getElementById('orderSend');
      if (send) send.addEventListener('click', sendOrder);
      var regSel = document.getElementById('optRegion');
      if (regSel) regSel.addEventListener('change', updateStreetField);
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });

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
