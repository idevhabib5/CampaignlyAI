param([string]$Deck = "D:\Campaignly\Campaignly.AI - FYP Proposal Presentation.pptx")

$work = Join-Path $env:TEMP "deck_preview.pptx"
Copy-Item -LiteralPath $Deck -Destination $work -Force
Unblock-File -LiteralPath $work

$out = "D:\Campaignly\scripts\preview"
if (Test-Path $out) { Remove-Item $out -Recurse -Force }
New-Item -ItemType Directory -Path $out | Out-Null

$ppt = New-Object -ComObject PowerPoint.Application
$ppt.Visible = [Microsoft.Office.Core.MsoTriState]::msoTrue
$pres = $ppt.Presentations.Open($work, $false, $false, $true)
$pres.Export($out, "png", 1600, 900)
$pres.Close()
Get-ChildItem $out | Select-Object Name, Length | Format-Table -AutoSize
