const fs = require('fs');
const Web3 = require('web3');
const geohashTree = require('geohash-tree');
const s2base64Tree = require('s2base64tree');
const base32 = require('geohash-tree/base32');

const dataManagerFn = require('./data-manager');
const dataManagerMain = dataManagerFn();

const chunkArray = (array, length = 64) => {
  const arr = array.map(x => x);
  const chunks = [];
  while (arr.length) {
    chunks.push(arr.splice(0, length));
  }
  return chunks;
};

const hexToCellID = hexWithPrefix => hexWithPrefix.padEnd(18, '0');
const base32ToCellID = base32str => '0x' + Array.from(base32str).map(char => parseInt(base32.toNumber(char)).toString(2).padStart(5, '0')).join('')
  .padEnd(64, '0').match(/.{1,4}/g).map(bin => parseInt(bin, 2).toString(16)).join('');

const DATA = {
  GeohashRegions: {
    regions: [
      [], [], []
    ],
    removeCells: {
      regionID: dataManagerMain.getObject('UJI').id,
      cellIDs: [
        ['ezpgw9','ezpgw2','ezpgw8'].map(x => base32ToCellID(x)),
        ['ezpgw30','ezpgw31','ezpgw34','ezpgw35','ezpgw3h','ezpgw3j'].map(x => base32ToCellID(x)),
        ['ezpgqxg1','ezpgqxg3','ezpgqxg9','ezpgqxg0','ezpgqxg2','ezpgqxg8','ezpgqxup','ezpgqxur','ezpgqxux'].map(x => base32ToCellID(x))
      ]
    },
    devicesLocation: base32ToCellID('ezpgx3b'),
    devicesLocationUpdateSame: base32ToCellID('ezpgx3c'),
    devicesLocationUpdateDifferent: base32ToCellID('ezpgw2'),
    subLocations: [],
    query: [],
    queryOut: [],
    deviceMovements: []
  },
  S2Regions: {
    regions: [
      [], [], []
    ],
    removeCells: {
      regionID: dataManagerMain.getObject('UJI').id,
      cellIDs: [
        ['0x0d5ffe07','0x0d5ffe0c','0x0d5ffe14'].map(x => hexToCellID(x)),
        ['0x0d5ffdfdf4','0x0d5ffe05','0x0d5ffe064','0x0d5ffe06c','0x0d5ffe071','0x0d5ffe0724'].map(x => hexToCellID(x)),
        ['0x0d5ffde33','0x0d5ffde344','0x0d5ffde34c','0x0d5ffde351','0x0d5ffde353','0x0d5ffde3544','0x0d5ffde354c','0x0d5ffde356c','0x0d5ffde3574'].map(x => hexToCellID(x))
      ]
    },
    devicesLocation: hexToCellID('0x0d5ffe36b2c'),
    devicesLocationUpdateSame: hexToCellID('0x0d5ffe36b3c'),
    devicesLocationUpdateDifferent: hexToCellID('0x0d5ffde35fc'),
    subLocations: [],
    query: [],
    queryOut: [],
    deviceMovements: []
  },
  regions: {
    updateIP: {regionID: dataManagerMain.getObject('GRU').id, ipv4: '0xc0a8011e', ipv6: '0xfe800000296b4ee13f6ac0ff'}
  },
  devices: {
    services: [1, 2, 3],
    ipv4: '0xc0a8011f',
    ipv6: '0xfe800000296b4ee13f6ac100',
    servicesUpdate: [2, 3, 4],
    ipv4Update: '0xc0a80120',
    ipv6Update: '0xfe800000296b4ee13f6ac101',
    subAccounts: []
  },
  reputations: [],
  reputationQueries: []
};

const randomBytes = len => {
  const bytes = [];
  for (let i = 0; i < len; i++) {
    bytes.push(Math.round(Math.random() * 255));
  }
  return '0x' + bytes.map(x => x.toString(16).padStart(2, '0')).join('');
};

const randomArrayMember = array => array[Math.round(Math.random() * (array.length - 1))];

const web3 = new Web3('http://127.0.0.1:9545/');

const precisions = [
  {geohash: 6, s2: 14},
  {geohash: 7, s2: 17},
  {geohash: 8, s2: 19}
];
const regionCodes = dataManagerMain.listKeys();

let precisionIndex = 0;
for (let precision of precisions) {
  console.log(`Reading regions precision geohash = ${precision.geohash}, s2 = ${precision.s2}...`)
  const dataManager = dataManagerFn(precision.geohash, precision.s2);
  for (let code of regionCodes) {
    DATA.GeohashRegions.regions[precisionIndex].push({
      ...dataManager.getObject(code),
      cells: chunkArray(dataManager.getGeohash(code)),
      tree: geohashTree.chunkbinary(dataManager.getGeohashTree(code), 128)
    });
    DATA.S2Regions.regions[precisionIndex].push({
      ...dataManager.getObject(code),
      cells: chunkArray(dataManager.getS2Cells(code)),
      tree: s2base64Tree.chunk(dataManager.getS2Base64Tree(code), 128)
    });
  }
  precisionIndex++;
}

const devicesCount = 200;
const movement = 100;
const queryTrials = 5000;
const queryOutTrials = 1000;
const reputationCount = 500;
const reputationQueryTrials = 1000;

const dataManger = dataManagerFn(8, 19);
const geohashCells = regionCodes.map(code => dataManger.getGeohash(code));
const s2Cells = regionCodes.map(code => dataManger.getS2Cells(code));
const geohashCellsAll = new Set(geohashCells.reduce((arr, curr) => [...arr, ...curr], []));
const s2CellsAll = new Set(s2Cells.reduce((arr, curr) => [...arr, ...curr], []));
const geohashCellsAllArr = Array.from(geohashCellsAll);
const s2CellsAllArr = Array.from(s2CellsAll);
const regionIDs = regionCodes.map(code => dataManger.getObject(code).id);

console.log(`Generating ${devicesCount} devices...`);
for (let i = 0; i < devicesCount; i++) {
  const account = web3.eth.accounts.privateKeyToAccount(randomBytes(32));
  DATA.devices.subAccounts.push({address: account.address, priv: account.privateKey});
  DATA.GeohashRegions.subLocations.push(randomArrayMember(geohashCells[i % regionCodes.length]));
  DATA.S2Regions.subLocations.push(randomArrayMember(s2Cells[i % regionCodes.length]));
}

console.log(`Generating ${movement} random movement...`);
for (let i = 0; i < movement; i++) {
  DATA.GeohashRegions.deviceMovements.push({
    device: randomArrayMember(DATA.devices.subAccounts),
    newLocation: randomArrayMember(geohashCellsAllArr)
  });
  DATA.S2Regions.deviceMovements.push({
    device: randomArrayMember(DATA.devices.subAccounts),
    newLocation: randomArrayMember(s2CellsAllArr)
  });
}

console.log(`Generating ${queryTrials} query test cases...`);
for (let i = 0; i < queryTrials; i++) {
  const regionIndex = i % regionCodes.length;
  DATA.GeohashRegions.query.push(randomArrayMember(geohashCells[regionIndex]));
  DATA.S2Regions.query.push(randomArrayMember(s2Cells[regionIndex]));
}

console.log(`Generating ${queryOutTrials} query out-of-region test cases...`);
for (let i = 0; i < queryOutTrials; i++) {
  let cell;

  do {
    cell = randomBytes(8);
  } while (geohashCellsAll.has(cell));
  DATA.GeohashRegions.queryOut.push(cell);

  do {
    const firstByte = (Math.round(Math.random() * 6) * 32) + (Math.round(Math.random() * 31));
    const middleBytes = randomBytes(6).substr(2);
    const lastByte = (Math.round(Math.random() * 15) * 16) + randomArrayMember([0x1, 0x3, 0x4, 0x5, 0x7, 0x9, 0xb, 0xc, 0xd, 0xf]);
    cell = `0x${firstByte.toString(16).padStart(2, '0')}${middleBytes}${lastByte.toString(16).padStart(2, '0')}`;
  } while (s2CellsAll.has(cell));
  DATA.S2Regions.queryOut.push(cell);
}

const addresses = DATA.devices.subAccounts.map(x => x.address);
console.log(`Generating ${reputationCount} reputations...`);
for (let i = 0; i < reputationCount; i++) {
  DATA.reputations.push({
    regionID: randomArrayMember(regionIDs),
    address: randomArrayMember(addresses),
    service: randomArrayMember([1, 2]),
    reputation: Math.random() * 0xffffffffffffffff
  });
}

console.log(`Generating ${reputationQueryTrials} random reputation query...`);
for (let i = 0; i < reputationQueryTrials; i++) {
  if (Math.random() > 0.8) {
    const reputation = randomArrayMember(DATA.reputations);
    DATA.reputationQueries.push({
      regionID: reputation.regionID, address: reputation.address, service: reputation.service
    });
  } else {
    DATA.reputationQueries.push({
      regionID: randomArrayMember(regionIDs),
      address: randomArrayMember(addresses),
      service: randomArrayMember([1, 2])
    });
  }
}

if (!fs.existsSync('./data/out')) {
  fs.mkdirSync('./data/out');
}

fs.writeFileSync('./data/out/experiment-data.json', JSON.stringify(DATA));
