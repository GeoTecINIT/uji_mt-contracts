// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import './Utils.sol';

abstract contract Regions {

  struct Region {
    uint8 id;
    address registrar;
    bytes name;
    uint32 ipv4;
    uint128 ipv6;
    uint lastUpdatedEpoch;
  }

  mapping(uint8 => Region) internal regions;
  uint8[] internal ids;
  
  constructor() {}

  function getRegionIDFromExactCellID(uint64 cellID) public virtual view returns (uint8 regionID);
  function addRegionCells(uint8 id, uint64[] memory cellIDs) public virtual returns (uint addedCount, uint failedCount);
  function clearFailedCells(uint8 id) public virtual;
  function removeRegionCells(uint8 id, uint64[] memory cellIDs) public virtual;
  function registerRegionAndAddCells(uint8 id, bytes memory name, uint64[] memory cellIDs, uint32 ipv4, uint128 ipv6) public virtual returns (uint addedCount, uint failedCount);
  function updateRegionName(uint8 regionID, bytes memory newName) public virtual;
  function updateRegionIPs(uint8 regionID, uint32 ipv4, uint128 ipv6) public virtual;
  function addTree(uint8 id, uint8[] memory data) public virtual returns (uint addedCount, uint failedCount);
  function registerRegionAndAddTree(uint8 id, bytes memory name, uint8[] memory data, uint32 ipv4, uint128 ipv6) public virtual returns(uint addedCount, uint failedCount);
  function query(uint64 cellID) public virtual view returns (Region memory region);

  function getRegionsList() public view returns(Region[] memory) {
    Region[] memory results = new Region[](ids.length);
    for (uint i = 0; i < ids.length; i++) {
      results[i] = regions[ids[i]];
    }
    return results;
  }

  function registerRegion(uint8 id, bytes memory name, uint32 ipv4, uint128 ipv6) public virtual {
    require(id != regions[id].id);

    Region memory newRegion = Region({
      id: id,
      registrar: msg.sender,
      name: name,
      ipv4: ipv4,
      ipv6: ipv6,
      lastUpdatedEpoch: block.timestamp
    });
    regions[id] = newRegion;

    ids.push(id);
  }
}
