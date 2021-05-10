/**
 * This migration is only for gas consumption measurement.
 * use `truffle deploy/migrate --f 0 --to 1` to reproduce the experiment.
 * to skip this migration use `truffle deploy/migrate --f 1`
 */
const Migrations = artifacts.require('Migrations');
const Utils = artifacts.require('Utils');
const GeohashCellsRegions = artifacts.require('GeohashCellsRegions');
const S2CellsRegions = artifacts.require('S2CellsRegions');
const Devices = artifacts.require('Devices');
const ReputationManagement = artifacts.require('ReputationManagement');

const Web3 = require('web3');
const web3Utils = require('web3-utils');
const fs = require('fs');

const truffleConfig = require('../truffle-config');

const createWeb3 = networkName => {
  const networkConfig = truffleConfig[networkName];
  if (networkConfig && networkConfig.host && networkConfig.port) {
    const web3 = new Web3(new Web3.providers.HttpProvider(`http://${networkConfig.host}:${networkConfig.port}`));
    const passwords = require('../passwords');
    if (passwords[networkName] && networkConfig.password) {
      console.log(`Unlocking ${networkConfig.from} with defined password...`);
      web3.eth.personal.unlockAccount(networkConfig.from, passwords[networkName], 3600);
    }
    return web3;
  }
  return new Web3('http://127.0.0.1:9545/');
};

let web3;

const getGasUsed = async(transactionHash) => {
  const tx = await web3.eth.getTransaction(transactionHash);
  return web3Utils.toBN(tx.gas).toNumber();
};

const getBlockGasUsed = async(transactionHash) => {
  const tx = await web3.eth.getTransaction(transactionHash);
  const block = await web3.eth.getBlock(tx.blockNumber);
  return web3Utils.toBN(block.gasUsed).toNumber();
};

const writeStats = async (filepath, contractArtifacts, networkID) => {
  const data = [['Contract', 'TransactionGas', 'BlockGas']];

  for (let artifact of contractArtifacts) {
    const txHash = artifact.networks[networkID].transactionHash;
    data.push([artifact.contractName, await getGasUsed(txHash), await getBlockGasUsed(txHash)]);
  }
  fs.writeFileSync(filepath, data.map(x => x.join(',')).join('\n'));
};

const deployAndWriteStats = async(deployer, regionsArtifact, networkID, filePath) => {
  await deployer.deploy(Migrations);
  await deployer.deploy(Utils);
  await deployer.link(Utils, regionsArtifact);
  await deployer.link(Utils, Devices);
  await deployer.deploy(regionsArtifact);
  await deployer.link(regionsArtifact, Devices);
  const regions = await regionsArtifact.deployed();
  await deployer.deploy(Devices, regions.address);
  await deployer.link(Devices, ReputationManagement);
  const devices = await Devices.deployed();
  await deployer.deploy(ReputationManagement, devices.address);
  await ReputationManagement.deployed();
  await writeStats(filePath, [Migrations, Utils, regionsArtifact, Devices, ReputationManagement], networkID);
};

module.exports = async(deployer, networkName) => {
  const networkID = truffleConfig.networks[networkName].network_id;
  web3 = createWeb3(networkName);

  if (!fs.existsSync('out/')) {
    fs.mkdirSync('out/');
  }

  console.log('=== DEPLOYMENT LINE 1: GEOHASH ===');
  await deployAndWriteStats(deployer, GeohashCellsRegions, networkID, 'out/experiment-contracts-geohash.csv');

  console.log('=== DEPLOYMENT LINE 2: S2 ===');
  await deployAndWriteStats(deployer, S2CellsRegions, networkID, 'out/experiment-contracts-s2.csv');
};
