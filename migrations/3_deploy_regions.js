const Devices = artifacts.require('Devices');
const S2Regions = artifacts.require('S2Regions');

module.exports = async(deployer) => {
  await deployer.deploy(S2Regions);
  await deployer.link(S2Regions, Devices);
};
