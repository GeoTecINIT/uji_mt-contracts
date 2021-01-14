const ReputationManagement = artifacts.require('ReputationManagement');

const { stdout } = require('process');
const { chunk } = require('s2base64tree');

const dataManager = require('./data/data-manager')();

const p1 = str => stdout.write(str);
const p2 = str => console.log(str);
const formatError = msg => msg.toString().split('\n').join(' ');

module.exports = async(callback) => {
  try {
    const failed = [];

    p1('Preparing contract...');
    const repMan = await ReputationManagement.deployed();
    const accounts = await web3.eth.getAccounts();
    p2('OK');

    const keys = dataManager.listKeys();
    for (let k = 0; k < keys.length; k++) {
      const code = keys[k];
      const metadata = dataManager.getObject(code);
      p1(`Adding region ${code}...`);

      const id = parseInt((await repMan.getRegionData(metadata.id))[0][0]);
      p1(`${id}. `)

      if (id === 0) {
        p1('Register...');
        await repMan.registerRegion(
          metadata.id,
          Buffer.from(metadata.name),
          0,
          0,
          { from: accounts[k % 3] }
        );
        p1('OK. ');
      }

      const chunks = chunk(dataManager.getS2Base64Tree(code), 128);
      for (let c = 0; c < chunks.length; c++) {
        const chunk = chunks[c];
        p1(`[${c + 1}/${chunks.length}]...`);
        try {
          await repMan.addMyTree(
            metadata.id,
            chunk.map(x => x.toString()),
            { from: accounts[k % 3] }
          );
          p1('OK. ');
        } catch (error) {
          p1(`FAIL (${formatError(error)}). `);
          failed.push(`addMyTree(${metadata.id}, ${JSON.stringify(chunk.map(x => x.toString()))}, { from: '${accounts[k % 3]}' }). `);
        }
      }

      p2('');
    }

    p2('');

    p2(failed.join('\n'));

    callback();
  } catch (error) {
    console.error(error);
    callback(error);
  }
};
