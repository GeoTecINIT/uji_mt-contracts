$nodeNo = Read-Host "Node Number"
$bootnodes = Read-Host "Bootnode (if any)"
$mine = Read-Host "Miner Threads (0: disabled)"

$node = "node${nodeNo}"
$port = 30310 + $nodeNo;
$httpPort = 18540 + $nodeNo;

$cmd = "geth --datadir ./${node} --nousb --networkid 2564 --port $port"
$cmd += " --http --http.port $httpPort --http.api eth,web3,personal,net,admin"
$cmd += " --allow-insecure-unlock --ipcdisable"

If ($mine -and $mine -gt 0) {
  $cmd += " --mine --miner.threads ${mine}"
}
If ($bootnodes) {
  $cmd += " --bootnodes ${bootnodes}"
}

echo $cmd
Invoke-Expression $cmd
