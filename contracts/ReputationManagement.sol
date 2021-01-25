// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import './Regions.sol';
import './Devices.sol';

contract ReputationManagement {
  Devices private devicesContract;
  Regions private regionsContract;

  struct Reputation {
    uint16 value; // 0 to 65535
    int length;   // number of feedbacks
  }

  // DeviceAddr => RegionID => Reputation
  mapping(address => mapping(uint8 => Reputation)) private reputations;

  constructor(address devicesContractAddress) {
    devicesContract = Devices(devicesContractAddress);
    regionsContract = Regions(devicesContract.getRegionsContractAddress());
  }

  function getReputation(address deviceAddr, uint8 regionID) public view returns (uint16 reputationValue) {
    return reputations[deviceAddr][regionID].value;
  }

  function getReputation(address deviceAddr) public view returns (uint16 reptuationValue) {
    uint8 regionID = regionsContract.query(devicesContract.getDeviceFromAddress(deviceAddr).location).id;
    return getReputation(deviceAddr, regionID);
  }

  function addFeedback(address deviceAddr, uint16 feedback) public {
    uint8 regionID = regionsContract.query(devicesContract.getDeviceFromAddress(deviceAddr).location).id;
    require(regionID > 0);
    Regions.RegionMetadata memory regionMetadata = regionsContract.getRegionData(regionID).metadata;
    require(regionMetadata.registrar == msg.sender);
    Reputation memory reputation = reputations[deviceAddr][regionID];
    reputation.value = uint16(
      (
        (uint256(reputation.value) * uint256(reputation.length))
        + feedback
      ) / uint256(++reputation.length)
    ); // ((rep * n) + f) / (n + 1) => instantly get new average value

    reputations[deviceAddr][regionID] = reputation;
  }
}
