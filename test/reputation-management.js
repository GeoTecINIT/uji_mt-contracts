const S2RegionsCells = artifacts.require('S2RegionsCells');
const Devices = artifacts.require('Devices');
const ReputationManagement = artifacts.require('ReputationManagement');

const web3Utils = require('web3-utils');
const s2base64tree = require('s2base64tree');
const dataManager = require('../data/data-manager')();

const toFullCellID = hex => hex.padEnd(18, '0');
const toReputationValue = ratio => web3Utils.toBN(Math.round(ratio * 0xffffffffffffffff)).toString();

contract('ReputationManagement', accounts => {
  const ujiID = dataManager.getObject('UJI').id;
  const gruID = dataManager.getObject('GRU').id;

  before(async() => {
    const regions = await S2RegionsCells.deployed();
    const devices = await Devices.deployed();

    const addingRegions = ['UJI', 'GRU'];
    const registrars = [accounts[0], accounts[1]];
    for (let i = 0; i < addingRegions.length; i++) {
      const code = addingRegions[i];
      const metadata = dataManager.getObject(code);
      const chunks = s2base64tree.chunk(dataManager.getS2Base64Tree(code));
      await regions.registerRegion(metadata.id, web3Utils.stringToHex(metadata.name), 0, 0, {from: registrars[i]});
      for (let j = 0; j < chunks.length; j++) {
        await regions.addTree(metadata.id, chunks[j], {from: registrars[i]});
      }
    }

    // UJI1, UJI12, GRU1, GRU12, GRU13, NULL123
    const locations = ['0x0d5ffe0605f', '0x0d5ffe1a5901', '0x129fff62d', '0x12a001cc', '0x12a0000004', '0x0d6000c3'].map(x => toFullCellID(x));
    const services = [['1'], ['1', '2'], ['1'], ['1', '2'], ['1', '3'], ['1', '2', '3']];
    for (let i = 0; i < locations.length; i++) {
      await devices.registerDevice(locations[i], 0, 0, services[i], {from: accounts[i + 2]});
    }
  });

  const tests1 = [
    {addr: accounts[2], service: 1, ratio: 0.5, by: accounts[0], regionID: ujiID},
    {addr: accounts[3], service: 1, ratio: 0.7, by: accounts[0], regionID: ujiID},
    {addr: accounts[3], service: 2, ratio: 0.2, by: accounts[0], regionID: ujiID},
    {addr: accounts[4], service: 1, ratio: 0.8, by: accounts[1], regionID: gruID},
    {addr: accounts[5], service: 2, ratio: 0.6, by: accounts[1], regionID: gruID},
    {addr: accounts[6], service: 1, ratio: 0.0, by: accounts[1], regionID: gruID},
    {addr: accounts[6], service: 3, ratio: 0.9, by: accounts[1], regionID: gruID}
  ];

  it('should be able to add records', async() => {
    const reputationManagement = await ReputationManagement.deployed();
    for (let i = 0; i < tests1.length; i++) {
      const indicatorMsg = `at case ${i}: ${JSON.stringify(tests1[i])}`;
      try {
        await reputationManagement.updateReputation(tests1[i].regionID, tests1[i].addr, tests1[i].service, toReputationValue(tests1[i].ratio), {from: tests1[i].by});
        expect(true, indicatorMsg).to.be.true;
      } catch (err) {
        expect(true, indicatorMsg + ` - ${err}`).to.be.false;
      }
    }
  });

  it('should not be able to add record of different region', async() => {
    const reputationManagement = await ReputationManagement.deployed();
    try {
      await reputationManagement.updateReputation(ujiID, accounts[2], 1, toReputationValue(1), {from: accounts[1]});
      expect(true).to.be.false;
    } catch {
      expect(true).to.be.true;
    }
  });

  it('should be able to get value by specifying region ID', async() => {
    const reputationManagement = await ReputationManagement.deployed();
    for (let i = 0; i < tests1.length; i++) {
      const indicatorMsg = `at case ${i}: ${JSON.stringify(tests1[i])}`;
      const value = await reputationManagement.getReputationValue(tests1[i].regionID, tests1[i].addr, tests1[i].service);
      expect(value.toString()).to.equal(toReputationValue(tests1[i].ratio), indicatorMsg);
    }
  });

  it('should be able to get value without specifying region ID (using device current location)', async() => {
    const reputationManagement = await ReputationManagement.deployed();
    for (let i = 0; i < tests1.length; i++) {
      const indicatorMsg = `at case ${i}: ${JSON.stringify(tests1[i])}`;
      const value = await reputationManagement.getReputationValue(tests1[i].addr, tests1[i].service);
      expect(value.toString()).to.equal(toReputationValue(tests1[i].ratio), indicatorMsg);
    }
    const value = await reputationManagement.getReputationValue(accounts[7], 1);
    expect(value.toString()).to.equal('0');
  });

  it('should be able to get value correctly even device has been moved', async() => {
    const devices = await Devices.deployed();
    const reputationManagement = await ReputationManagement.deployed();

    let reputationValue = await reputationManagement.getReputationValue(accounts[4], 1);
    expect(reputationValue.toString()).to.equal(toReputationValue(0.8));

    await devices.updateDeviceLocation(toFullCellID('0x0d5ffe0c'), {from: accounts[4]}); // [4] GRU => UJI

    reputationValue = await reputationManagement.getReputationValue(accounts[4], 1);
    expect(reputationValue.toString()).to.equal('0');

    reputationValue = await reputationManagement.getReputationValue(gruID, accounts[4], 1);
    expect(reputationValue.toString()).to.equal(toReputationValue(0.8));
  });

  it('should be able to update value', async() => {
    const reputationManagement = await ReputationManagement.deployed();
    try {
      await reputationManagement.updateReputation(ujiID, accounts[2], 1, toReputationValue(0.8), {from: accounts[0]});
      expect(true).to.be.true;
    } catch (error) {
      expect(false, error).to.be.true;
    }
  });

  // UJI1, UJI12, GRU|UJI1, GRU12, GRU13, NULL123
  const tests2 = [
    {addr: accounts[2], service: 1, value: toReputationValue(0.8), count: 2, regionID: ujiID, skip2: false},
    {addr: accounts[3], service: 1, value: toReputationValue(0.7), count: 1, regionID: ujiID, skip2: false},
    {addr: accounts[3], service: 2, value: toReputationValue(0.2), count: 1, regionID: ujiID, skip2: false},
    {addr: accounts[4], service: 1, value: toReputationValue(0.8), count: 1, regionID: gruID, skip2: true},
    {addr: accounts[4], service: 1, value: toReputationValue(0.0), count: 0, regionID: ujiID, skip2: false},
    {addr: accounts[5], service: 1, value: toReputationValue(0.0), count: 0, regionID: gruID, skip2: false},
    {addr: accounts[5], service: 2, value: toReputationValue(0.6), count: 1, regionID: gruID, skip2: false},
    {addr: accounts[6], service: 1, value: toReputationValue(0.0), count: 1, regionID: gruID, skip2: false},
    {addr: accounts[6], service: 3, value: toReputationValue(0.9), count: 1, regionID: gruID, skip2: false}
  ];

  it('should be able to get data by specifying region ID', async() => {
    const reputationManagement = await ReputationManagement.deployed();
    for (let i = 0; i < tests2.length; i++) {
      const indicatorMsg = `at case ${i}: ${JSON.stringify(tests2[i])}`;
      const data = await reputationManagement.getReputationData(tests2[i].regionID, tests2[i].addr, tests2[i].service, {from: accounts[0]});
      expect(data['value'].toString()).to.equal(tests2[i].value, indicatorMsg);
      expect(data['records'].length).to.equal(data['timestamps'].length, indicatorMsg);
      expect(data['records'].length).to.equal(tests2[i].count, indicatorMsg);
    }
  });

  it('should be able to get data without specifying region ID (using device current location)', async() => {
    const reputationManagement = await ReputationManagement.deployed();
    for (let i = 0; i < tests2.length; i++) {
      if (tests2[i].skip2) {
        continue;
      }
      const indicatorMsg = `at case ${i}: ${JSON.stringify(tests2[i])}`;
      const data = await reputationManagement.getReputationData(tests2[i].addr, tests2[i].service, {from: accounts[0]});
      expect(data['value'].toString()).to.equal(tests2[i].value, indicatorMsg);
      expect(data['records'].length).to.equal(data['timestamps'].length, indicatorMsg);
      expect(data['records'].length).to.equal(tests2[i].count, indicatorMsg);
    }
    const data = await reputationManagement.getReputationData(accounts[7], 0);
    expect(data['value'].toString()).to.equal('0');
    expect(data['records'].length).to.equal(data['timestamps'].length);
    expect(data['records'].length).to.equal(0);
  });

  // UJI1, UJI12, GRU|UJI1, GRU12, GRU13, NULL123

  const service1tests = [
    {addr: accounts[2], reputation: toReputationValue(0.5)},
    {addr: accounts[3], reputation: toReputationValue(0.7)},
    {addr: accounts[4], reputation: toReputationValue(0.0)},
    {addr: accounts[5], reputation: toReputationValue(0.0)},
    {addr: accounts[6], reputation: toReputationValue(0.0)}
  ].reduce((obj, curr) => {
    obj[curr.addr] = curr.reputation;
    return obj;
  }, {});

  it('should be able to list devices and their reputation value in a specified region', async() => {
    const reputationManagement = await ReputationManagement.deployed();
    const devices = await reputationManagement.getInRegionWithService(ujiID, 1);
    expect(devices.length).to.equal(3);
    expect(devices.map(d => d['device']['addr'])).to.have.members([accounts[2], accounts[3], accounts[4]]);
    for (let i = 0; i < devices.length; i++) {
      const indicatorMsg = `index ${i}`;
      expect(devices[i]['device']['reputation']).to.equal(service1tests[devices[i]['addr']], indicatorMsg);
    }
  });

  it('should be able to list devices and their reputation value in same region with specified location', async() => {
    const reputationManagement = await ReputationManagement.deployed();
    const devices = await reputationManagement.getInSameRegionWithService(toFullCellID('0x0d6000369'), 1);
    expect(devices.length).to.equal(2);
    expect(devices.map(d => d['device']['addr'])).to.have.members([accounts[5], accounts[6]]);
    for (let i = 0; i < devices.length; i++) {
      const indicatorMsg = `index ${i}`;
      expect(devices[i]['device']['reputation']).to.equal(service1tests[devices[i]['addr']], indicatorMsg);
    }
  });

  it('should not be able to list devices and their reputation value in unregistered region', async() => {
    const reputationManagement = await ReputationManagement.deployed();
    const devices = await reputationManagement.getInSameRegionWithService(toFullCellID('0x0d6000c3'), 1);
    expect(devices).to.be.empty;
  });

});
