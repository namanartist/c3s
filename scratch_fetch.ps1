$res = Invoke-WebRequest -Uri 'https://campus-shield-command.base44.app/' -UseBasicParsing
$res.Content | Out-File -FilePath 'campus_shield_raw.html' -Encoding utf8
Write-Output "Downloaded campus_shield_raw.html len: $($res.Content.Length)"
