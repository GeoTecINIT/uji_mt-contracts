// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import './Utils.sol';
import './Regions.sol';

abstract contract CellsRegions is Regions {
  struct CellsRegion {
    uint64 cellsLength;
    uint lastUpdatedEpoch;
  }

  struct CellsRegionExternal {
    Region metadata;
    uint64 cellsLength;
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

  function registerRegion(uint8 id, bytes memory name, uint32 ipv4, uint128 ipv6) public override {
    super.registerRegion(id, name, ipv4, ipv6);
    cellsRegions[id] = CellsRegion({
      cellsLength: 0,
      lastUpdatedEpoch: block.timestamp
    });
  }

  function addRegionCells(uint8 id, uint64[] memory cellIDs) public {
    require(regions[id].registrar == msg.sender);

    uint64 cellsLength = cellsRegions[id].cellsLength;
    for (uint i = 0; i < cellIDs.length; i++) {
      if (spaces[cellIDs[i]] == 0) {
        spaces[cellIDs[i]] = id;
        cellsLength++;
      }
    }

    cellsRegions[id].cellsLength = cellsLength;
    cellsRegions[id].lastUpdatedEpoch = block.timestamp;
  }

  function registerRegionAndAddCells(uint8 id, bytes memory name, uint64[] memory cellIDs, uint32 ipv4, uint128 ipv6) public {
    registerRegion(id, name, ipv4, ipv6);
    addRegionCells(id, cellIDs);
  }

  function getRegionData(uint8 id) public view returns (CellsRegionExternal memory data) {
    return CellsRegionExternal({
      metadata: regions[id],
      cellsLength: cellsRegions[id].cellsLength,
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

  function addTree(uint8 id, uint8[] memory data) public {
    uint64[] memory hashes = expandTree(data);
    addRegionCells(id, hashes);
  }

  function registerRegionAndAddTree(uint8 id, bytes memory name, uint8[] memory data, uint32 ipv4, uint128 ipv6) public {
    registerRegion(id, name, ipv4, ipv6);
    addTree(id, data);
  }
}
