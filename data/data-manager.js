const fs = require('fs');
const base32 = require('geohash-tree/base32');

module.exports = () => {
  const results = {
    data: {},
    listKeys: function() {
      return Object.keys(this.data);
    },
    getObject: function(code) {
      return this.data[code];
    },
    getGeohash: function(code) {
      return fs.readFileSync(this.data[code].geohashPath)
        .toString()
        .split('\n')
        .filter(x => x !== '')
        .map(geohash => Array.from(geohash)
          .map(char => base32.toNumber(char).toString(2).padStart(5, '0'))
          .join('')
          .padEnd(64, '0')
        ).map(binary => '0x' + parseInt(binary, 2).toString(16))
    },
    getGeohashTree: function(code) {
      return fs.readFileSync(this.data[code].geohashTreePath);
    },
    getS2Cells: function(code) {
      return fs.readFileSync(this.data[code].s2CellsPath)
        .toString()
        .split('\n')
        .filter(x => x)
        .map(s2hex => Array.from(s2hex)
          .map(hex => parseInt(hex, 16).toString(2).padStart(4, '0'))
          .join('')
          .padEnd(64, '0')
        ).map(binary => '0x' + parseInt(binary, 2).toString(16))
    },
    getS2Base64Tree: function(code) {
      return fs.readFileSync(this.data[code].s2Base64TreePath);
    }
  };

  const featureCollection = JSON.parse(fs.readFileSync('./data/regions.geojson'));
  featureCollection.features.forEach((feature, i) => {
    const id = i + 1;
    const code = feature.properties.code;
    const name = feature.properties.name;
    results.data[code] = {
      id: id, 
      code: code,
      name: name,
      geohashPath: `./data/out/${code}.geohash`,
      geohashTreePath: `./data/out/${code}.geohash-tree`,
      s2CellsPath: `./data/out/${code}.s2cells`,
      s2Base64TreePath: `./data/out/${code}.s2cells-base64tree`
    };
  });

  return results;
};
