const GeohashRegions = artifacts.require('GeohashRegions');

const fs = require('fs');
const base32 = require('geohash-tree/base32');

const readData = fs.readFileSync('./data/out/UJI.geohash')
  .toString()
  .split('\n')
  .map(geohash => Array.from(geohash).map(char => base32.toNumber(char)));

contract('GeohashRegions', async() => {
  it('should add correctly', async() => {
    const geohashRegions = GeohashRegions.deployed();
    await geohashRegions.registerAndAddSpaces(1, 'UJI', readData());
  });
});
