if (Test-Path ./data/out) {
  Write-Output "Removing old data..."
  rm -r -Force ./data/out
}

Write-Output "`r`n[1/3] Making geohashes..."
npm run geohash-regions

Write-Output "`r`n[2/3] Making s2cells..."
cd ./data
go run s2covering
cd ..

Write-Output "`r`n[3/3] Making s2base64tree..."
npm run s2base64tree

Write-Output "`r`n### Finished ###"
