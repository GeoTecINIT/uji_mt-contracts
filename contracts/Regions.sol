// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import './Utils.sol';

abstract contract Regions {

  struct RegionMetadata {
    uint8 id;
    address registrar;
    bytes name;
    uint32 ipv4;
    uint128 ipv6;
    uint lastUpdatedEpoch;
  }
  
  constructor() {}

  function getRegionIDFromExactCellID(uint64 cellID) public virtual view returns (uint8 regionID);
  function addRegionCells(uint8 id, uint64[] memory cellIDs) public virtual returns (uint addedCount, uint failedCount);
  function clearFailedCells(uint8 id) public virtual;
  function removeRegionCells(uint8 id, uint64[] memory cellIDs) public virtual;
  function registerRegion(uint8 id, bytes memory name, uint32 ipv4, uint128 ipv6) public virtual;
  function registerRegionAndAddCells(uint8 id, bytes memory name, uint64[] memory cellIDs, uint32 ipv4, uint128 ipv6) public virtual returns (uint addedCount, uint failedCount);
  function updateRegionName(uint8 regionID, bytes memory newName) public virtual;
  function updateRegionIPs(uint8 regionID, uint32 ipv4, uint128 ipv6) public virtual;
  function addTree(uint8 id, uint8[] memory data) public virtual returns (uint addedCount, uint failedCount);
  function registerRegionAndAddTree(uint8 id, bytes memory name, uint8[] memory data, uint32 ipv4, uint128 ipv6) public virtual returns(uint addedCount, uint failedCount);
}
