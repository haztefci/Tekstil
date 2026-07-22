$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$databasePath = Join-Path $projectRoot 'products.accdb'
$outputPath = Join-Path $projectRoot 'js\products.js'

if (-not (Test-Path -LiteralPath $databasePath)) {
    throw "products.accdb bulunamadı."
}

function Split-ListValue($value) {
    if ($null -eq $value -or $value -is [DBNull] -or [string]::IsNullOrWhiteSpace([string]$value)) { return @() }
    return @(([string]$value).Split('|') | ForEach-Object { $_.Trim() } | Where-Object { $_ })
}

function Read-Nullable($value) {
    if ($null -eq $value -or $value -is [DBNull]) { return $null }
    return $value
}

$connection = New-Object -ComObject ADODB.Connection
$connection.Open("Provider=Microsoft.ACE.OLEDB.16.0;Data Source=$databasePath;")
$recordset = $connection.Execute('SELECT * FROM Products ORDER BY SortOrder, ID')
$products = @()

while (-not $recordset.EOF) {
    $priceValue = Read-Nullable $recordset.Fields.Item('Price').Value
    $products += [ordered]@{
        id = [string]$recordset.Fields.Item('ProductKey').Value
        active = [bool]$recordset.Fields.Item('Active').Value
        group = [string]$recordset.Fields.Item('ProductGroup').Value
        type = [string]$recordset.Fields.Item('ProductType').Value
        groupLabel = [string]$recordset.Fields.Item('GroupLabel').Value
        typeLabel = [string]$recordset.Fields.Item('TypeLabel').Value
        name = [string]$recordset.Fields.Item('ProductName').Value
        code = [string]$recordset.Fields.Item('ProductCode').Value
        price = if ($null -eq $priceValue) { $null } else { [decimal]$priceValue }
        badge = Read-Nullable $recordset.Fields.Item('Badge').Value
        images = @(Split-ListValue $recordset.Fields.Item('Images').Value)
        description = [string]$recordset.Fields.Item('ProductDescription').Value
        colors = @(Split-ListValue $recordset.Fields.Item('Colors').Value)
        sizes = @(Split-ListValue $recordset.Fields.Item('Sizes').Value)
        fabric = [string]$recordset.Fields.Item('Fabric').Value
        weight = [string]$recordset.Fields.Item('ProductWeight').Value
        fit = [string]$recordset.Fields.Item('ProductFit').Value
        care = [string]$recordset.Fields.Item('Care').Value
    }
    $recordset.MoveNext()
}

$recordset.Close()
$connection.Close()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($recordset) | Out-Null
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($connection) | Out-Null

$json = $products | ConvertTo-Json -Depth 8
$json = $json.Replace([string][char]0x009E, '')
$content = @"
// Bu dosya products.accdb üzerinden otomatik oluşturuldu.
// Değişikliklerinizi Access dosyasında yapıp tools\access-to-products.ps1 dosyasını çalıştırın.
window.PRODUCTS = $json;
"@
[System.IO.File]::WriteAllText($outputPath, $content, (New-Object System.Text.UTF8Encoding($false)))
Write-Host "Güncellendi: $outputPath ($($products.Count) ürün)"
