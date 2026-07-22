# Access ile ürün güncelleme

1. `products.accdb` dosyasını Microsoft Access ile açın.
2. `Products` tablosunda ürün ekleyin, düzenleyin veya silin.
3. Çoklu değerleri `|` işaretiyle ayırın. Örnek: `S|M|L|XL`.
4. Ürünü silmeden gizlemek için `Active` alanındaki işareti kaldırın.
5. Veritabanını kaydedip kapatın.
6. Ana klasördeki `URUNLERI-GUNCELLE.bat` dosyasına çift tıklayın.
7. Oluşan `js\products.js` dosyasını diğer site dosyalarıyla birlikte GitHub'a yükleyin.

## Önemli alanlar

- `ProductKey`: Boşluksuz benzersiz teknik ad.
- `ProductCode`: Benzersiz ürün kodu.
- `Price`: Yalnızca sayı girin.
- `Images`: Görsel yollarını `|` ile ayırın.
- `Colors`: Renk kodlarını `|` ile ayırın.
- `Sizes`: Bedenleri `|` ile ayırın.
- `SortOrder`: Ürünün listelenme sırası.
