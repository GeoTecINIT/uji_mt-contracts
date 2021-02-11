const web3Utils = require('web3-utils');

module.exports = async(outFn, web3, devices, accounts, locations, movements) => {
  const distributorAccount = (await web3.eth.getAccounts())[9];

  console.log(`== Devices Bulk ==`);
  console.log(`Total: ${accounts.length}`);
  for (let i = 0; i < accounts.length; i++) {
    console.log(`  ${i + 1} from ${accounts.length}...`);

    await web3.eth.personal.importRawKey(accounts[i].priv, '0');
    await web3.eth.personal.unlockAccount(accounts[i].address, '0', 86400);
    await web3.eth.sendTransaction({
      from: distributorAccount,
      to: accounts[i].address,
      value: web3Utils.toWei('0.45', 'ether')
    });

    const timer = new Date();
    const result = await devices.registerDevice(locations[i], 0, 0, [1, 2], {from: accounts[i].address});
    outFn('devices.registerDevice', '', result.tx, timer);
  }

  console.log(`== Devices Move ==`);
  console.log(`Total: ${movements.length}`);
  for (let i = 0; i < movements.length; i++) {
    console.log(`  ${i + 1} from ${movements.length}`);

    const timer = new Date();
    const result = await devices.updateDeviceLocation(movements[i].newLocation, {from: movements[i].device.address});
    outFn('devices.updateDeviceLocation', '', result.tx, timer);
  }
};
