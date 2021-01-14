const S2Regions = artifacts.require('S2Regions');

module.exports = async(callback) => {
  try {
    const s2regions = await S2Regions.deployed();

    const dm = require('./data/data-manager')();
    const metadata = dm.data.UJI;
    let data = dm.getS2Cells('UJI');

    if (parseInt((await s2regions.getRegionData(metadata.id))[0][0]) === 0) {
      console.log(`Adding id = ${metadata.id}, name = ${metadata.name}`);
      const result = await s2regions.register(metadata.id, Buffer.from(metadata.name), 0, 0);
      console.log(`ok ${result.tx}`);
    }

    console.log(`data.length = ${data.length}`);

    while (data.length) {
      const addData = data.splice(0, data.length > 128 ? 128 : data.length);
      console.log(`Adding ${JSON.stringify(addData.join(','))}`);
      await s2regions.addMyCells(metadata.id, addData);
    }

    console.log('FINISHED');
    callback();
  } catch (e) {
    callback(e);
  }
};
