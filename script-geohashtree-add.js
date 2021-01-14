const GeohashRegions = artifacts.require('GeohashRegions');
const geohashTree = require('geohash-tree');

module.exports = async(callback) => {
  try {
    const geohashRegions = await GeohashRegions.deployed();

    const dm = require('./data/data-manager')();
    const metadata = dm.data.UJI;
    let data = dm.getGeohashTree('UJI');

    if (parseInt((await geohashRegions.getRegionData(metadata.id))[0][0]) === 0) {
      console.log(`Adding id = ${metadata.id}, name = ${metadata.name}`);
      const result = await geohashRegions.register(metadata.id, Buffer.from(metadata.name), 0, 0);
      console.log(`ok ${result.tx}`);
    }

    console.log(`data.length = ${data.length}`);
    
    const chunks = geohashTree.chunkbinary(data, 128).map(chunk => chunk.map(x => x.toString()));
    for (let i = 0; i < chunks.length; i++) {
      try {
        const chunk = chunks[i];
        console.log(`Adding chunk size ${chunk.length} (${chunk.join(' ')})`);
        const result = await geohashRegions.addMyTree(metadata.id, chunk);
        console.log(`ok ${result.tx}`);
      } catch (err) {
        console.log(`ERROR = ${err}`);
      }
    }

    console.log('FINISHED');
    callback();
  } catch (e) {
    console.log(`ERROR = ${e}`);
    callback(e);
  }
};
