const Utils = artifacts.require('Utils');
const GeohashRegions = artifacts.require('GeohashRegions');
const GeohashTrees = artifacts.require('GeohashTrees');

module.exports = deployer => {
  deployer.deploy(Utils);
  deployer.link(Utils, GeohashRegions);
  deployer.deploy(GeohashRegions);
  deployer.link(Utils, GeohashTrees);
  deployer.link(GeohashRegions, GeohashTrees);
  deployer.deploy(GeohashTrees);
};
