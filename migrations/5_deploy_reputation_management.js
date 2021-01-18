const Devices = artifacts.require('Devices');
const ReputationManagement = artifacts.require('ReputationManagement');

module.exports = async(deployer) => {
  const devices = await Devices.deployed();

  await deployer.deploy(ReputationManagement, devices.address);
};
