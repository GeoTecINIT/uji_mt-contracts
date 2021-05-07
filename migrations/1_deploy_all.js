const Migrations = artifacts.require('Migrations');
const Utils = artifacts.require('Utils');
const Devices = artifacts.require('Devices');
const ReputationManagement = artifacts.require('ReputationManagement');

const Web3 = require('web3');
const truffleConfig = require('../truffle-config');

module.exports = async(deployer, networkName) => {
  const networkConfig = truffleConfig.networks[networkName];
  if (networkConfig && networkConfig.password) {
    const passwords = require('../passwords');
    if (passwords[networkName]) {
      console.log(`Unlocking ${networkConfig.from} with defined password...`);
      const web3 = new Web3(new Web3.providers.HttpProvider(`http://${networkConfig.host}:${networkConfig.port}`));
      web3.eth.personal.unlockAccount(networkConfig.from, passwords[networkName], 3600);
    }
  }

  await deployer.deploy(Migrations);
  await deployer.deploy(Utils);

  // ---------------------------------------------
  // FOR TESTING (uncomment for `truffle test`)
  const S2RegionsCells = artifacts.require('S2RegionsCells');
  const GeohashRegionsCells = artifacts.require('GeohashRegionsCells');
  const Regions = S2RegionsCells;
  await deployer.link(Utils, [S2RegionsCells, GeohashRegionsCells, Devices]);
  await deployer.deploy(S2RegionsCells);
  await deployer.deploy(GeohashRegionsCells);
  await deployer.link(Regions, Devices);
  // ---------------------------------------------
  // FOR DEPLOYMENT (uncomment for `truffle deploy/migrate --f 1`)
  // const Regions = artifacts.require(require('../regions-artifact')(networkName));
  // await deployer.link(Utils, [Regions, Devices]);
  // await deployer.deploy(Regions);
  // await deployer.link(Regions, Devices);
  // ---------------------------------------------

  const regions = await Regions.deployed();

  await deployer.deploy(Devices, regions.address);
  await deployer.link(Devices, ReputationManagement);

  const devices = await Devices.deployed();

  await deployer.deploy(ReputationManagement, devices.address);
};
