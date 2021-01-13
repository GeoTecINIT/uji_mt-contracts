const fs = require('fs');
const geohashPoly = require('geohash-poly');
const compressGeohash = require('geohash-compression');
const geohashTree = require('geohash-tree');

const PRECISION = 6;

const geometryToGeohash = (geometry, precision) => new Promise((resolve, reject) => {
  geohashPoly({coords: geometry.coordinates, precision: precision}, (err, hashes) => {
    if (err) {
      reject(err);
      return;
    }
    resolve(hashes);
  });
});

if (!fs.existsSync('./data/out')) {
  fs.mkdirSync('./data/out');
}

const geojson = JSON.parse(fs.readFileSync('./data/regions.geojson'));

geojson.features.forEach(async(feature) => {
  const code = feature.properties.code;
  console.log(`Converting ${code}...`);

  const geohashes = compressGeohash(await geometryToGeohash(feature.geometry, PRECISION));

  fs.writeFileSync(`./data/out/${code}.geohash`, geohashes.join('\n'));
  fs.writeFileSync(`./data/out/${code}.geohash-tree`, geohashTree.encodeBinary(geohashes, 'buffer'));
});

console.log('FINISHED');
