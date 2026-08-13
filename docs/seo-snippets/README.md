# SEO Snippets - Kullanım Rehberi

Bu klasör, web sitesindeki sayfalar için SEO meta etiketleri şablonlarını içerir.

## 📋 Kullanım

1. Yeni sayfa oluştururken ilgili snippet dosyasını kopyalayın
2. `{{değişkenler}}`i sayfanıza özel bilgilerle değiştirin
3. HTML'in `<head>` bölümüne yapıştırın

## 📁 Dosyalar

- `default-template.html` - Genel sayfa şablonu (inner pages)
- `article-template.html` - Makale/rehber sayfaları (örnek: araştırmacı profili)
- `homepage-template.html` - Ana sayfa
- **Hazır Örnekler:**
  - `arastirmaci-profili-seo.html` - Araştırmacı profili sayfası SEO örneği

## ✅ SEO Checklist

### Temel Meta Etiketler
- [ ] `<title>` - 50-60 karakter arası
- [ ] `<meta name="description">` - 150-160 karakter arası
- [ ] `<meta name="keywords">` - İlgili anahtar kelimeler
- [ ] `<link rel="canonical">` - Sayfanın canonical URL'i

### Open Graph (Facebook, LinkedIn)
- [ ] `og:type` - "website" veya "article"
- [ ] `og:title` - Paylaşım başlığı
- [ ] `og:description` - Paylaşım açıklaması
- [ ] `og:image` - 1200x630 px görsel (mutlaka)
- [ ] `og:url` - Sayfanın tam URL'i

### Twitter Card
- [ ] `twitter:card` - "summary_large_image"
- [ ] `twitter:title` - Tweet başlığı
- [ ] `twitter:description` - Tweet açıklaması
- [ ] `twitter:image` - Görsel URL

### Structured Data (JSON-LD)
- [ ] Sayfa tipine uygun schema (HowTo, Article, FAQPage, etc.)
- [ ] Organization bilgileri
- [ ] BreadcrumbList

## 🎯 Önemli Notlar

1. **Görseller**: Open Graph görselleri mutlaka yükleyin (`assets/images/og/`)
2. **URL'ler**: Tüm URL'leri production domain'e göre güncelleyin
3. **Tarihler**: `article:published_time` ve `modified_time` güncelleyin
4. **Twitter Handle**: Gerçek Twitter hesabınızı kullanın
5. **Structured Data**: Google Search Console'da test edin

## 🔗 Faydalı Linkler

- [Open Graph Debugger](https://developers.facebook.com/tools/debug/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Schema.org Documentation](https://schema.org/)

## 📝 Değişken Listesi

Şablonlarda kullanılan değişkenler:

- `{{PAGE_TITLE}}` - Sayfa başlığı
- `{{PAGE_DESCRIPTION}}` - Sayfa açıklaması
- `{{PAGE_KEYWORDS}}` - Anahtar kelimeler
- `{{PAGE_URL}}` - Sayfanın tam URL'i
- `{{PAGE_IMAGE}}` - OG görsel URL
- `{{PUBLISHED_DATE}}` - Yayın tarihi (ISO 8601)
- `{{MODIFIED_DATE}}` - Güncelleme tarihi (ISO 8601)
- `{{BREADCRUMB_NAME}}` - Breadcrumb başlığı
