param([string]$Docx, [string]$OutDir)
Add-Type -AssemblyName System.IO.Compression.FileSystem
$tmp = Join-Path $env:TEMP ("dx_" + [guid]::NewGuid().ToString() + ".zip")
Copy-Item -LiteralPath $Docx -Destination $tmp
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
$zip = [System.IO.Compression.ZipFile]::OpenRead($tmp)
foreach ($e in $zip.Entries) {
  if ($e.FullName -like "word/media/*") {
    [System.IO.Compression.ZipFileExtensions]::ExtractToFile($e, (Join-Path $OutDir $e.Name), $true)
  }
  if ($e.FullName -eq "word/document.xml") {
    $sr = New-Object System.IO.StreamReader($e.Open())
    $xml = $sr.ReadToEnd(); $sr.Close()
    $xml = $xml -replace '</w:p>', "`n" -replace '</w:tc>', ' | ' -replace '<w:drawing>', '[IMAGE]' -replace '<[^>]+>', ''
    [System.IO.File]::WriteAllText((Join-Path $OutDir "text.txt"), [System.Net.WebUtility]::HtmlDecode($xml))
  }
}
$zip.Dispose()
Remove-Item $tmp
