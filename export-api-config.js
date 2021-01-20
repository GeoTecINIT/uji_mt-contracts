const fs = require('fs');

const S2Regions = artifacts.require('S2Regions');
const Devices = artifacts.require('Devices');
const ReputationManagement = artifacts.require('ReputationManagement');

module.exports = async(callback) => {
  try {
    const regions = await S2Regions.deployed();
    const devices = await Devices.deployed();
    const reputationManagement = await ReputationManagement.deployed();
    const genesis = JSON.parse(fs.readFileSync('./network/genesis.json'));
    const accounts = await web3.eth.getAccounts();

    const config = {
      contracts: {
        Regions: {
          address: regions.address, 
          abi: regions.abi
        },
        Devices: {
          address: devices.address, 
          abi: devices.abi
        },
        ReputationManagement: {
          address: reputationManagement.address, 
          abi: reputationManagement.abi
        }
      }, blockchainNetwork: {
        config: {
          host: '127.0.0.1',
          port: 8545,
          network_id: 2564,
          address: accounts[0]
        },
        genesis: genesis
      }, api: {
        port: 80
      }, host: {
        networkInterface: ''
      }
    };
    
    if (!fs.existsSync('./out')) {
      fs.mkdirSync('./out');
    }

    fs.writeFileSync('./out/api-config.json', JSON.stringify(config));

    console.log('FINISHED');

    callback();
  } catch (error) {
    console.log(error);
    callback(error);
  }
};
