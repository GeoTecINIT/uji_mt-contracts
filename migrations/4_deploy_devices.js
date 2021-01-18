const Devices = artifacts.require('Devices');
const ReputationManagement = artifacts.require('ReputationManagement');
const S2Regions = artifacts.require('S2Regions');

module.exports = async(deployer) => {
  const regions = await S2Regions.deployed();

  await deployer.deploy(Devices, regions.address);
  await deployer.link(Devices, ReputationManagement);
};
