$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$databasePath = Join-Path $projectRoot 'products.accdb'

if (Test-Path -LiteralPath $databasePath) {
    throw "products.accdb zaten mevcut. Mevcut verilerin üzerine yazılmadı."
}

$catalog = New-Object -ComObject ADOX.Catalog
$connectionString = "Provider=Microsoft.ACE.OLEDB.16.0;Data Source=$databasePath;Jet OLEDB:Engine Type=5;"
$catalog.Create($connectionString)
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($catalog) | Out-Null

$connection = New-Object -ComObject ADODB.Connection
$connection.Open($connectionString)
$connection.Execute(@"
CREATE TABLE Products (
  ID AUTOINCREMENT PRIMARY KEY,
  ProductKey TEXT(100) NOT NULL,
  Active YESNO NOT NULL,
  ProductGroup TEXT(50),
  ProductType TEXT(50),
  GroupLabel TEXT(100),
  TypeLabel TEXT(100),
  ProductName TEXT(255) NOT NULL,
  ProductCode TEXT(100) NOT NULL,
  Price CURRENCY,
  Badge TEXT(100),
  Images LONGTEXT,
  ProductDescription LONGTEXT,
  Colors LONGTEXT,
  Sizes LONGTEXT,
  Fabric TEXT(255),
  ProductWeight TEXT(100),
  ProductFit TEXT(100),
  Care LONGTEXT,
  SortOrder INTEGER
)
"@) | Out-Null
$connection.Execute('CREATE UNIQUE INDEX UX_ProductKey ON Products (ProductKey)') | Out-Null
$connection.Execute('CREATE UNIQUE INDEX UX_ProductCode ON Products (ProductCode)') | Out-Null

$products = @(
  @('premium-tisort',$true,'ust','tisort','Üst Giyim','Tişört','Premium Bisiklet Yaka Tişört','DK-TS-101',$null,'Çok tercih edilen','images/catalog/tshirt-white.jpg|images/catalog/tshirt-black.jpg|images/catalog/tshirt-green.jpg','Günlük kullanıma ve kurumsal baskıya uygun, tok tutumlu penye kumaştan üretilen zamansız bisiklet yaka tişört.','#f5f3ed|#1b1b1b|#176b6d|#79354a','XS|S|M|L|XL|2XL','%100 kompakt pamuk','200 g/m²','Regular fit','30°C tersten yıkayınız. Düşük ısıda ütüleyiniz. Tamburlu kurutma önerilmez.',1),
  @('soft-sweatshirt',$true,'ust','sweatshirt','Üst Giyim','Sweatshirt','Soft Touch Sweatshirt','DK-SW-204',$null,'Yeni','images/catalog/sweatshirt.jpg','Yumuşak şardonlu iç yüzeyi, ribanalı yaka ve manşetleriyle konforlu günlük sweatshirt.','#793f28|#222|#d6cab8','S|M|L|XL|2XL','%80 pamuk, %20 polyester','320 g/m²','Rahat kalıp','30°C hassas programda benzer renklerle yıkayınız.',2),
  @('keten-gomlek',$true,'ust','gomlek','Üst Giyim','Gömlek','Keten Karışımlı Gömlek','DK-GM-312',$null,$null,'images/catalog/shirt.jpg','Nefes alan keten karışımlı dokusu ve sade kesimiyle dört mevsim kullanılabilen gömlek.','#263c56|#e8e2d7|#a7a48b','S|M|L|XL','%55 keten, %45 pamuk','165 g/m²','Modern fit','30°C hassas yıkama. Nemliyken düşük ısıda ütüleyiniz.',3),
  @('urban-mont',$true,'ust','mont','Üst Giyim','Mont','Urban Mevsimlik Mont','DK-MT-408',$null,$null,'images/catalog/jacket.jpg','Güçlendirilmiş dikişleri, fermuarlı cepleri ve dayanıklı dış yüzeyiyle şehir kullanımına uygun mont.','#4a241d|#171713|#6a7068','S|M|L|XL|2XL','Kaplamalı dokuma kumaş','380 g/m²','Regular fit','Kuru temizleme önerilir. Doğrudan ısı uygulamayınız.',4),
  @('kanvas-pantolon',$true,'alt','pantolon','Alt Giyim','Pantolon','Kanvas Günlük Pantolon','DK-PT-510',$null,'Dayanıklı','images/catalog/pants.jpg','Hareket rahatlığı sağlayan, formunu koruyan ve yoğun kullanıma uygun kanvas pantolon.','#242d31|#7b7159|#171713','28|30|32|34|36|38','%97 pamuk, %3 elastan','285 g/m²','Düz kesim','30°C tersten yıkayınız. Renk koruyucu deterjan kullanınız.',5),
  @('denim-sort',$true,'alt','sort','Alt Giyim','Şort','Rahat Kesim Denim Şort','DK-SR-622',$null,$null,'images/catalog/shorts.jpg','Yumuşatılmış denim kumaşı ve rahat kesimiyle yaz koleksiyonunun günlük şortu.','#a8c2d4|#344d63','26|28|30|32|34','%100 pamuk denim','260 g/m²','Rahat kesim','30°C tersten yıkayınız. Ağartıcı kullanmayınız.',6),
  @('piliseli-etek',$true,'alt','etek','Alt Giyim','Etek','Akışkan Piliseli Etek','DK-ET-704',$null,'Sezon ürünü','images/catalog/skirt.jpg','Hafif ve akışkan kumaşı, kalıcı pilise formu ve rahat beliyle zarif midi etek.','#e7d8d6|#171713|#9b7b54','XS|S|M|L|XL','Pilise dokuma kumaş','145 g/m²','Midi / rahat kalıp','Hassas programda soğuk yıkama. Pilise üzerine doğrudan ütü uygulamayınız.',7)
)

$columns = @('ProductKey','Active','ProductGroup','ProductType','GroupLabel','TypeLabel','ProductName','ProductCode','Price','Badge','Images','ProductDescription','Colors','Sizes','Fabric','ProductWeight','ProductFit','Care','SortOrder')
function ConvertTo-SqlLiteral($value) {
    if ($null -eq $value) { return 'NULL' }
    if ($value -is [bool]) { return $(if ($value) { 'TRUE' } else { 'FALSE' }) }
    if ($value -is [byte] -or $value -is [int16] -or $value -is [int32] -or $value -is [int64] -or $value -is [decimal] -or $value -is [double]) {
        return [Convert]::ToString($value, [Globalization.CultureInfo]::InvariantCulture)
    }
    return "'$(([string]$value).Replace("'", "''"))'"
}

foreach ($product in $products) {
    $values = $product | ForEach-Object { ConvertTo-SqlLiteral $_ }
    $connection.Execute("INSERT INTO Products ($($columns -join ',')) VALUES ($($values -join ','))") | Out-Null
}

$connection.Close()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($connection) | Out-Null
Write-Host "Oluşturuldu: $databasePath"
