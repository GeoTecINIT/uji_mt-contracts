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
