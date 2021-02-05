const S2Regions = artifacts.require('S2Regions');
const Devices = artifacts.require('Devices');
// const ReputationManagement = artifacts.require('ReputationManagement');

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
    const regions = await S2Regions.deployed();
    const devices = await Devices.deployed();
    // const repMan = await ReputationManagement.deployed();
    const accounts = await web3.eth.getAccounts();
    p2('OK');

    // const keys = dataManager.listKeys();
    const keys = ['UJI', 'GRU'];
    for (let k = 0; k < keys.length; k++) {
      const code = keys[k];
      const metadata = dataManager.getObject(code);
      p1(`Adding region ${code}...`);

      const region = await regions.getRegionData(metadata.id);

      if (parseInt(region['metadata']['id']) === 0) {
        p1('Register...');
        await regions.registerRegion(metadata.id, Buffer.from(metadata.name), 0, 0, { from: accounts[k % 3] });
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
          await regions.addTree(
            metadata.id,
            chunk.map(x => x.toString()),
            { from: accounts[k % 3] }
          );
          p1('OK. ');
        } catch (error) {
          p1(`FAIL (${formatError(error)}). `);
          failed.push(`regiosn.addTree(${metadata.id}, ${JSON.stringify(chunk.map(x => x.toString()))}, { from: '${accounts[k % 3]}' }). `);
        }
      }

      p2('');
    }

    p2('');

    const printDeviceRegion = async() => {
      p1('Get device region...');
      try {
        const device = await devices.getDeviceFromAddress(accounts[5]);
        const region = await regions.query(device['location']);
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
          const devicesInRegion = await devices.getDevicesInRegion(metadata.id);
          p2(devicesInRegion.map(device => '  ' + device['addr']).join('\n'));
        }
      } catch (error) {
        p2(`  FAIL (${formatError(error)})`);
      }
    };

    const registerDevice = async(addr, location) => {
      p1(`Registering device ${addr}...`);
      try {
        const device = await devices.getDeviceFromAddress(addr);
        if (!device['active']) {
          await devices.registerDevice(location, 0, 0, [], {from: addr});
          p2('OK');
        } else {
          p2('SKIPPED');
        }
      } catch (error) {
        p1(`FAIL (${formatError(error)})`);
        failed.push(`devices.registerDevice('${location}', 0, 0, [], {from: '${addr}'})`);
      }
    };

    await registerDevice(accounts[5], toLocation('0d5ffe0c5e'));
    await registerDevice(accounts[6], toLocation('0d6000d89ef'));

    p2('Device addresses...');
    const addresses = await devices.getDeviceAddresses();
    p2(addresses.map(a => '  ' + a).join('\n'));

    await printDeviceRegion();
    p2('');
    await printDevicesInRegions();
    p2('');
    
    p1('Moving device...');
    try {
      await devices.updateDeviceLocation(toLocation('12a000f71a8f'), {from: accounts[5]});
      p2('OK');
    } catch (error) {
      p2(`FAIL (${formatError(error)})`);
      failed.push(`updateDeviceLocation('${toLocation('12a000f71a8f')}', {from: '${accounts[5]}'})`);
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
