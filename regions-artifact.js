const truffleConfig = require('./truffle-config');

const defaultRegions = 'S2Regions';

module.exports = networkName => {
  const networkConfig = truffleConfig[networkName];
  if (networkConfig && networkConfig.regionsArtifact) {
    return artifacts.require(networkConfig.regionsArtifact);
  }
  return artifacts.require(defaultRegions);
};
