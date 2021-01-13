// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import './Utils.sol';

abstract contract Regions {
  struct Region {
    RegionMetadata metadata;
    uint64[] cellIDs;
    uint64[] failedCellIDs;
  }

  struct RegionMetadata {
    uint8 id;
    address registrar;
    bytes name;
  }

  Region[] private regions;

  mapping(uint64 => uint8) private spaces;

  function getRegionAndIndexFromId(uint8 id) internal view returns (Region memory region, int index) {
    for (uint i = 0; i < regions.length; i++) {
      if (regions[i].metadata.id == id) {
        return (regions[i], int(i));
      }
    }
    return (Region({
      metadata: RegionMetadata({id: 0, registrar: address(0), name: ''}),
      cellIDs: new uint64[](0),
      failedCellIDs: new uint64[](0)
    }), -1);
  }

  function getRegionFromId(uint8 id) internal view returns (Region memory region) {
    int idx;
    (region, idx) = getRegionAndIndexFromId(id);
    return region;
  }

  function getRegionIdFromExactCellID(uint64 cellID) public view returns (uint8 regionId) {
    regionId = spaces[cellID];
    return regionId;
  }

  function addCell(Region memory region, uint64 cellID) internal returns (bool) {
    uint8 destinationRegionId = spaces[cellID];
    if (destinationRegionId == 0 || destinationRegionId == region.metadata.id) {
      spaces[cellID] = region.metadata.id;
      return true;
    }
    return false;
  }

  function addCells(Region memory region, uint64[] memory cellIDs) internal returns (Region memory, uint addedCount, uint failedCount) {
    uint64[] memory newCells = Utils.extendUint64Array(region.cellIDs, cellIDs.length);
    uint256 newCellsIdx = region.cellIDs.length;

    uint64[] memory newFailedCells = Utils.extendUint64Array(region.failedCellIDs, cellIDs.length);
    uint256 newFailedCellsIdx = region.failedCellIDs.length;

    for (uint i = 0; i < cellIDs.length; i++) {
      if (addCell(region, cellIDs[i])) {
        newCells[newCellsIdx++] = cellIDs[i];
      } else if (!Utils.existsInUint64Array(newFailedCells, cellIDs[i])) {
        newFailedCells[newFailedCellsIdx++] = cellIDs[i];
      }
    }

    region.cellIDs = Utils.cutUint64Array(newCells, newCellsIdx);
    region.failedCellIDs = Utils.cutUint64Array(newFailedCells, newFailedCellsIdx);

    return (region, newCellsIdx, newFailedCellsIdx);
  }

  function addMyCells(uint8 id, uint64[] memory cellIDs) public returns (uint addedCount, uint failedCount) {
    (Region memory region, int idx) = getRegionAndIndexFromId(id);
    require(region.metadata.registrar == msg.sender && idx > -1);
    (region, addedCount, failedCount) = addCells(region, cellIDs);

    regions[uint(idx)] = region;

    return (addedCount, failedCount);
  }

  function register(uint8 id, bytes memory name) public {
    Region memory existingRegion = getRegionFromId(id);
    require(existingRegion.metadata.id == 0);

    Region memory newRegion = Region({
      metadata: RegionMetadata({
        id: id,
        registrar: msg.sender,
        name: name
      }),
      cellIDs: new uint64[](0),
      failedCellIDs: new uint64[](0)
    });
    regions.push(newRegion);
  }

  function registerAndAddCells(uint8 id, bytes memory name, uint64[] memory cellIDs) public returns (uint addedCount, uint failedCount) {
    register(id, name);
    return addMyCells(id, cellIDs);
  }

  function getRegionsList() public view returns (RegionMetadata[] memory results) {
    results = new RegionMetadata[](regions.length);
    for (uint256 i = 0; i < regions.length; i++) {
      results[i] = regions[i].metadata;
    }
    return results;
  }

  function getRegionData(uint8 id) public view returns (Region memory region) {
    return getRegionFromId(id);
  }

  function query(uint64 geohash) public view virtual returns (RegionMetadata memory region);
}
