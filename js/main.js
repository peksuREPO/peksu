/* Peksu — içerik render + etkileşimler */
(function () {
  'use strict';

  var esc = function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  };

  // JSON içindeki "a.b.c" yolunu çözer
  function get(obj, path) {
    return path.split('.').reduce(function (o, k) { return (o == null ? undefined : o[k]); }, obj);
  }

  // Marka adının son 2 harfini vurgu için span'e alır: "Peksu" -> Pek<span>su</span>
  function brandHtml(name) {
    name = name || 'Peksu';
    if (name.length <= 2) return esc(name);
    return esc(name.slice(0, -2)) + '<span>' + esc(name.slice(-2)) + '</span>';
  }

  function render(data) {
    // Türetilmiş bağlantı alanları
    var c = data.contact || {};
    c.telHref = 'tel:' + (c.phoneHref || '');
    c.waHref = 'https://wa.me/' + (c.whatsapp || '').replace(/[^0-9]/g, '');
    c.mailHref = 'mailto:' + (c.email || '');

    // data-field: metin bağlama
    document.querySelectorAll('[data-field]').forEach(function (el) {
      var path = el.getAttribute('data-field');
      if (path === 'brand.nameHtml') { el.innerHTML = brandHtml(get(data, 'brand.name')); return; }
      var val = get(data, path);
      if (val != null) el.textContent = val;
    });

    // data-attr: "attr:path" biçiminde özellik bağlama
    document.querySelectorAll('[data-attr]').forEach(function (el) {
      el.getAttribute('data-attr').split(',').forEach(function (pair) {
        var parts = pair.split(':');
        var attr = parts.shift().trim();
        var val = get(data, parts.join(':').trim());
        if (val != null) el.setAttribute(attr, val);
      });
    });

    // Hero istatistikleri
    fill('heroStats', (data.hero && data.hero.stats) || [], function (s) {
      return '<li><strong>' + esc(s.value) + '</strong><span>' + esc(s.label) + '</span></li>';
    });

    // Hizmetler
    fill('servicesGrid', get(data, 'services.items') || [], function (s) {
      return '<article class="card service"><span class="card-icon">' + esc(s.icon) +
        '</span><h3>' + esc(s.title) + '</h3><p>' + esc(s.desc) + '</p></article>';
    });

    // Adımlar
    fill('stepsGrid', get(data, 'steps.items') || [], function (s, i) {
      return '<div class="step"><span class="step-no">' + (i + 1) + '</span><h3>' +
        esc(s.title) + '</h3><p>' + esc(s.desc) + '</p></div>';
    });

    // Bölgeler
    fill('regionList', get(data, 'regions.items') || [], function (r) {
      return '<li>' + esc(r) + '</li>';
    });

    // Hakkımızda özellikleri
    fill('featureList', get(data, 'about.features') || [], function (f) {
      return '<li>' + esc(f) + '</li>';
    });

    // Hakkımızda rozetleri
    fill('aboutBadges', get(data, 'about.badges') || [], function (b) {
      return '<div class="badge-card"><strong>' + esc(b.value) + '</strong><span>' + esc(b.label) + '</span></div>';
    });

    // Filo
    fill('fleetGrid', get(data, 'fleet.items') || [], function (f) {
      return '<article class="card fleet"><span class="fleet-cap">' + esc(f.cap) +
        '<small>' + esc(f.unit) + '</small></span><p>' + esc(f.desc) + '</p></article>';
    });

    // SSS
    fill('faqList', get(data, 'faq.items') || [], function (f) {
      return '<details><summary>' + esc(f.q) + '</summary><p>' + esc(f.a) + '</p></details>';
    });

    document.title = (get(data, 'brand.name') || 'Peksu') + ' | Temiz Su Dağıtım Hizmeti';
    initInteractions();
  }

  function fill(id, arr, tpl) {
    var el = document.getElementById(id);
    if (el) el.innerHTML = arr.map(tpl).join('');
  }

  function initInteractions() {
    // Mobil menü
    var toggle = document.getElementById('navToggle');
    var nav = document.getElementById('mainNav');
    if (toggle && nav && !toggle.dataset.bound) {
      toggle.dataset.bound = '1';
      toggle.addEventListener('click', function () {
        var open = nav.classList.toggle('open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      nav.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () {
          nav.classList.remove('open');
          toggle.setAttribute('aria-expanded', 'false');
        });
      });
    }

    // Scroll reveal
    var revealEls = document.querySelectorAll('.section .card, .section .step, .region-list li, .badge-card');
    if ('IntersectionObserver' in window && revealEls.length) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e, i) {
          if (e.isIntersecting) {
            e.target.style.transitionDelay = (Math.min(i, 6) * 60) + 'ms';
            e.target.classList.add('is-visible');
            io.unobserve(e.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      revealEls.forEach(function (el) { io.observe(el); });
    } else {
      revealEls.forEach(function (el) { el.classList.add('is-visible'); });
    }

    var yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }

  // İçeriği yükle
  fetch('data/content.json', { cache: 'no-store' })
    .then(function (r) { if (!r.ok) throw new Error('content.json yüklenemedi'); return r.json(); })
    .then(render)
    .catch(function (err) {
      console.error(err);
      initInteractions();
    });
})();
