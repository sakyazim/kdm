# 📚 Kütüphane Admin Panel v3.0

> Modern, güvenli ve kullanıcı dostu JSON düzenleme arayüzü

---

## 🎯 ÖZELLİKLER

### ✨ Görsel Editor
- **Çoklu Dil Desteği**: Türkçe ve İngilizce alanları yan yana düzenleyin
- **Akıllı Form Alanları**: Otomatik textarea/input seçimi
- **Canlı Durum Göstergeleri**: Eksik çevirileri anında görün
- **Bölüm Bazlı Düzenleme**: Meta, Hero, Content, Help bölümleri ayrı ayrı

### 💻 Kod Editor
- **Syntax Highlighting**: Renkli JSON kodu
- **Doğrulama**: Geçersiz JSON uyarıları
- **Hızlı Düzenleme**: Deneyimli kullanıcılar için

### 👁️ Canlı Önizleme
- **Responsive Test**: Desktop, Tablet, Mobil görünümler
- **Gerçek Zamanlı**: Değişiklikleri anında görün
- **Tam Sayfa**: Gerçek site gibi önizleme

### 🔒 Güvenlik
- **Local Only**: Servera asla yüklenmez
- **Offline Çalışma**: İnternet gerektirmez
- **Güvenli İndirme**: Dosyalar sadece local'e indirilir

---

## 🚀 HIZLI BAŞLANGIÇ

### 1. Admin Panel'i Açın
```
admin/index.html dosyasını tarayıcınızda açın
```

### 2. Dosya Seçin
- Sol menüden kategori seçin (Sayfalar / Global)
- Düzenlemek istediğiniz dosyayı tıklayın

### 3. Düzenleyin
- **Görsel Editor**: Form alanlarında düzenleme yapın
- Her metin için TR ve EN çevirilerini girin

### 4. İndirin
- Sağ üstteki **"İndir"** butonuna tıklayın
- JSON dosyası bilgisayarınıza indirilir

### 5. Servera Yükleyin
- FTP veya cPanel File Manager kullanın
- İndirdiğiniz dosyayı `data/pages/` veya `data/global/` klasörüne yükleyin
- Site anında güncellenir!

---

## 📖 KULLANIM KILAVUZU

### Görsel Editor Kullanımı

#### Çoklu Dil Alanları
```
Her metin alanı için iki input görürsünüz:

┌─────────────────────────────────────┐
│ TR  [Türkçe metin buraya...]        │
├─────────────────────────────────────┤
│ EN  [English text here...]          │
└─────────────────────────────────────┘

✓ TR ✓ | ✗ EN ✗  ← Durum göstergeleri
```

#### Durum Göstergeleri
- ✅ **Yeşil Tik**: Çeviri tamamlanmış
- ❌ **Kırmızı Çarpı**: Çeviri eksik

#### Bölümleri Daraltma/Genişletme
Her bölümün sağ üstünde ⬆️ butonu vardır:
- Tıklayarak bölümü daraltabilirsiniz
- Uzun formları daha kolay yönetin

### Kod Editor Kullanımı

#### Ne Zaman Kullanmalı?
- Toplu değişiklik yaparken
- Yapıyı değiştirirken
- Hızlı düzenleme için

#### Dikkat Edilmesi Gerekenler
```json
❌ YANLIŞ (Syntax hatası):
{
  "title": {
    "tr": "Başlık",
    "en": "Title"  // Son virgül yok!
  }  // Virgül eksik!
  "description": "..."
}

✅ DOĞRU:
{
  "title": {
    "tr": "Başlık",
    "en": "Title"
  },
  "description": "..."
}
```

### Önizleme Kullanımı

#### Device Switcher
- 🖥️ **Desktop**: 1920x1080
- 📱 **Tablet**: 768x1024
- 📱 **Mobile**: 375x667

#### Önizleme Yenileme
Değişikliklerden sonra "Yenile" butonuna tıklayın.

---

## 🛠️ ÖZELLİKLER

### Eksik Çevirileri Göster
```
📍 Kullanım: "Eksik Çevirileri Göster" butonu

Çıktı:
┌────────────────────────────────────┐
│ ⚠️  3 alanda çeviri eksik          │
├────────────────────────────────────┤
│ • meta.description (EN eksik)      │
│ • hero.title (EN eksik)            │
│ • help.buttons[0].text (EN eksik)  │
└────────────────────────────────────┘
```

### Doğrula (Validate)
```
📍 Kullanım: "Doğrula" butonu

Kontrol Edilenler:
✓ Zorunlu alanlar var mı?
✓ Meta bilgileri tam mı?
✓ Hero section dolu mu?
✓ Help section mevcut mu?

Çıktı:
✅ Tüm doğrulama kontrolleri geçti
veya
❌ "meta.title" alanı eksik
```

### Sıfırla (Reset)
```
📍 Kullanım: "Sıfırla" butonu

Tüm değişiklikleri geri alır ve
dosyayı yeniden yükler.

⚠️ Kaydedilmemiş değişiklikler kaybolur!
```

---

## ⌨️ KLAVYE KISAYOLLARI

| Kısayol | İşlev |
|---------|-------|
| `Ctrl + S` | Dosyayı indir (kaydet) |
| `Ctrl + R` | Sıfırla |
| `Ctrl + L` | Eksik çevirileri göster |
| `Esc` | Modal'ları kapat |

---

## 📁 DOSYA YAPISI

```
admin/
├── index.html              # Ana sayfa
├── config.js               # Ayarlar
├── README.md               # Bu dosya
│
├── assets/
│   ├── css/
│   │   └── admin-panel.css # Stiller
│   │
│   └── js/
│       ├── admin-panel.js  # Ana JS
│       ├── file-manager.js # Dosya yönetimi
│       └── json-editor.js  # Editor mantığı
```

---

## 🎨 TEMA

### Aydınlık / Karanlık Tema
Sağ üstteki 🌙 butonuna tıklayarak tema değiştirebilirsiniz.

Tema tercihiniz localStorage'da saklanır.

---

## 📝 JSON YAPISI

### Standart Sayfa Formatı
```json
{
  "meta": {
    "title": { "tr": "...", "en": "..." },
    "description": { "tr": "...", "en": "..." }
  },
  "hero": {
    "title": { "tr": "...", "en": "..." },
    "description": { "tr": "...", "en": "..." },
    "backgroundImage": "assets/images/hero.jpg",
    "breadcrumb": [
      { "text": { "tr": "Ana Sayfa", "en": "Home" }, "link": "index.html" },
      { "text": { "tr": "Hizmetler", "en": "Services" }, "link": "#" }
    ]
  },
  "content": {
    "heading": { "tr": "...", "en": "..." },
    "cards": [
      {
        "title": { "tr": "...", "en": "..." },
        "content": { "tr": "...", "en": "..." }
      }
    ]
  },
  "help": {
    "title": { "tr": "...", "en": "..." },
    "description": { "tr": "...", "en": "..." },
    "buttons": [
      {
        "icon": "fas fa-phone",
        "text": { "tr": "Hemen Ara", "en": "Call Now" },
        "link": "tel:+902223350580",
        "variant": "primary"
      }
    ]
  }
}
```

### Teknik Alanlar (Çevrilmez)
Bu alanlar çevrilmez, tüm dillerde aynıdır:
- `icon`
- `url` / `link` / `href`
- `image` / `backgroundImage` / `logo`
- `type` / `variant` / `layout`
- `id`
- `embedUrl`

---

## 🔧 SORUN GİDERME

### Dosya Yüklenmiyor
**Sebep**: Dosya yolu hatalı veya dosya mevcut değil

**Çözüm**:
1. `config.js` dosyasındaki `localDataPath` ayarını kontrol edin
2. Varsayılan: `../data/` (admin klasörünün bir üst dizinindeki data klasörü)
3. Dosya gerçekten `data/pages/` veya `data/global/` klasöründe mi?

### JSON Geçersiz Hatası
**Sebep**: JSON syntax hatası

**Çözüm**:
1. Kod editor'e geçin
2. Hatayı bulun (eksik virgül, tırnak, parantez)
3. [JSONLint](https://jsonlint.com/) ile doğrulayın

### Önizleme Çalışmıyor
**Sebep**: HTML sayfası bulunamadı

**Çözüm**:
1. Sayfa gerçekten `../` klasöründe mi?
2. Dosya adı doğru mu? (`iletisim.html`, `home.html` → `index.html`)

### Tema Kayboldu
**Sebep**: localStorage temizlendi

**Çözüm**:
Yeniden tema seçin, otomatik kaydedilir.

---

## 📊 WORKFLOW ÖRNEKLERİ

### Örnek 1: Yeni Sayfa Eklemek
```
1. data/pages/ klasöründe yeni-sayfa.json oluştur
2. config.js → fileCategories → pages → files array'ine ekle:
   { id: 'yeni-sayfa', label: 'Yeni Sayfa' }
3. Admin panel'i yeniden yükle
4. Dosya listede görünecektir
```

### Örnek 2: Toplu Çeviri Yapmak
```
1. "Eksik Çevirileri Göster" butonuna tıkla
2. Eksik alanları not al
3. Görsel editor'de bu alanları bul
4. EN çevirilerini gir
5. Tekrar "Eksik Çevirileri Göster" ile kontrol et
6. Tümü tamamlandığında indir ve yükle
```

### Örnek 3: Global Header Menü Değiştirme
```
1. Sol menüde "Global" sekmesine geç
2. "Header (Üst Menü)" dosyasını seç
3. navigation → links array'ini düzenle
4. Yeni menü öğesi ekle veya mevcut metinleri değiştir
5. İndir ve servera yükle
6. Tüm sayfalar otomatik güncellenecek
```

---

## ⚠️ ÖNEMLİ UYARILAR

### 🚫 SERVERA YÜKLEME
**ASLA `admin/` klasörünü servera yüklemeyin!**

Sebepleri:
- Güvenlik riski
- Gereksiz dosyalar
- Admin panel sadece local'de çalışmalı

### 💾 Yedekleme
Büyük değişikliklerden önce:
1. `data/` klasörünün yedeğini alın
2. Veya Git commit yapın
3. Hata durumunda geri dönebilirsiniz

### ✅ Doğrulama
Her değişiklikten sonra:
1. "Doğrula" butonunu kullanın
2. "Eksik Çevirileri Göster" kontrol edin
3. Önizleme modunda test edin
4. Sonra servera yükleyin

---

## 📞 DESTEK

### Sorun mu yaşıyorsunuz?

#### 1. Console'u Kontrol Edin
Tarayıcınızda `F12` basın → Console sekmesi → Hataları görün

#### 2. Dosya İzinleri
Local'de çalışırken tarayıcı dosya okuma izni isteyebilir.

#### 3. Cache Temizleme
`Ctrl + F5` ile sayfayı yenileyin (hard refresh)

---

## 🎓 İPUÇLARI

### 🚀 Hız İpuçları
1. **Klavye kısayollarını kullanın** (Ctrl+S, Ctrl+L)
2. **Bölümleri daraltın** (uzun formlar için)
3. **Kod editor'ü kullanın** (toplu değişiklikler için)

### 🎨 Tasarım İpuçları
1. **Tutarlılık**: Benzer sayfalar için aynı yapıyı kullanın
2. **Kısa Metinler**: Mobil görünüm için metinleri kısa tutun
3. **Alternatif Metin**: Görseller için alt text ekleyin

### 🌐 Çeviri İpuçları
1. **Profesyonel Ton**: Resmi dil kullanın
2. **Tutarlılık**: Terimleri her yerde aynı çevirin
3. **Uzunluk**: EN metinler genelde TR'den %20 daha uzundur

---

## 📈 VERSİYON GEÇMİŞİ

### v3.0 (2025-11-26)
- ✨ Görsel editor
- ✨ Kod editor
- ✨ Canlı önizleme
- ✨ Çoklu dil desteği
- ✨ Doğrulama sistemi
- ✨ Karanlık tema
- ✨ Klavye kısayolları

---

## 📜 LİSANS

Bu admin panel Anadolu Üniversitesi Kütüphanesi için özel olarak geliştirilmiştir.

**Kullanım**: Sadece yetkili personel
**Dağıtım**: İzinsiz paylaşmayın
**Güvenlik**: Servera yüklemeyin

---

## 🙏 TEŞEKKÜRLER

Bu admin panel aşağıdaki teknolojiler kullanılarak geliştirilmiştir:

- **Font Awesome**: İkonlar
- **JavaScript ES6+**: Modern JS
- **CSS Grid & Flexbox**: Responsive tasarım
- **LocalStorage API**: Tema saklama

---

**Başarılar! 🎉**

*Sorularınız için lütfen IT departmanına başvurun.*
