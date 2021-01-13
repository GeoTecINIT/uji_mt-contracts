const ReputationManagement = artifacts.require('ReputationManagement');
const Utils = artifacts.require('Utils');

module.exports = deployer => {
  deployer.deploy(Utils);
  deployer.link(Utils, ReputationManagement);
  deployer.deploy(ReputationManagement);
};
