// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import './Regions.sol';
import './Utils.sol';

contract Devices {
  Regions public regionsContract;
  
  struct Device {
    address addr;
    uint32[] services;  // 4 * 8-bit-character
    uint lastUpdatedEpoch;
    uint64 location;
    uint32 ipv4;
    uint128 ipv6;
    uint8 regionID;
    bool active;
  }

  mapping(address => Device) internal devices;
  address[] internal deviceAddresses;

  // RegionID => DeviceAddr
  mapping(uint8 => address[]) private devicesInRegions;

  constructor(address regionsContractAddress) {
    regionsContract = Regions(regionsContractAddress);
  }

  function getDeviceFromAddress(address addr) public view returns (Device memory device) {
    return devices[addr];
  }

  function getDeviceAddresses() public view returns (address[] memory) {
    return deviceAddresses;
  }

  function getDevicesInRegion(uint8 regionID) public view returns (Devices.Device[] memory devicesList) {
    return getDevicesFromAddresses(devicesInRegions[regionID]);
  }

  function getDevicesInRegionWithService(uint8 regionID, uint32 service) public view returns (Devices.Device[] memory devicesList) {
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

  function getDevicesInSameRegionWithService(uint64 location, uint32 service) public view returns (Devices.Device[] memory devicesList) {
    Regions.Region memory region = regionsContract.query(location);
    if (region.id == 0) {
      return new Device[](0);
    }

    return getDevicesInRegionWithService(region.id, service);
  }

  function updateRegionDevicesArrays(address addr, uint8 oldRegionID, uint8 newRegionID) private {
    devicesInRegions[oldRegionID] = Utils.deleteFromAddressArray(devicesInRegions[oldRegionID], addr);
    devicesInRegions[newRegionID] = Utils.pushUniqueToAddressArray(devicesInRegions[newRegionID], addr);
  }

  function deleteDeviceRegion(address addr) private {
    uint8 regionID = regionsContract.query(getDeviceFromAddress(addr).location).id;
    if (regionID > 0) {
      devicesInRegions[regionID] = Utils.deleteFromAddressArray(devicesInRegions[regionID], addr);
    }
  }

  function registerDevice(uint64 location, uint32 ipv4, uint128 ipv6, uint32[] memory services) public {
    Device memory device = devices[msg.sender];
    require(!device.active);

    devices[msg.sender] = Device({
      addr: msg.sender,
      services: services,
      lastUpdatedEpoch: block.timestamp,
      location: 0,
      ipv4: ipv4,
      ipv6: ipv6,
      regionID: 0,
      active: true
    });
    deviceAddresses = Utils.pushUniqueToAddressArray(deviceAddresses, msg.sender);

    updateDeviceLocation(location);
  }

  function updateDeviceLocation(uint64 newLocation) public {
    Device memory device = devices[msg.sender];
    require(device.active);
    
    if (device.location == newLocation) {
      return;
    }

    uint8 currentRegionID = regionsContract.query(device.location).id;
    uint8 newRegionID = regionsContract.query(newLocation).id;
    
    device.location = newLocation;
    device.lastUpdatedEpoch = block.timestamp;
    
    if (currentRegionID != newRegionID) {
      device.regionID = newRegionID;
      updateRegionDevicesArrays(msg.sender, currentRegionID, newRegionID);
    }

    devices[msg.sender] = device;
  }

  function updateDeviceServices(uint32[] memory services) public {
    Device memory device = devices[msg.sender];
    require(device.active);
    device.services = services;
    device.lastUpdatedEpoch = block.timestamp;
    devices[msg.sender] = device;
  }

  function updateDeviceIPs(uint32 ipv4, uint128 ipv6) public {
    Device memory device = devices[msg.sender];
    require(device.active);
    device.ipv4 = ipv4;
    device.ipv6 = ipv6;
    device.lastUpdatedEpoch = block.timestamp;
    devices[msg.sender] = device;
  }

  function deactivateDevice() public {
    deleteDeviceRegion(msg.sender);
    devices[msg.sender].active = false;

    deviceAddresses = Utils.deleteFromAddressArray(deviceAddresses, msg.sender);
  }

  function getDevicesFromAddresses(address[] memory addresses) public view returns (Device[] memory devicesList) {
    Device[] memory results = new Device[](addresses.length);
    for (uint i = 0; i < addresses.length; i++) {
      results[i] = devices[addresses[i]];
    }
    return results;
  }

  function hasService(uint32[] memory services, uint32 wantedService) public pure returns (bool) {
    for (uint i = 0; i < services.length; i++) {
      if (services[i] == wantedService) {
        return true;
      }
    }
    return false;
  }

  function cutDevicesArray(Devices.Device[] memory devicesList, uint wantedSize) public pure returns (Devices.Device[] memory results) {
    require(wantedSize <= devicesList.length);
    results = new Devices.Device[](wantedSize);
    for (uint i = 0; i < wantedSize; i++) {
      results[i] = devicesList[i];
    }
    return results;
  }

  function getRegionsContractAddress() public view returns (address) {
    return address(regionsContract);
  }
}
