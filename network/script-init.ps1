$nodeNo = Read-Host "Node Number"

$node = "node${nodeNo}"
if (Test-Path ./${node}) {
  Remove-Item -r -Force ./${node}
}

mkdir ${node}

geth --datadir ./${node} --networkid 2564 --nousb init ./genesis.json
geth --datadir ./${node} --networkid 2564 --nousb account new
