// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import './Utils.sol';
import './S2Regions.sol';
import './Devices.sol';

contract ReputationManagement is S2Regions, Devices {
  struct Reputation {
    uint16 value; // 0 to 65535
    int length;   // number of feedbacks
  }

  // DeviceAddr => RegionID => Reputation
  mapping(address => mapping(uint8 => Reputation)) private reputations;

  // RegionID => DeviceAddr
  mapping(uint8 => address[]) private devicesInRegions;

  function getDevicesInRegion(uint8 regionID) public view returns (Device[] memory devicesList) {
    return getDevicesFromAddresses(devicesInRegions[regionID]);
  }

  function getDevicesInRegionWithService(uint8 regionID, uint32 service) public view returns (Device[] memory devicesList) {
    Device[] memory allDevices = getDevicesInRegion(regionID);
    Device[] memory resultsTemp = new Device[](allDevices.length);
    uint idx = 0;
    for (uint i = 0; i < allDevices.length; i++) {
      if (hasService(allDevices[i].services, service)) {
        resultsTemp[idx++] = allDevices[i];
      }
    }
    return cutDevicesArray(resultsTemp, idx);
  }

  function getDevicesInSameRegionWithService(uint64 location, uint32 service) public view returns (Device[] memory devicesList) {
    RegionMetadata memory region = query(location);
    if (region.id == 0) {
      return new Device[](0);
    }

    return getDevicesInRegionWithService(region.id, service);
  }

  function getReputation(address deviceAddr, uint8 regionID) public view returns (uint16 reputationValue) {
    return reputations[deviceAddr][regionID].value;
  }

  function addFeedback(address deviceAddr, uint16 feedback) public {
    uint8 regionID = query(devices[deviceAddr].location).id;
    require(regionID > 0);
    Reputation memory reputation = reputations[deviceAddr][regionID];
    reputation.value = uint16(
      (
        (uint256(reputation.value) * uint256(reputation.length))
        + feedback
      ) / uint256(++reputation.length)
    ); // ((rep * n) + f) / (n + 1) => instantly get new average value

    reputations[deviceAddr][regionID] = reputation;
  }

  function updateDeviceRegion(address addr, uint8 oldRegionID, uint8 newRegionID) private {
    devicesInRegions[oldRegionID] = Utils.deleteFromAddressArray(devicesInRegions[oldRegionID], addr);
    devicesInRegions[newRegionID] = Utils.pushUniqueToAddressArray(devicesInRegions[newRegionID], addr);
  }

  function deleteDeviceRegion(address addr) private {
    uint8 regionID = query(devices[addr].location).id;
    if (regionID > 0) {
      devicesInRegions[regionID] = Utils.deleteFromAddressArray(devicesInRegions[regionID], addr);
    }
  }

  function updateDeviceLocation(address addr, uint64 newLocation) internal override {
    uint64 currentLocation = devices[addr].location;
    if (currentLocation == newLocation) {
      return;
    }

    uint8 currentRegionID = query(currentLocation).id;
    uint8 newRegionID = query(newLocation).id;
    
    if (currentRegionID != newRegionID) {
      updateDeviceRegion(addr, currentRegionID, newRegionID);
    }

    super.updateDeviceLocation(addr, newLocation);
  }

  function updateMyDeviceLocation(uint64 newLocation) public override {
    updateDeviceLocation(msg.sender, newLocation);
  }

  function registerMyDevice(uint64 location, uint32 ipv4, uint256 ipv6, uint32[] memory services) public override {
    registerDevice(msg.sender, location, ipv4, ipv6, services);
    updateMyDeviceLocation(location);
  }

  function deactivateDevice(address addr) internal override {
    deleteDeviceRegion(addr);
    super.deactivateDevice(addr);
  }

  function deactivateMyDevice() public override {
    deactivateDevice(msg.sender);
  }

  function cutDevicesArray(Device[] memory devicesList, uint wantedSize) public pure returns (Device[] memory results) {
    require(wantedSize <= devicesList.length);
    results = new Device[](wantedSize);
    for (uint i = 0; i < wantedSize; i++) {
      results[i] = devicesList[i];
    }
    return results;
  }
}
