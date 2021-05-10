const S2CellsRegions = artifacts.require('S2CellsRegions');
const Devices = artifacts.require('Devices');

const web3Utils = require('web3-utils');
const s2base64tree = require('s2base64tree');
const dataManager = require('../data/data-manager')();

const toFullCellID = hex => hex.padEnd(18, '0');

contract('Devices', accounts => {
  const UJIid = dataManager.getObject('UJI').id.toString();
  const GRUid = dataManager.getObject('GRU').id.toString();
  const CPCid = dataManager.getObject('CPC').id.toString();

  before(async() => {
    const regions = await S2CellsRegions.deployed();
    const regionsToAdd = ['UJI', 'GRU', 'CPC'];
    for (let i = 0; i < regionsToAdd.length; i++) {
      const metadata = dataManager.getObject(regionsToAdd[i]);
      await regions.registerRegion(metadata.id, web3Utils.stringToHex(metadata.name), 0, 0);
      const chunks = s2base64tree.chunk(dataManager.getS2Base64Tree(regionsToAdd[i]), 128);
      for (let j = 0; j < chunks.length; j++) {
        await regions.addTree(metadata.id, chunks[j]);
      }
    }
  });

  it('should be able to register device', async() => { // UJI12, GRU123, GRU, CPC1, CPC34
    const devices = await Devices.deployed();
    const locations = ['0x0d5ffe0ef427', '0x12a00006fed', '0x0d60001c', '0x0d60007f', '0x0d5ffe328a9d'].map(x => toFullCellID(x));
    const regionIDs = [UJIid, GRUid, GRUid, CPCid, CPCid];
    const services = [['1', '2'], ['1', '2', '3'], [], ['1'], ['3', '4']];
    for (let i = 1; i < 6; i++) {
      const indicatorMsg = `at ${i}: ${accounts[i]}`;
      await devices.registerDevice(locations[i - 1], 0, 0, services[i - 1], {from: accounts[i]});

      const device = await devices.getDeviceFromAddress(accounts[i]);
      expect(device['active'], indicatorMsg).to.be.true;
      expect(device['regionID']).to.equal(regionIDs[i - 1], indicatorMsg);
      expect(device['services'].length).to.equal(services[i - 1].length, indicatorMsg);
      expect(device['services']).to.have.members(services[i - 1], indicatorMsg);
    }

    const ujiDevices = await devices.getDevicesInRegion(UJIid);
    expect(ujiDevices.map(d => d['addr'])).to.include(accounts[1]);

    const gruDevices = await devices.getDevicesInRegion(GRUid);
    expect(gruDevices.map(d => d['addr'])).to.have.members([accounts[2], accounts[3]]);

    const cpcDevices = await devices.getDevicesInRegion(CPCid);
    expect(cpcDevices.map(d => d['addr'])).to.have.members([accounts[4], accounts[5]]);
  });

  it('should not be able to register device that already registered', async() => {
    const devices = await Devices.deployed();
    try {
      await devices.registerDevice('0x0', 0, 0, [], {from: accounts[1]});
      expect(false).to.be.true;
    } catch {
      expect(true).to.be.true;
    }
  });

  it('should be able to update device location in the same region', async() => {  // [2] GRU => GRU
    const devices = await Devices.deployed();
    await devices.updateDeviceLocation(toFullCellID('0x12a001c608b'), {from: accounts[2]});
    
    const device = await devices.getDeviceFromAddress(accounts[2]);
    expect(device['regionID']).to.equal(GRUid);

    const gruDevices = await devices.getDevicesInRegion(GRUid);
    expect(gruDevices.map(d => d['addr'])).to.include(accounts[2]);
  });

  it('should be able to update device location to unregistered region', async() => { // [5] CPC => undefined (VRL)
    const devices = await Devices.deployed();
    await devices.updateDeviceLocation(toFullCellID('0x0d60068a21'), {from: accounts[5]});

    const device = await devices.getDeviceFromAddress(accounts[5]);
    expect(device['regionID']).to.equal('0');

    const cpcDevices = await devices.getDevicesInRegion(CPCid);
    expect(cpcDevices).to.not.include(accounts[5]);
  });

  it('should be able to update device location from unregistered region to registered region', async() => { // [5] undefined => CPC
    const devices = await Devices.deployed();
    await devices.updateDeviceLocation(toFullCellID('0x0d60007426b'), {from: accounts[5]});

    const device = await devices.getDeviceFromAddress(accounts[5]);
    expect(device['regionID']).to.equal(CPCid);

    const cpcDevices = await devices.getDevicesInRegion(CPCid);
    expect(cpcDevices.map(d => d['addr'])).to.include(accounts[5]);
  });

  it('should be able to update device location from registered region to another registered region', async() => { // [2] GRU => UJI
    const devices = await Devices.deployed();
    await devices.updateDeviceLocation(toFullCellID('0x0d5ffdfd'), {from: accounts[2]});

    const device = await devices.getDeviceFromAddress(accounts[2]);
    expect(device['regionID']).to.equal(UJIid);

    const ujiDevices = await devices.getDevicesInRegion(UJIid);
    expect(ujiDevices.map(d => d['addr'])).to.include(accounts[2]);
  });

  it('should be able to update device services', async() => { // [1] => none, [2] => 124, [3] => 2, ([4] => 1), [5] => 134
    const devices = await Devices.deployed();
    const services = [[], [1, 2, 4], [2], false, [1, 3, 4]];
    const testServices = [false, ['1', '2', '4'], ['2'], ['1'], ['1', '3', '4']];
    for (let i = 0; i < 5; i++) {
      if (services[i] === false) {
        continue;
      }
      await devices.updateDeviceServices(services[i], {from: accounts[i + 1]});
    }

    for (let i = 0; i < 5; i++) {
      const device = await devices.getDeviceFromAddress(accounts[i + 1]);
      const indicatorMsg = `at ${i}: ${accounts[i]}`;
      if (testServices[i] === false) {
        expect(device['services'], indicatorMsg).to.be.empty;
      } else {
        expect(device['services'].length).to.equal(testServices[i].length, indicatorMsg);
        expect(device['services']).to.have.members(testServices[i], indicatorMsg);
      }
    }
  });

  it('should be able to update device IP addresses', async() => {
    const ipv4 = '0xc0a8011e';
    const ipv6 = '0xfe800000296b4ee13f6ac0ff';
    const devices = await Devices.deployed();
    await devices.updateDeviceIPs(ipv4, ipv6, {from: accounts[1]});

    const device = await devices.getDeviceFromAddress(accounts[1]);
    expect(device['ipv4']).to.equal(web3Utils.toBN(ipv4).toString());
    expect(device['ipv6']).to.equal(web3Utils.toBN(ipv6).toString());
  });

  it('should be able to deactivate device', async() => {
    const devices = await Devices.deployed();
    await devices.deactivateDevice({from: accounts[1]});

    const device = await devices.getDeviceFromAddress(accounts[1]);
    expect(device['active']).to.be.false;
  });

  it('should not be able to deactivate a deactivated device', async() => {
    const devices = await Devices.deployed();
    try {
      await devices.deactivateDevice({from: accounts[1]});
      expect(true).to.be.false;
    } catch {
      expect(true).to.be.true;
    }
  });

  it('should not be update deactivated device location', async() => {
    const devices = await Devices.deployed();
    try {
      await devices.updateDeviceLocation(toFullCellID('0x0d5ffe14'), {from: accounts[1]});
      expect(true).to.be.false;
    } catch {
      expect(true).to.be.true;
    }
  });

  it('should not be update deactivated services', async() => {
    const devices = await Devices.deployed();
    try {
      await devices.updateDeviceServices([1, 2, 3], {from: accounts[1]});
      expect(true).to.be.false;
    } catch {
      expect(true).to.be.true;
    }
  });

  it('should not be update deactivated IP addresses', async() => {
    const devices = await Devices.deployed();
    try {
      await devices.updateDeviceIPs('0xc0a8011e', '0xfe800000296b4ee13f6ac0ff', {from: accounts[1]});
      expect(true).to.be.false;
    } catch {
      expect(true).to.be.true;
    }
  });

  it('should be able to register to deactivated device', async() => {
    const devices = await Devices.deployed();
    await devices.registerDevice(toFullCellID('0x0d5ffe0427'), 0, 0, [1, 3], {from: accounts[1]});

    const device = await devices.getDeviceFromAddress(accounts[1]);
    expect(device['active']).to.be.true;
    expect(device['regionID']).to.equal(UJIid);
  });

  it('should be able to get list of registered devices', async() => {
    const devices = await Devices.deployed();

    const deviceAddresses = await devices.getDeviceAddresses();
    expect(deviceAddresses.length).to.equal(5);
    expect(deviceAddresses).to.have.members(accounts.slice(1, 6));
  });

  it('should be able to get devices data from specified addresses', async() => { // UJI13, [UJI124], GRU2, [CPC1], [CPC34]
    const devices = await Devices.deployed();
    const addresses = [accounts[2], accounts[4], accounts[5]];
    const testRegionIDs = [UJIid, CPCid, CPCid];

    const devicesData = await devices.getDevicesFromAddresses(addresses);
    for (let i = 0; i < devicesData.length; i++) {
      const indicatorMsg = `at index ${i} address ${accounts[i]}`;
      expect(devicesData[i]['addr']).to.equal(addresses[i], indicatorMsg);
      expect(devicesData[i]['regionID']).to.equal(testRegionIDs[i]);
    }
  });

  it('should be able to get devices in specified region', async() => { // UJI13, UJI124, GRU2, CPC1, CPC34
    const devices = await Devices.deployed();
    const tests = [
      {id: UJIid, addresses: [accounts[1], accounts[2]]},
      {id: GRUid, addresses: [accounts[3]]},
      {id: CPCid, addresses: [accounts[4], accounts[5]]}
    ];

    for (let i = 0; i < tests.length; i++) {
      const regionID = tests[i].id;
      const addresses = tests[i].addresses;

      const indicatorMsg = `at index ${i} region ID ${regionID}`;
      const devicesList = await devices.getDevicesInRegion(regionID);
      expect(devicesList.length).to.equal(addresses.length, indicatorMsg);
      expect(devicesList.map(d => d['addr'])).to.have.members(addresses);
    }
  });

  it('should be able to get devices in a region with specified service (by region ID)', async() => { // UJI13, UJI124, GRU2, CPC1, CPC34
    const devices = await Devices.deployed();
    let candidates;

    candidates = await devices.getDevicesInRegionWithService(UJIid, 1);
    expect(candidates.length).to.equal(2);
    expect(candidates.map(d => d['addr'])).to.have.members([accounts[1], accounts[2]]);

    candidates = await devices.getDevicesInRegionWithService(CPCid, 3);
    expect(candidates.length).to.equal(1);
    expect(candidates.map(d => d['addr'])).to.include(accounts[5]);

    candidates = await devices.getDevicesInRegionWithService(GRUid, 4);
    expect(candidates.map(d => d['addr'])).to.be.empty;
  });

  it('should be able to get devices in same region with specified service (by location)', async() => {
    const devices = await Devices.deployed();
    let candidates;

    candidates = await devices.getDevicesInSameRegionWithService(toFullCellID('0x0d5ffe10ae89'), 1);
    expect(candidates.length).to.equal(2);
    expect(candidates.map(d => d['addr'])).to.have.members([accounts[1], accounts[2]]);

    candidates = await devices.getDevicesInSameRegionWithService(toFullCellID('0x0d5fffe7'), 3);
    expect(candidates.length).to.equal(1);
    expect(candidates.map(d => d['addr'])).to.include(accounts[5]);

    candidates = await devices.getDevicesInSameRegionWithService(toFullCellID('0x129fff749'), 4);
    expect(candidates.map(d => d['addr'])).to.be.empty;
  });

});
