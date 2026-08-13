# 🎯 MODAL SİSTEMİ KULLANIM KILAVUZU

## 📋 Genel Bakış

Ana sayfada otomatik açılan modalları yönetmek için `data/content/modal.json` dosyasını kullanıyoruz.

---

## 🔧 Ayarlar

### 1. **enabled** (Boolean)
- `true`: Modal sistemi aktif
- `false`: Hiçbir modal gösterilmez

### 2. **activeModal** (String veya "")
- **Belirli bir modal göstermek için:** ID yazın (örn: `"maintenance-notice"`)
- **active: true olanı göstermek için:** Boş bırakın (`""`)

#### Örnek 1: ID ile seçim
```json
{
  "enabled": true,
  "activeModal": "maintenance-notice",
  "modals": [
    {
      "id": "maintenance-notice",
      "active": false  // ← activeModal ID'si varsa bu kontrol edilmez (artık ediliyor!)
    }
  ]
}
```
**SONUÇ:** `maintenance-notice` modalı gösterilir (eğer `active: false` değilse)

#### Örnek 2: active ile seçim
```json
{
  "enabled": true,
  "activeModal": "",  // ← Boş bırakıldı
  "modals": [
    {
      "id": "new-semester-2025",
      "active": false
    },
    {
      "id": "maintenance-notice",
      "active": true  // ← Bu gösterilir
    }
  ]
}
```
**SONUÇ:** İlk `active: true` olan modal gösterilir

---

## 📅 Tarih Kontrolü (startDate / endDate)

Modal'ın gösterim tarihleri:

```json
{
  "id": "holiday-notice",
  "startDate": "2025-04-01",
  "endDate": "2025-04-15",
  "active": true
}
```

### Nasıl Çalışır?
- **Bugün < startDate** → Modal gösterilmez (henüz başlamadı)
- **Bugün > endDate** → Modal gösterilmez (süresi doldu)
- **startDate ≤ Bugün ≤ endDate** → Modal gösterilir ✅

### Tarih Formatı:
- `"YYYY-MM-DD"` formatında yazın
- Örnek: `"2025-01-20"`

### Test İçin:
```json
{
  "startDate": "2020-01-01",  // Geçmiş tarih → Aktif
  "endDate": "2030-12-31"     // Gelecek tarih → Aktif
}
```

---

## 🔄 showOnce (Bir Kez Göster)

Modalın kullanıcıya sadece bir kez gösterilmesini sağlar.

```json
{
  "id": "new-semester-2025",
  "showOnce": true
}
```

### Nasıl Çalışır?
1. Kullanıcı modalı görür
2. "Bir daha gösterme" checkbox'ını işaretler (veya sadece kapatır)
3. `localStorage`'a kaydedilir: `modal_new-semester-2025_shown = true`
4. Sayfa yenilendiğinde modal bir daha gösterilmez

### localStorage Temizleme (Test İçin):
**Tarayıcı Console'da çalıştır:**
```javascript
// Tüm modal kayıtlarını sil
localStorage.removeItem('modal_new-semester-2025_shown');
localStorage.removeItem('modal_maintenance-notice_shown');
localStorage.removeItem('modal_holiday-notice_shown');

// VEYA tüm localStorage'ı temizle
localStorage.clear();
```

**Sayfa yenilendiğinde modal tekrar açılacak.**

---

## 🎨 Modal Kategorileri

```json
"category": "academic"
```

### Mevcut Kategoriler:
- `academic` - Akademik içerik (mavi ton)
- `maintenance` - Bakım duyurusu (turuncu ton)
- `resource` - Yeni kaynak (yeşil ton)
- `announcement` - Genel duyuru (kırmızı ton)

CSS'de `.modal-category-{category}` sınıfı ile stilize ediliyor.

---

## 🖼️ Resim Dil Desteği

Farklı dillerde farklı görseller gösterebilirsiniz:

```json
"image": {
  "tr": "assets/images/modal-holiday.jpg",
  "en": "assets/images/modal-holiday-en.jpg"
}
```

**NOT:** Eğer EN görseli yoksa, TR görseli otomatik kullanılır (fallback).

Aynı görseli her iki dilde kullanmak için:
```json
"image": {
  "tr": "assets/images/modal-image.jpg",
  "en": "assets/images/modal-image.jpg"
}
```

---

## 🧪 Test Senaryoları

### Test 1: Modal Değiştirme
1. `modal.json` aç
2. `activeModal: "maintenance-notice"` yap
3. `maintenance-notice` modalının `active: true` olduğundan emin ol
4. Sayfayı yenile → Bakım modalı açılmalı

### Test 2: showOnce Kontrolü
1. Modal'ı aç ve kapat
2. Sayfayı yenile → Modal tekrar açılmalı
3. "Bir daha gösterme" checkbox'ını işaretle
4. Modal'ı kapat
5. Sayfayı yenile → Modal artık açılmamalı
6. Console'da `localStorage.removeItem('modal_maintenance-notice_shown')` çalıştır
7. Sayfayı yenile → Modal tekrar açılmalı

### Test 3: Tarih Kontrolü
1. `startDate: "2030-01-01"` yap (gelecek tarih)
2. Sayfayı yenile → Modal açılmamalı (henüz başlamadı)
3. `startDate: "2020-01-01"` yap (geçmiş tarih)
4. Sayfayı yenile → Modal açılmalı

### Test 4: Çoklu Dil
1. Modal açılsın (TR)
2. Header'dan EN'e geç
3. Modal kapansın (otomatik değil, manuel kapat)
4. Console'da modal localStorage temizle
5. Sayfayı yenile → Modal İngilizce açılmalı

---

## ⚙️ Öncelik Sırası

Modal gösterimi için kontrol sırası:

1. ✅ `enabled: true` mi?
2. ✅ `activeModal` ID'si var mı? Varsa o modal var mı? `active: false` değil mi?
3. ✅ Modal `active: true` mu?
4. ✅ `startDate` ve `endDate` aralığında mıyız?
5. ✅ `showOnce: true` ise daha önce gösterilmiş mi?

**Hepsi ✅ ise modal gösterilir.**

---

## 🚨 Sık Sorulan Sorular

### S: Modal hep aynı modalı gösteriyor?
**C:** `activeModal` ID'si sabit kalmış olabilir. Çözüm:
- `activeModal: ""` yapın (boş string)
- Göstermek istediğiniz modalda `active: true` yapın

### S: Tarihler çalışmıyor mu?
**C:** Tarih formatını kontrol edin: `"YYYY-MM-DD"` olmalı.

### S: showOnce çalışmıyor?
**C:** localStorage temizleyin:
```javascript
localStorage.clear();
```

### S: EN diline geçince modal kapanıyor?
**C:** Bu normal. Modal sayfa yüklenirken açılır, dil değişimi sayfayı yenilemez. Manuel kapat ve sayfa yenile.

### S: Modal hiç açılmıyor?
**C:** Kontrol edin:
1. `enabled: true` mi?
2. En az bir modal `active: true` mu?
3. Console'da hata var mı?
4. Tarih aralığında mıyız?
5. localStorage'da `modal_xxx_shown: true` var mı?

---

## 💡 İpuçları

### İpucu 1: Geliştirme Sırasında
Modal'ı her seferinde görmek için:
```json
{
  "showOnce": false,
  "startDate": "2020-01-01",
  "endDate": "2030-12-31"
}
```

### İpucu 2: Acil Duyuru İçin
```json
{
  "activeModal": "urgent-notice",
  "modals": [
    {
      "id": "urgent-notice",
      "active": true,
      "showOnce": false,  // Her seferinde göster
      "category": "announcement"
    }
  ]
}
```

### İpucu 3: Kampanya Modal'ı
```json
{
  "id": "black-friday",
  "startDate": "2025-11-25",
  "endDate": "2025-11-30",
  "showOnce": true,  // Kampanya boyunca bir kez göster
  "active": true
}
```

---

## 📝 Örnek Modal Tanımı

```json
{
  "id": "summer-hours",
  "title": {
    "tr": "Yaz Dönemi Çalışma Saatleri",
    "en": "Summer Working Hours"
  },
  "description": {
    "tr": "Yaz dönemi boyunca kütüphanemiz hafta içi 08:00-20:00, hafta sonu 10:00-18:00 saatleri arası hizmet verecektir.",
    "en": "During summer period, our library will serve weekdays 08:00-20:00, weekends 10:00-18:00."
  },
  "image": {
    "tr": "assets/images/modal-summer.jpg",
    "en": "assets/images/modal-summer-en.jpg"
  },
  "buttonText": {
    "tr": "Detaylı Bilgi",
    "en": "More Info"
  },
  "buttonUrl": "calisma-saatleri.html",
  "category": "announcement",
  "active": true,
  "showOnce": false,
  "startDate": "2025-06-01",
  "endDate": "2025-09-30"
}
```

---

**🎉 Başarılar! Modal sisteminiz artık tamamen çoklu dil destekli ve esnek.**
