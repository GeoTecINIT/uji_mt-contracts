const GeohashRegions = artifacts.require('GeohashRegions');
const Regions = artifacts.require('Regions');
const S2Regions = artifacts.require('S2Regions');
const Utils = artifacts.require('Utils');

module.exports = deployer => {
  deployer.deploy(Utils);
  deployer.link(Utils, Regions);
  deployer.link(Utils, GeohashRegions);
  deployer.link(Utils, S2Regions);

  deployer.link(Regions, GeohashRegions);
  deployer.link(Regions, S2Regions);

  deployer.deploy(GeohashRegions);
  deployer.deploy(S2Regions);
};
