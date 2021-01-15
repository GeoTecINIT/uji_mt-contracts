$nodeNo = Read-Host "Node Number"
$bootnodes = Read-Host "Bootnode (if any)"
$autoMining = Read-Host "Auto mining? (y or leave blank)"

$node = "node${nodeNo}"
$port = 30310 + $nodeNo;
$httpPort = 18540 + $nodeNo;

$cmd = "geth --datadir ./${node} --nousb --networkid 2564 --port $port"
$cmd += " --http --http.port $httpPort --http.api eth,web3,personal,net,admin,miner"
$cmd += " --allow-insecure-unlock --ipcdisable"

If ($bootnodes) {
  $cmd += " --bootnodes ${bootnodes}"
}

If ($autoMining) {
  $cmd += " --preload mining-scheduler.js"
  $cmd += " console"
}

Write-Output $cmd
Invoke-Expression $cmd
