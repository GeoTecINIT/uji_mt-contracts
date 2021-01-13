const GeohashRegions = artifacts.require('GeohashRegions');
const Regions = artifacts.require('Regions');
const Utils = artifacts.require('Utils');

module.exports = deployer => {
  deployer.deploy(Utils);
  deployer.link(Utils, Regions);
  deployer.link(Utils, GeohashRegions);

  deployer.link(Regions, GeohashRegions);

  deployer.deploy(GeohashRegions);
};
