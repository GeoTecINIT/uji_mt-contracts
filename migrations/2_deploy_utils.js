const Devices = artifacts.require('Devices');
const Utils = artifacts.require('Utils');

module.exports = async(deployer, networkName) => {
  await deployer.deploy(Utils);

  // ---------------------------------------------
  // FOR TESTING (uncomment for truffle test)
  // const S2Regions = artifacts.require('S2Regions');
  // const GeohashRegions = artifacts.require('GeohashRegions');
  // await deployer.link(Utils, S2Regions);
  // await deployer.link(Utils, GeohashRegions);
  // ---------------------------------------------
  // FOR DEPLOYMENT (uncomment for truffle deploy/migrate)
  const Regions = require('../regions-artifact')(networkName);
  await deployer.link(Utils, Regions);
  // ---------------------------------------------

  await deployer.link(Utils, Devices);
};
