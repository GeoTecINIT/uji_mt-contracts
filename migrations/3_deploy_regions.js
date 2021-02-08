const Devices = artifacts.require('Devices');
const S2Regions = artifacts.require('S2Regions');
const GeohashRegions = artifacts.require('GeohashRegions');

module.exports = async(deployer) => {
  await deployer.deploy(S2Regions);
  await deployer.deploy(GeohashRegions);
  await deployer.link(S2Regions, Devices);
  await deployer.link(GeohashRegions, Devices);
};
