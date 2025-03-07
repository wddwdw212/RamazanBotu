# 🌙 Muzilbot - Ramazan Discord Botu

<div align="center">
  <img src="assets/logo.png" alt="Muzilbot Logo" width="200"/>
  <br>
  <p>
    <a href="https://discord.js.org/"><img src="https://img.shields.io/badge/discord.js-v14-blue.svg" alt="discord.js"></a>
    <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/node.js-v18.12.0-green.svg" alt="node.js"></a>
    <img src="https://img.shields.io/badge/license-MIT-red.svg" alt="license">
  </p>
</div>

## 📖 Hakkında

Muzilbot, Ramazan ayı boyunca Discord sunucularınız için iftar ve sahur vakitlerini takip eden, özel tasarlanmış görsellerle bildirimler sunan bir Discord botudur. Türkiye'nin tüm illerini destekler ve gerçek zamanlı namaz vakitleri verileri kullanır.

## 🌟 Özellikler

### 🕌 İftar ve Sahur Bildirimleri
- Görsel tasarımlı otomatik bildirimler
- İftar vakti geldiğinde anlık bildirim
- Sahur vaktine 30 dakika kala uyarı
- Özelleştirilebilir @everyone etiketi
- Tüm Türkiye illeri için destek

### 🎨 Özel Tasarlanmış Görseller
[Görsel buraya gelecek]
- Gece teması (Sahur bildirimleri için)
  - Yıldızlı gökyüzü efekti
  - Ay silüeti
  - Cami minareleri

[Görsel buraya gelecek]
- Gün batımı teması (İftar bildirimleri için)
  - Güneş batışı efekti
  - Cami silüeti
  - Gradyan arka plan

## 💻 Kurulum

1. Bot'u sunucunuza ekleyin:
   ```
   [Davet linki buraya gelecek]
   ```

2. Yönetici yetkisiyle komutları kullanın:
   ```
   /iftar-bildirim sehir:istanbul kanal:#ramazan everyone:true
   ```

3. Bildirimleri almaya başlayın!

## 🛠️ Komutlar

### `/iftar-bildirim`
- **Açıklama:** İftar ve sahur bildirimlerini ayarlar
- **Parametreler:**
  - `sehir`: Bildirim almak istediğiniz şehir
  - `kanal`: Bildirimlerin gönderileceği kanal
  - `everyone`: @everyone etiketi kullanılsın mı?
- **Yetki:** Sadece sunucu yöneticileri kullanabilir

[Komut kullanım görseli buraya gelecek]

## 📸 Ekran Görüntüleri

### İftar Bildirimi
[İftar bildirimi görseli buraya gelecek]

### Sahur Bildirimi
[Sahur bildirimi görseli buraya gelecek]

## ⚙️ Teknik Detaylar

- Discord.js v14
- Node.js v18.12.0+
- Canvas kütüphanesi ile görsel oluşturma
- CollectAPI entegrasyonu
- JSON tabanlı veritabanı sistemi

## 🔒 Güvenlik

- Sadece yönetici yetkisine sahip kullanıcılar bildirimleri ayarlayabilir
- Hassas veriler config dosyasında güvenli bir şekilde saklanır
- Tüm API istekleri güvenli HTTPS üzerinden yapılır

## 📝 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 🤝 Katkıda Bulunma

1. Bu depoyu fork edin
2. Yeni bir branch oluşturun (`git checkout -b feature/yeniOzellik`)
3. Değişikliklerinizi commit edin (`git commit -am 'Yeni özellik: XYZ'`)
4. Branch'inizi push edin (`git push origin feature/yeniOzellik`)
5. Pull Request oluşturun

## 📞 İletişim

- Discord: [Discord sunucusu linki buraya gelecek]
- Twitter: [@MuzilBot](Twitter linki buraya gelecek)
- E-posta: [E-posta adresi buraya gelecek]

## 🙏 Teşekkürler

- CollectAPI ekibine namaz vakitleri API'si için teşekkürler
- Discord.js ekibine harika kütüphane için teşekkürler
- Tüm katkıda bulunanlara teşekkürler

---
<div align="center">
  <sub>Muzilbot ile hayırlı Ramazanlar! 🌙</sub>
</div> 