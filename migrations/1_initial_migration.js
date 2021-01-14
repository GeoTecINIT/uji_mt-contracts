const Migrations = artifacts.require("Migrations");
const Web3 = require('web3');
const truffleConfig = require('../truffle-config');

module.exports = function (deployer, networkName) {
  const networkConfig = truffleConfig.networks[networkName];
  if (networkConfig && networkConfig.password) {
    const passwords = require('../passwords');
    if (passwords[networkName]) {
      console.log(`Unlocking ${networkConfig.from} with defined password...`);
      const web3 = new Web3(new Web3.providers.HttpProvider(`http://${networkConfig.host}:${networkConfig.port}`));
      web3.eth.personal.unlockAccount(networkConfig.from, passwords[networkName], 3600);
    }
  }

  deployer.deploy(Migrations);
};
