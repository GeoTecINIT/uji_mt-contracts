$interfaces = Get-NetIPAddress -AddressFamily IPv4 | Sort-Object -Property InterfaceIndex
foreach ($interface in $interfaces) {
  Write-Output "[$($interface.InterfaceIndex)]: $($interface.InterfaceAlias) - $($interface.IPv4Address)"
}
$interfaceIndex = Read-Host "Select current network interface"

$hostIP = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceIndex $interfaceIndex).IPv4Address

$ip = $(geth attach http://127.0.0.1:8545 --exec "admin.nodeInfo.ip") -replace '"',''
$enode = $(geth attach http://127.0.0.1:8545 --exec "admin.nodeInfo.enode") -replace '"',''
$enode = $enode -replace $ip,$hostIP

$autoMining = Read-Host "Auto Mining? (true or false, blank for false)"
If (!$autoMining) {
  $autoMining = "false"
}

$targetIP = Read-Host "Target SSH (e.g. pi@xx.xx.xx.xx)"

ssh $targetIP "sudo ~/src/services/geth-service-config.sh $enode $autoMining"
