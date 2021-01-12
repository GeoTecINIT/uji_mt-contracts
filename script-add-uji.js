const GeohashRegions = artifacts.require('GeohashRegions');

module.exports = async(callback) => {
  try {
    const geohashRegion = await GeohashRegions.deployed();

    const dm = require('./data/data-manager')();
    const metadata = dm.data.UJI;
    let data = dm.getGeohash('UJI');

    console.log(`Adding id = ${metadata.id}, name = ${metadata.name}`);
    await geohashRegion.register(metadata.id, Buffer.from(metadata.name));

    console.log(`data.length = ${data.length}`);
    console.log(`Data = ${JSON.stringify(data)}`);

    while (data.length) {
      const addData = data.splice(0, data.length > 96 ? 96 : data.length);
      console.log(`Adding ${JSON.stringify(addData.join(','))}`);
      await geohashRegion.addMySpaces(metadata.id, addData);
    }

    console.log('FINISHED');
    callback();
  } catch (e) {
    callback(e);
  }
};
