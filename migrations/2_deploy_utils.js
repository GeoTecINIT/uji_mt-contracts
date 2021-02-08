const Devices = artifacts.require('Devices');
const S2Regions = artifacts.require('S2Regions');
const GeohashRegions = artifacts.require('GeohashRegions');
const Utils = artifacts.require('Utils');

module.exports = async(deployer) => {
  await deployer.deploy(Utils);
  await deployer.link(Utils, S2Regions);
  await deployer.link(Utils, GeohashRegions);
  await deployer.link(Utils, Devices);
};
