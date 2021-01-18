// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

abstract contract Devices {
  struct Device {
    address addr;
    uint32[] services;  // 4 * 8-bit-character
    uint lastUpdatedEpoch;
    uint64 location;
    uint32 ipv4;
    uint128 ipv6;
    bool active;
  }

  mapping(address => Device) internal devices;
  address[] internal deviceAddresses;

  function getDeviceFromAddress(address addr) public view returns (Device memory device) {
    return devices[addr];
  }

  function registerDevice(address addr, uint64 location, uint32 ipv4, uint128 ipv6, uint32[] memory services) virtual internal {
    Device memory device = devices[addr];
    require(!device.active);

    device.addr = addr;
    device.services = services;
    device.lastUpdatedEpoch = block.timestamp;
    device.location = location;
    device.ipv4 = ipv4;
    device.ipv6 = ipv6;
    device.active = true;

    devices[addr] = device;
    deviceAddresses.push(addr);
  }

  function updateDeviceLocation(address addr, uint64 location) virtual internal {
    Device memory device = devices[addr];
    require(device.active);
    device.location = location;
    device.lastUpdatedEpoch = block.timestamp;
    devices[addr] = device;
  }

  function updateDeviceServices(address addr, uint32[] memory services) virtual internal {
    Device memory device = devices[addr];
    require(device.active);
    device.services = services;
    device.lastUpdatedEpoch = block.timestamp;
    devices[addr] = device;
  }

  function updateDevicesIPs(address addr, uint32 ipv4, uint128 ipv6) virtual internal {
    Device memory device = devices[addr];
    require(device.active);
    device.ipv4 = ipv4;
    device.ipv6 = ipv6;
    device.lastUpdatedEpoch = block.timestamp;
    devices[addr] = device;
  }

  function deactivateDevice(address addr) virtual internal {
    devices[addr].active = false;
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
}
