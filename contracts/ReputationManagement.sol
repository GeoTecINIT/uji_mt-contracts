// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import './Devices.sol';

contract ReputationManagement {
  Devices private devicesContract;
  RegionsCells private regionsContract;

  struct Reputation {
    uint64 value; // 0x0 to 0xfffffffffffffffff
    uint timestamp;
    uint64[] records;
    uint[] timestamps;
  }

  struct DeviceReputation {
    Devices.Device device;
    uint64 reputation;
  }

  // RegionID => DeviceAddr => ServiceName => Reputation
  mapping(uint8 => mapping(address => mapping(uint32 => Reputation))) reputations;

  constructor(address devicesContractAddress) {
    devicesContract = Devices(devicesContractAddress);
    regionsContract = RegionsCells(devicesContract.getRegionsContractAddress());
  }

  function getReputationData(uint8 regionID, address deviceAddr, uint32 serviceName) public view returns (Reputation memory reputation) {
    return reputations[regionID][deviceAddr][serviceName];
  }

  function getReputationData(address deviceAddr, uint32 serviceName) public view returns (Reputation memory reputation) {
    uint8 regionID = regionsContract.query(devicesContract.getDeviceFromAddress(deviceAddr).location).id;
    return getReputationData(regionID, deviceAddr, serviceName);
  }

  function getReputationValue(uint8 regionID, address deviceAddr, uint32 serviceName) public view returns (uint64 reputationValue) {
    return getReputationData(regionID, deviceAddr, serviceName).value;
  }

  function getReputationValue(address deviceAddr, uint32 serviceName) public view returns (uint64 reputationValue) {
    return getReputationData(deviceAddr, serviceName).value;
  }

  function getInRegionWithService(uint8 regionID, uint32 service) public view returns (DeviceReputation[] memory devicesList) {
    Devices.Device[] memory devices = devicesContract.getDevicesInRegionWithService(regionID, service);
    DeviceReputation[] memory results = new DeviceReputation[](devices.length);
    for (uint i = 0; i < devices.length; i++) {
      results[i].device = devices[i];
      results[i].reputation = getReputationValue(regionID, devices[i].addr, service);
    }
    return results;
  }

  function getInSameRegionWithService(uint64 location, uint32 service) public view returns (DeviceReputation[] memory devicesList) {
    Regions.RegionMetadata memory region = regionsContract.query(location);
    if (region.id == 0) {
      return new DeviceReputation[](0);
    }
    return getInRegionWithService(region.id, service);
  }

  function updateReputation(uint8 regionID, address deviceAddr, uint32 serviceName, uint64 reputationValue) public {
    Regions.RegionMetadata memory regionMetadata = regionsContract.getRegionData(regionID).metadata;
    require(regionMetadata.registrar == msg.sender);

    Reputation memory reputation = getReputationData(regionID, deviceAddr, serviceName);
    reputation = addRecord(reputation, reputationValue, block.timestamp);
    reputation.value = reputationValue;
    reputation.timestamp = block.timestamp;
    reputations[regionID][deviceAddr][serviceName] = reputation;
  }

  function addRecord(Reputation memory reputation, uint64 data, uint timestamp) private pure returns (Reputation memory) {
    uint newLength = reputation.records.length + 1;
    uint64[] memory newRecords = new uint64[](newLength);
    uint[] memory newTimestamps = new uint[](newLength);
    for (uint i = 0; i < reputation.records.length; i++) {
      newRecords[i] = reputation.records[i];
      newTimestamps[i] = reputation.timestamps[i];
    }
    newRecords[newLength - 1] = data;
    newTimestamps[newLength - 1] = timestamp;
    reputation.records = newRecords;
    reputation.timestamps = newTimestamps;
    return reputation;
  }
}
