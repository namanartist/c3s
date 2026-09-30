$maps = @{
  'Campus_Map' = 'https://res.cloudinary.com/dph28qrrx/image/upload/v1786866672/CampusMap_ehqegc.svg'
  'Main_GF' = 'https://res.cloudinary.com/dph28qrrx/image/upload/v1786866672/Main_GF_a02sn0.svg'
  'Main_FF' = 'https://res.cloudinary.com/dph28qrrx/image/upload/v1780765405/Main_FF_nvvdu5.svg'
  'Main_SF' = 'https://res.cloudinary.com/dph28qrrx/image/upload/v1780765404/Main_SF_ekgtzg.svg'
  'AI_GF' = 'https://res.cloudinary.com/dph28qrrx/image/upload/v1781595825/AI_GF_Optimized_z78rk2.svg'
  'AI_FF' = 'https://res.cloudinary.com/dph28qrrx/image/upload/v1781684462/AI_FF_Optimized_fx71hq.svg'
  'AI_SF' = 'https://res.cloudinary.com/dph28qrrx/image/upload/v1781684455/AI_SF_Optimized_wbn68q.svg'
}

New-Item -ItemType Directory -Force -Path 'public/maps' | Out-Null

foreach ($name in $maps.Keys) {
  $target = "public/maps/$name.svg"
  $url = $maps[$name]
  try {
    Write-Host "Fetching $name from $url..."
    Invoke-WebRequest -Uri $url -OutFile $target -UseBasicParsing
    $len = (Get-Item $target).Length
    Write-Host "Success $name : $len bytes"
  } catch {
    Write-Host "Error fetching $name : $_"
  }
}
