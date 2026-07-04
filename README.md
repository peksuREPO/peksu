# Peksu — Su Dağıtım Web Sitesi

Su dağıtım firması Peksu için tek sayfalık tanıtım sitesi. Havuz mavisi / turkuaz temalı, dalga hissi veren modern tasarım.

## Teknoloji
- Saf **HTML / CSS / JavaScript** (build adımı yok)
- Barındırma: **GitHub Pages** + özel alan adı `peksu.com`

## Yapı
```
index.html          Tek sayfa (tüm bölümler)
css/styles.css      Tema, düzen, dalga & animasyon
js/main.js          Mobil menü, scroll reveal
assets/img/         Görseller (logo, araç foto vb.)
CNAME               Özel alan adı (peksu.com)
```

## Bölümler
Hero · Hizmetler · Nasıl Çalışır · Bölgeler · Hakkımızda · Filo · S.S.S. · İletişim

## Geliştirme
Statik site olduğu için dosyayı doğrudan tarayıcıda açmak yeterli.
Yerel sunucu için:
```
npx serve .
```

## Yapılacaklar (içerik)
Gerçek bilgiler geldikçe `index.html` içindeki placeholder alanlar güncellenecek:
- [ ] Telefon / WhatsApp numarası
- [ ] E-posta ve adres
- [ ] Hizmet bölgeleri listesi
- [ ] Çalışma saatleri
- [ ] Araç filosu kapasiteleri
- [ ] Logo ve görseller
- [ ] Kuruluş yılı / deneyim
