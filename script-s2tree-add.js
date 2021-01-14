const S2Regions = artifacts.require('S2Regions');
const s2base64tree = require('s2base64tree');

module.exports = async(callback) => {
  try {
    const s2Regions = await S2Regions.deployed();

    const dm = require('./data/data-manager')();
    const metadata = dm.data.GRU;
    let data = dm.getS2Base64Tree('GRU');

    if (parseInt((await s2Regions.getRegionData(metadata.id))[0][0]) === 0) {
      console.log(`Adding id = ${metadata.id}, name = ${metadata.name}`);
      const result = await s2Regions.register(metadata.id, Buffer.from(metadata.name), 0, 0);
      console.log(`ok ${result.tx}`);
    }

    console.log(`data.length = ${data.length}`);
    
    const chunks = s2base64tree.chunk(data, 128).map(chunk => chunk.map(x => x.toString()));
    for (let i = 0; i < chunks.length; i++) {
      try {
        const chunk = chunks[i];
        console.log(`Adding chunk size ${chunk.length} (${chunk.join(' ')})`);
        const result = await s2Regions.addMyTree(metadata.id, chunk);
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
