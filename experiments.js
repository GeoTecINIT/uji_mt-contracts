const REGIONS_ARTIFACT = 'GeohashRegions'; // GeohashRegions|S2Regions
const PRECISION_INDEX = 0; // 0|1|2
const ADD_MODE = 'cells'; // cells|tree

const Regions = artifacts.require(REGIONS_ARTIFACT);
const Devices = artifacts.require('Devices');
const ReputationManagement = artifacts.require('ReputationManagement');

const Web3 = require('web3');
const web3Utils = require('web3-utils');
const fs = require('fs');

const precisions = {
  GeohashRegions: [6, 7, 8],
  S2Regions: [14, 17, 19]
};

module.exports = async(callback) => {
  try {
    if (!fs.existsSync('./out/')) {
      fs.mkdirSync('./out/');
    }
  
    const web3 = new Web3('http://127.0.0.1:9545/');
    const accounts = await web3.eth.getAccounts();
  
    const headers = ['action', 'attribute', 'txGas', 'blockGas', 'time'];
    const toFile = (file, row, fn = fs.appendFileSync) => {
      fn(file, row.join(',') + '\n');
    };
    const addStat = async(file, action, attr, txHash = 0, timer = null) => {
      let time = '';
      if (timer) {
        time = (new Date()).getTime() - timer.getTime();
      }
      if (!txHash) {
        toFile(file, [action, attr, '', '', time]);
        return;
      }
      const tx = await web3.eth.getTransaction(txHash);
      const block = await web3.eth.getBlock(tx.blockNumber);
      toFile(file, [action, attr, web3Utils.toBN(tx.gas).toNumber(), web3Utils.toBN(block.gasUsed).toNumber(), time]);
    };
    const createOptFn = file => async(action, attr, txHash = 0, timer = null) => await addStat(file, action, attr, txHash, timer);
  
    const FILE_REGIONS = `./out/experiment-${REGIONS_ARTIFACT.toLowerCase()}-${precisions[REGIONS_ARTIFACT][PRECISION_INDEX]}-${ADD_MODE}.csv`;
    const FILE_REGIONS_INTERACT = `./out/experiment-${REGIONS_ARTIFACT.toLowerCase()}-${precisions[REGIONS_ARTIFACT][PRECISION_INDEX]}-interact.csv`;
    const FILE_REGIONS_DEVICES = `./out/experiment-${REGIONS_ARTIFACT.toLowerCase()}-${precisions[REGIONS_ARTIFACT][PRECISION_INDEX]}-devices.csv`;
    const FILE_BULK_DEVICES = `./out/experiment-${REGIONS_ARTIFACT.toLowerCase()}-${precisions[REGIONS_ARTIFACT][PRECISION_INDEX]}-bulkdevices.csv`;
    const FILE_REPUTATIONS = `./out/experiment-${REGIONS_ARTIFACT.toLowerCase()}-${precisions[REGIONS_ARTIFACT][PRECISION_INDEX]}-reputations.csv`;
  
    toFile(FILE_REGIONS, headers, fs.writeFileSync);
    toFile(FILE_REGIONS_INTERACT, headers, fs.writeFileSync);
    toFile(FILE_REGIONS_DEVICES, headers, fs.writeFileSync);
    toFile(FILE_BULK_DEVICES, headers, fs.writeFileSync);
    toFile(FILE_REPUTATIONS, headers, fs.writeFileSync);
  
    const inputData = require('./experiments/read-input-data')();
    const regionsArtifactData = inputData[REGIONS_ARTIFACT];
  
    const regions = await Regions.deployed();
    const devices = await Devices.deployed();
    const reputationManagement = await ReputationManagement.deployed();

    await require('./experiments/regions-add')(createOptFn(FILE_REGIONS), regions, regionsArtifactData, PRECISION_INDEX, ADD_MODE);
    await require('./experiments/regions-interact')(createOptFn(FILE_REGIONS_INTERACT), regions, regionsArtifactData, inputData.regions, PRECISION_INDEX);
    await require('./experiments/regions-devices')(createOptFn(FILE_REGIONS_DEVICES), devices, regionsArtifactData, inputData.devices, accounts[1]);
    await require('./experiments/devices')(createOptFn(FILE_BULK_DEVICES), web3, devices, inputData.devices.subAccounts, regionsArtifactData.subLocations, regionsArtifactData.deviceMovements);
    await require('./experiments/reputations')(createOptFn(FILE_REPUTATIONS), reputationManagement, inputData.reputations, inputData.reputationQueries);
    callback();
  } catch (error) {
    console.error(error);
    callback(error);
  }
};
