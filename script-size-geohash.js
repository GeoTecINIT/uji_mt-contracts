const GeohashRegions = artifacts.require('GeohashRegions');

module.exports = async(callback) => {
  try {
    const dm = require('./data/data-manager')();
    const metadata = dm.data.UJI;
    const data = dm.getGeohash('UJI');

    console.log(`data.length = ${data.length}`);

    const geohashRegion = await GeohashRegions.deployed();
    console.log(`Adding ${JSON.stringify(data)}`);

    let currentLength = 256;
    while (currentLength > 0) {
      if (currentLength - 16 > data.length) {
        currentLength -= 16;
        continue;
      }

      console.log(`Trying length = ${currentLength}`);
      const subData = data.slice(0, currentLength);
      try {
        await geohashRegion.registerAndAddSpaces(metadata.id, Buffer.from(metadata.name), subData);
        break;
      } catch (e) {
        console.log(`Error: ${e}`);
      }

      currentLength -= 16;
    }

    console.log(`Recommended length = ${currentLength}`);

    console.log('FINISHED');
    callback();
  } catch (e) {
    callback(e);
  }
};
