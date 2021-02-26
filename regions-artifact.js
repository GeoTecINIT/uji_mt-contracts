/**
 * Return geocoding technique name used in the current network, eiter geohash or S2.
 * If not defined it will use the one defined in `defaultRegions` variable.
 */
const truffleConfig = require('./truffle-config');

const defaultRegions = 'S2Regions';

module.exports = networkName => {
  if (networkName) {
    const networkConfig = truffleConfig[networkName];
    if (networkConfig && networkConfig.regionsArtifact) {
      return networkConfig.regionsArtifact;
    }
  }
  return defaultRegions;
};
