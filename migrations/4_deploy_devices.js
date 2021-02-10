const Devices = artifacts.require('Devices');
const ReputationManagement = artifacts.require('ReputationManagement');

module.exports = async(deployer, networkName) => {
  const Regions = require('../regions-artifact')(networkName);
  const regions = await Regions.deployed();

  await deployer.deploy(Devices, regions.address);
  await deployer.link(Devices, ReputationManagement);
};
