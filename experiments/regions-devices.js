module.exports = async(outFn, devices, regionsArtifactData, devicesData, account) => {
  console.log('== Devices in Regions ==');

  console.log('Registering...');
  let timer = new Date();
  let result = await devices.registerDevice(regionsArtifactData.devicesLocation, devicesData.ipv4, devicesData.ipv6, devicesData.services, {from: account});
  await outFn('Devices.registerDevice', '', result.tx, timer);

  console.log('Update location (same region)...');
  timer = new Date();
  result = await devices.updateDeviceLocation(regionsArtifactData.devicesLocationUpdateSame, {from: account});
  await outFn('Devices.updateDeviceLocation', 'same', result.tx, timer);

  console.log('Update location (different region)...');
  timer = new Date();
  result = await devices.updateDeviceLocation(regionsArtifactData.devicesLocationUpdateDifferent, {from: account});
  await outFn('Devices.updateDeviceLocation', 'different', result.tx, timer);

  console.log('Update services...');
  timer = new Date();
  result = await devices.updateDeviceServices(devicesData.servicesUpdate, {from: account});
  await outFn('Devices.updateDeviceServices', '', result.tx, timer);

  console.log('Update IPs...');
  timer = new Date();
  result = await devices.updateDeviceIPs(devicesData.ipv4Update, devicesData.ipv6Update, {from: account});
  await outFn('Devices.updateDeviceIPs', '', result.tx, timer);
};
