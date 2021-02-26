/**
 * Create geohash cells and trees from `regions.geojson` and write data files from the data.
 * Change variable `PRECISION` for desired geohash level.
 */
const fs = require('fs');
const geohashPoly = require('geohash-poly');
const compressGeohash = require('geohash-compression');
const geohashTree = require('geohash-tree');

const PRECISION = 8;

const geometryToGeohash = (geometry, precision) => new Promise((resolve, reject) => {
  geohashPoly({coords: geometry.coordinates, precision: precision}, (err, hashes) => {
    if (err) {
      reject(err);
      return;
    }
    resolve(hashes);
  });
});

if (!fs.existsSync(`./data/out-geohash-${PRECISION}`)) {
  fs.mkdirSync(`./data/out-geohash-${PRECISION}`);
}

const geojson = JSON.parse(fs.readFileSync('./data/regions.geojson'));

geojson.features.forEach(async(feature) => {
  const code = feature.properties.code;
  console.log(`Converting ${code}...`);

  const geohashes = compressGeohash(await geometryToGeohash(feature.geometry, PRECISION));

  fs.writeFileSync(`./data/out-geohash-${PRECISION}/${code}.geohash`, geohashes.join('\n'));
  fs.writeFileSync(`./data/out-geohash-${PRECISION}/${code}.geohash-tree`, geohashTree.encodeBinary(geohashes, 'buffer'));
});

console.log('FINISHED');
