const Devices = artifacts.require('Devices');

module.exports = async(deployer, networkName) => {
  // ---------------------------------------------
  // FOR TESTING (uncomment for truffle test)
  // const S2Regions = artifacts.require('S2Regions');
  // const GeohashRegions = artifacts.require('GeohashRegions');
  // await deployer.deploy(S2Regions);
  // await deployer.deploy(GeohashRegions);
  // const DefaultRegions = require('../regions-artifact')(networkName);
  // await deployer.link(DefaultRegions, Devices);
  // ---------------------------------------------
  // FOR DEPLOYMENT (uncomment for truffle deploy/migrate)
  const Regions = require('../regions-artifact')(networkName);
  await deployer.deploy(Regions);
  await deployer.link(Regions, Devices);
  // ---------------------------------------------
};
