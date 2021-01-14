const ReputationManagement = artifacts.require('ReputationManagement');

const { timeStamp } = require('console');
const { format } = require('path');
const { stdout } = require('process');
const { chunk } = require('s2base64tree');

const dataManager = require('./data/data-manager')();

const p1 = str => stdout.write(str);
const p2 = str => console.log(str);
const formatError = msg => msg.toString().split('\n').join(' ');

const toLocation = x => '0x' + (x.toString().padEnd(16, '0'));

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

      const region = await repMan.getRegionData(metadata.id);

      if (parseInt(region['metadata']['id']) === 0) {
        p1('Register...');
        await repMan.registerRegion(metadata.id, Buffer.from(metadata.name), 0, 0, { from: accounts[k % 3] });
        p1('OK. ');
      } else if (region['cellIDs'].length === dataManager.getS2Cells(metadata.code).length) {
        p2('SKIPPED');
        continue;
      }

      const chunks = chunk(dataManager.getS2Base64Tree(metadata.code), 128);
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

    const printDeviceRegion = async() => {
      p1('Get device region...');
      try {
        const device = await repMan.getDeviceFromAddress(accounts[5]);
        const region = await repMan.query(device['location']);
        if (!parseInt(region['id'])) {
          p2('N/A');
        } else {
          p2(web3.utils.toUtf8(region['name']));
        }
      } catch (error) {
        p2(`FAIL (${formatError(error)})`);
      }
    };
    
    const printDevicesInRegions = async() => {
      try {
        for (let k = 0; k < keys.length; k++) {
          const metadata = dataManager.getObject(keys[k]);
          p2(`Get devices in ${metadata.code}...`);
          const devices = await repMan.getDevicesInRegion(metadata.id);
          p2(devices.map(device => '  ' + device['addr']).join('\n'));
        }
      } catch (error) {
        p2(`  FAIL (${formatError(error)})`);
      }
    };

    const registerDevice = async(addr, location) => {
      p1(`Registering device ${addr}...`);
      try {
        const device = await repMan.getDeviceFromAddress(addr);
        if (!device['active']) {
          await repMan.registerMyDevice(location, 0, 0, [], {from: addr});
          p2('OK');
        } else {
          p2('SKIPPED');
        }
      } catch (error) {
        p1(`FAIL (${formatError(error)})`);
        failed.push(`registerMyDevice('${location}', 0, 0, [], {from: '${addr}'})`);
      }
    };

    await registerDevice(accounts[5], toLocation('0d5ffe0c'));
    await registerDevice(accounts[6], toLocation('0d6000d89ef'));

    await printDeviceRegion();
    p2('');
    await printDevicesInRegions();
    p2('');
    
    p1('Moving device...');
    try {
      await repMan.updateMyDeviceLocation(toLocation('12a000f71a'), {from: accounts[5]});
      p2('OK');
    } catch (error) {
      p2(`FAIL (${formatError(error)})`);
      failed.push(`updateMyDeviceLocation('${toLocation('12a000f71a')}', {from: '${accounts[5]}'})`);
    }
    
    await printDeviceRegion();
    p2('');
    await printDevicesInRegions();
    p2('');

    p2('');

    if (failed.length) {
      p2('FAILED TRANSACTIONS');
      p2(failed.map(x => '  ' + x).join('\n'));
    }

    callback();
  } catch (error) {
    console.error(error);
    callback(error);
  }
};
