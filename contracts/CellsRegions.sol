// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import './Utils.sol';
import './Regions.sol';

abstract contract CellsRegions is Regions {
  struct CellsRegion {
    uint64[] cellIDs;
    uint64[] failedCellIDs;
    uint lastUpdatedEpoch;
  }

  struct CellsRegionExternal {
    Region metadata;
    uint64[] cellIDs;
    uint64[] failedCellIDs;
    uint lastUpdatedEpoch;
  }

  mapping(uint8 => CellsRegion) private cellsRegions;
  mapping(uint64 => uint8) internal spaces;

  constructor(
    uint8 openByte,
    uint8 closeByte,
    uint64 levelLength,
    uint64 treeDataLength
  ) Regions(openByte, closeByte, levelLength, treeDataLength) {}

  function addRegionCell(uint8 regionID, uint64 cellID) internal returns (bool) {
    uint8 destinationRegionId = spaces[cellID];
    if (destinationRegionId == 0 || destinationRegionId == regionID) {
      spaces[cellID] = regionID;
      return true;
    }
    return false;
  }

  function addRegionCells(uint8 regionID, CellsRegion memory cellsRegion, uint64[] memory cellIDs)
    internal returns (CellsRegion memory, uint addedCount, uint failedCount) {
    uint64[] memory newCells = Utils.extendUint64Array(cellsRegion.cellIDs, cellIDs.length);
    uint256 newCellsIdx = cellsRegion.cellIDs.length;

    uint64[] memory newFailedCells = Utils.extendUint64Array(cellsRegion.failedCellIDs, cellIDs.length);
    uint256 newFailedCellsIdx = cellsRegion.failedCellIDs.length;

    for (uint i = 0; i < cellIDs.length; i++) {
      if (addRegionCell(regionID, cellIDs[i])) {
        newCells[newCellsIdx++] = cellIDs[i];
      } else if (!Utils.existsInUint64Array(newFailedCells, cellIDs[i])) {
        newFailedCells[newFailedCellsIdx++] = cellIDs[i];
      }
    }

    cellsRegion.cellIDs = Utils.cutUint64Array(newCells, newCellsIdx);
    cellsRegion.failedCellIDs = Utils.cutUint64Array(newFailedCells, newFailedCellsIdx);
    cellsRegion.lastUpdatedEpoch = block.timestamp;

    return (cellsRegion, newCellsIdx, newFailedCellsIdx);
  }

  function addRegionCells(uint8 id, uint64[] memory cellIDs) public returns (uint addedCount, uint failedCount) {
    require(regions[id].registrar == msg.sender);
    CellsRegion memory cellsRegion = cellsRegions[id];
    (cellsRegion, addedCount, failedCount) = addRegionCells(id, cellsRegion, cellIDs);

    cellsRegions[id] = cellsRegion;

    return (addedCount, failedCount);
  }

  function clearFailedCells(uint8 id) public {
    CellsRegion memory cellsRegion = cellsRegions[id];
    require(regions[id].registrar == msg.sender);

    cellsRegion.failedCellIDs = new uint64[](0);
    cellsRegion.lastUpdatedEpoch = block.timestamp;
    cellsRegions[id] = cellsRegion;
  }

  function removeRegionCells(uint8 id, uint64[] memory cellIDs) public {
    CellsRegion memory cellsRegion = cellsRegions[id];
    require(regions[id].registrar == msg.sender);

    for (uint i = 0; i < cellIDs.length; i++) {
      if (spaces[cellIDs[i]] == id) {
        spaces[cellIDs[i]] = 0;
      }
    }

    cellsRegion.cellIDs = Utils.substractFromUint64Array(cellsRegion.cellIDs, cellIDs);
    cellsRegion.lastUpdatedEpoch = block.timestamp;
    cellsRegions[id] = cellsRegion;
  }

  function registerRegionAndAddCells(uint8 id, bytes memory name, uint64[] memory cellIDs, uint32 ipv4, uint128 ipv6) public returns (uint addedCount, uint failedCount) {
    registerRegion(id, name, ipv4, ipv6);
    return addRegionCells(id, cellIDs);
  }

  function getRegionData(uint8 id) public view returns (CellsRegionExternal memory data) {
    return CellsRegionExternal({
      metadata: regions[id],
      cellIDs: cellsRegions[id].cellIDs,
      failedCellIDs: cellsRegions[id].failedCellIDs,
      lastUpdatedEpoch: cellsRegions[id].lastUpdatedEpoch
    });
  }

  function countTreeElements(uint8[] memory data) private view returns (uint256 length) {
    length = 0;
    int deep = 0;
    uint8 OPEN_CLOSE_BYTE = OPEN_BYTE | CLOSE_BYTE;
    for (uint i = 0; i < data.length; i++) {
      require(deep < 9);

      if ((data[i] & OPEN_BYTE) > 0) {
        deep++;
      } else if (data[i] == CLOSE_BYTE) {
        deep--;
      }

      if ((data[i] & OPEN_CLOSE_BYTE) == 0) { // geohash: 011 00000, s2: 11 000000
        length++;
      }
    }
    return length;
  }

  function expandTree(uint8[] memory data) private view returns (uint64[] memory arr) {
    arr = new uint64[](countTreeElements(data));
    uint idx = 0;
    uint64 shiftAmount = 64 - TREE_DATA_LENGTH;
    uint64 currentHash = 0;
    for (uint i = 0; i < data.length; i++) {
      currentHash &= ~(TREE_DATA_MARK_BITS << shiftAmount); // clear bit at current level
      if (data[i] == CLOSE_BYTE) {
        shiftAmount += TREE_DATA_LENGTH;
        continue;
      }
      currentHash |= (uint64(data[i] & TREE_DATA_MARK_BITS) << shiftAmount);
      if ((data[i] & OPEN_BYTE) > 0) {
        shiftAmount -= TREE_DATA_LENGTH;
      } else {
        arr[idx++] = currentHash;
      }
    }
  }

  function addTree(uint8 id, uint8[] memory data) public returns (uint addedCount, uint failedCount) {
    uint64[] memory hashes = expandTree(data);
    return addRegionCells(id, hashes);
  }

  function registerRegionAndAddTree(uint8 id, bytes memory name, uint8[] memory data, uint32 ipv4, uint128 ipv6) public returns (uint addedCount, uint failedCount) {
    registerRegion(id, name, ipv4, ipv6);
    return addTree(id, data);
  }
}
