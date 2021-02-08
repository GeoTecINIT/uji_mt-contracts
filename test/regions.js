const GeohashRegions = artifacts.require('GeohashRegions');
const S2Regions = artifacts.require('S2Regions');
const web3utils = require('web3-utils');
const base32 = require('geohash-tree/base32');
const dataManager = require('../data/data-manager')();

const strToHex = str => web3utils.stringToHex(str);
const hexToCellID = hexWithPrefix => hexWithPrefix.padEnd(18, '0');
const base32ToCellID = base32str => '0x' + Array.from(base32str).map(char => parseInt(base32.toNumber(char)).toString(2).padStart(5, '0')).join('')
  .padEnd(64, '0').match(/.{1,4}/g).map(bin => parseInt(bin, 2).toString(16)).join('');
const toNumberStr = x => web3utils.toBN(x).toString();

const testRegistration = (Regions, cells) => {
  it('should be able a region', async() => {
    const regions = await Regions.deployed();

    const regionData = {
      id: 1,
      name: 'TestRegion',
      ipv4: '0xc0a8011e',
      ipv6: '0xfe800000296b4ee13f6ac0ff'
    };
    
    await regions.registerRegion(regionData.id, strToHex(regionData.name), regionData.ipv4, regionData.ipv6);
    const region = await regions.getRegionData(1);
    expect(region['metadata']['id']).to.equal(toNumberStr(regionData.id));
    expect(region['metadata']['name']).to.equal(strToHex(regionData.name));
    expect(region['metadata']['ipv4']).to.equal(toNumberStr(regionData.ipv4));
    expect(region['metadata']['ipv6']).to.equal(toNumberStr(regionData.ipv6));
  });

  it('should not be able to add existing region ID', async() => {
    const regions = await Regions.deployed();
    try {
      await regions.registerRegion(1, strToHex('Region 1'), 0, 0);
      expect(true).to.be.false;
    } catch {
      expect(true).to.be.true;
    }
  });

  it('should be able to add cells', async() => {
    const regions = await Regions.deployed();

    await regions.addRegionCells(1, cells);

    const regionData = await regions.getRegionData(1);
    expect(regionData['metadata']['id']).to.equal('1');
    expect(regionData['cellIDs'].length).to.equal(cells.length);
    expect(regionData['cellIDs']).to.have.members(cells.map(x => toNumberStr(x)));
  });
};
contract('GeohashRegions (Test Registration and Adding)', () => {
  const cells = dataManager.getGeohash('UJI');
  testRegistration(GeohashRegions, cells);
});
contract('S2Regions (Test Registration and Adding Cells)', () => {
  const cells = dataManager.getS2Cells('UJI');
  testRegistration(S2Regions, cells);
});

const testTree = (Regions, tree, cells) => {
  it('should be able to add tree', async() => {
    const regions = await Regions.deployed();
    await regions.registerRegion(1, strToHex('Region 1'), 0, 0);
    
    await regions.addTree(1, tree);

    const regionData = await regions.getRegionData(1);
    expect(regionData['metadata']['id']).to.equal('1');
    expect(regionData['cellIDs'].length).to.equal(cells.length);
    expect(regionData['cellIDs']).to.have.members(cells.map(x => toNumberStr(x)));
  });
};
contract('GeohashRegions (Test Tree)', () => {
  const tree = Array.from(dataManager.getGeohashTree('UJI'));
  const cells = dataManager.getGeohash('UJI');
  testTree(GeohashRegions, tree, cells);
});
contract('S2Regions (Test Tree)', () => {
  const tree = Array.from(dataManager.getS2Base64Tree('UJI'));
  const cells = dataManager.getS2Cells('UJI');
  testTree(S2Regions, tree, cells);
});

const testAdvancedRegistration = (acc1, acc2, Regions, cells, deleteCount) => {
  before(async() => {
    const regions = await Regions.deployed();
    await regions.registerRegion(1, strToHex('Region 1'), 0, 0);
    await regions.addRegionCells(1, cells, {from: acc1});

    await regions.registerRegion(2, strToHex('Region 2'), 0, 0, {from: acc2});
    await regions.addRegionCells(2, cells, {from: acc2});
  });

  it('should not be able to add cells to region of other account', async() => {
    const regions = await Regions.deployed();
    try {
      await regions.addRegionCells(1, cells, {from: acc2});
      expect(true).to.be.false;
    } catch {
      expect(true).to.be.true;
    }
  });

  it('should not be able to clear failed cells of other account', async() => {
    const regions = await Regions.deployed();
    try {
      await regions.clearFailedCells(2, cell, {from: acc1});
      expect(true).to.be.false;
    } catch {
      expect(true).to.be.true;
    }
  });

  it('should not be able to remove cells of other account', async() => {
    const regions = await Regions.deployed();
    try {
      await regions.removeRegionCells(1, cells, {from: acc2});
      expect(true).to.be.false;
    } catch {
      expect(true).to.be.true;
    }
  });

  it('should mark occupied cells to be failed', async() => {
    const regions = await Regions.deployed();
    const regionData = await regions.getRegionData(2);
    expect(regionData['failedCellIDs'].length).to.equal(cells.length);
    expect(regionData['failedCellIDs']).to.have.members(cells.map(x => toNumberStr(x)));
  });

  it('should be able to clear failed cells', async() => {
    const regions = await Regions.deployed();
    await regions.clearFailedCells(2, {from: acc2});
    const regionData = await regions.getRegionData(2);
    expect(regionData['failedCellIDs'].length).to.equal(0);
  });
  
  it('should be able to remove cells', async() => {
    const regions = await Regions.deployed();

    const stayingCells = cells.map(x => x);
    const removingCells = stayingCells.splice(0, deleteCount);

    await regions.removeRegionCells(1, removingCells);

    const queriedRegion = await regions.query(removingCells[0]);
    expect(queriedRegion['id']).to.equal('0');

    await regions.addRegionCells(2, removingCells, {from: acc2});

    const regionData1 = await regions.getRegionData(1);
    const regionData2 = await regions.getRegionData(2);

    expect(regionData1['cellIDs'].length).to.equal(stayingCells.length);
    expect(regionData2['cellIDs'].length).to.equal(removingCells.length);
    expect(regionData1['cellIDs']).to.have.members(stayingCells.map(x => toNumberStr(x)));
    expect(regionData2['cellIDs']).to.have.members(removingCells.map(x => toNumberStr(x)));
  });
};
contract('GeohashRegions (Test Registration 2)', accounts => {
  const cells = dataManager.getGeohash('UJI');
  testAdvancedRegistration(accounts[0], accounts[1], GeohashRegions, cells, 2);
});
contract('S2Regions (Test Registration 2)', accounts => {
  const cells = dataManager.getS2Cells('UJI');
  testAdvancedRegistration(accounts[0], accounts[1], S2Regions, cells, 4);
});

const testUpdatingData = (acc1, acc2, Regions) => {
  before(async() => {
    const regions = await Regions.deployed();
    regions.registerRegion(1, strToHex('Region 1'), '0xc0a8011e', '0xfe800000296b4ee13f6ac0ff', {from: acc1});
  });

  it('should be able to update name', async() => {
    const regions = await Regions.deployed();

    let regionData = await regions.getRegionData(1);
    expect(regionData['metadata']['name']).to.equal(strToHex('Region 1'));

    await regions.updateRegionName(1, strToHex('Test Region'));
    regionData = await regions.getRegionData(1);
    expect(regionData['metadata']['name']).to.equal(strToHex('Test Region'));
  });

  it('should be able to update update IP addresses', async() => {
    const regions = await Regions.deployed();
    
    let regionData = await regions.getRegionData(1);
    expect(regionData['metadata']['ipv4']).to.equal(toNumberStr('0xc0a8011e'));
    expect(regionData['metadata']['ipv6']).to.equal(toNumberStr('0xfe800000296b4ee13f6ac0ff'));
    
    await regions.updateRegionIPs(1, '0xc0a8011d', '0xfe800000296b4ee13f6ad0ff');
    regionData = await regions.getRegionData(1);
    expect(regionData['metadata']['ipv4']).to.equal(toNumberStr('0xc0a8011d'));
    expect(regionData['metadata']['ipv6']).to.equal(toNumberStr('0xfe800000296b4ee13f6ad0ff'));
  });

  it('should not be able to update name of other account', async() => {
    const regions = await Regions.deployed();
    try {
      await regions.updateRegionName(1, strToHex('Test Region'), {from: acc2});
      expect(true).to.be.false;
    } catch {
      expect(true).to.be.true;
    }
  });

  it('should not be able to update IPs of other account', async() => {
    const regions = await Regions.deployed();
    try {
      await regions.updateRegionIPs(1, 0, 0, {from: acc2});
      expect(true).to.be.false;
    } catch {
      expect(true).to.be.true;
    }
  });
};
contract('GeohashRegions (Test Updating Data)', accounts => {
  testUpdatingData(accounts[0], accounts[1], GeohashRegions);
});
contract('S2Regions (Test Updating Data)', accounts => {
  testUpdatingData(accounts[0], accounts[1], S2Regions);
});

const testQueryData = (Regions, region1Tree, region2Tree, region1Cells, region2Cells, region1DeeperCells, region2DeeperCells, outCells) => {
  before(async() => {
    const regions = await Regions.deployed();
    await regions.registerRegion(1, strToHex('Region 1'), 0, 0);
    await regions.registerRegion(2, strToHex('Region 2'), 0, 0);

    await regions.addTree(1, region1Tree);
    await regions.addTree(2, region2Tree);
  });

  it('should be able to query exact cells', async() => {
    const regions = await Regions.deployed();
    for (let i = 0; i < region1Cells.length; i++) {
      const region = await regions.query(region1Cells[i]);
      expect(region['id']).to.equal('1', `at [1.${i}] ${region1Cells[i]}`);
    }
    for (let i = 0; i < region2Cells.length; i++) {
      const region = await regions.query(region2Cells[i]);
      expect(region['id']).to.equal('2', `at [2.${i}] ${region2Cells[i]}`);
    }
  });

  it('should be able to query deeper cells', async() => {
    const regions = await Regions.deployed();
    for (let i = 0; i < region1DeeperCells.length; i++) {
      const region = await regions.query(region1DeeperCells[i]);
      expect(region['id']).to.equal('1', `at [1.${i}] ${region1DeeperCells[i]}`);
    }
    for (let i = 0; i < region2DeeperCells.length; i++) {
      const region = await regions.query(region2DeeperCells[i]);
      expect(region['id']).to.equal('2', `at [2.${i}] ${region2DeeperCells[i]}`);
    }
  });

  it('should be query for non-registered cell correctly', async() => {
    const regions = await Regions.deployed();
    for (let i = 0; i < outCells.length; i++) {
      const region = await regions.query(outCells[i]);
      expect(region['id']).to.equal('0', `at [${i}] ${outCells[i]}`);
    }
  });
};
contract('GeohashRegions (Test Query)', () => {
  const tree1 = Array.from(dataManager.getGeohashTree('UJI'));
  const tree2 = Array.from(dataManager.getGeohashTree('CPC'));
  const cells1 = dataManager.getGeohash('UJI');
  const cells2 = dataManager.getGeohash('CPC');
  const deeper1 = ['ezpgw9e', 'ezpgw90', 'ezpgw91fz', 'ezpgw800000', 'ezpgw8ffe5'].map(x => base32ToCellID(x));
  const deeper2 = ['ezpgx0000','ezpgx01egk','ezpgrpzzzzz','ezpgrrb'].map(x => base32ToCellID(x));
  const outs = ['ezpgjx', 'sp0526', 'b3ezh', 'e', 'z', 'ez', '0'].map(x => base32ToCellID(x));
  testQueryData(GeohashRegions, tree1, tree2, cells1, cells2, deeper1, deeper2, outs);
});
contract('S2Regions (Test Query)', () => {
  const tree1 = Array.from(dataManager.getS2Base64Tree('UJI'));
  const tree2 = Array.from(dataManager.getS2Base64Tree('CPC'));
  const cells1 = dataManager.getS2Cells('UJI');
  const cells2 = dataManager.getS2Cells('CPC');
  const deeper1 = ['0x0d5ffe16b', '0x0d5ffdfd47ef'].map(x => hexToCellID(x));
  const deeper2 = ['0x0d5fffc386d91', '0x0d60008100004', '0x0d5fffc5ffffffff'].map(x => hexToCellID(x));
  const outs = ['0x0d5ffe01', '0x0d60071', '0x0d6006ffffffffff', '0x1', '0x129fffa9'].map(x => hexToCellID(x));
  testQueryData(S2Regions, tree1, tree2, cells1, cells2, deeper1, deeper2, outs);
});
