const fs = require('fs');

const ReputationManagement = artifacts.require('ReputationManagement');

module.exports = async(callback) => {
  try {
    const reputationManagement = await ReputationManagement.deployed();
    const genesis = JSON.parse(fs.readFileSync('./network/genesis.json'));
    const accounts = await web3.eth.getAccounts();

    const config = {
      contracts: {
        ReputationManagement: {
          address: reputationManagement.address, 
          abi: reputationManagement.abi
        }
      }, blockchainNetwork: {
        config: {
          host: '127.0.0.1',
          port: 18541,
          network_id: 2564,
          address: accounts[0]
        },
        genesis: genesis
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
