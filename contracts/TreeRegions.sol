// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import './Regions.sol';

abstract contract TreeRegions is Regions {
  struct TreeRegion {
    uint64 cellsLength;
    uint lastUpdatedEpoch;
  }

  struct TreeRegionExternal {
    Region metadata;
    uint64 cellsLength;
    uint lastUpdatedEpoch;
  }

  mapping(uint8 => TreeRegion) private treeRegions;
  mapping(uint64 => uint8) internal nodes;

  constructor(
    uint8 openByte,
    uint8 closeByte,
    uint64 levelLength,
    uint64 treeDataLength
  ) Regions(openByte, closeByte, levelLength, treeDataLength) {}

  function registerRegion(uint8 id, bytes memory name, uint32 ipv4, uint128 ipv6) public override {
    super.registerRegion(id, name, ipv4, ipv6);
    treeRegions[id] = TreeRegion({
      cellsLength: 0,
      lastUpdatedEpoch: block.timestamp
    });
  }

  function getRegionData(uint8 id) public view returns (TreeRegionExternal memory data) {
    return TreeRegionExternal({
      metadata: regions[id],
      cellsLength: treeRegions[id].cellsLength,
      lastUpdatedEpoch: treeRegions[id].lastUpdatedEpoch
    });
  }

  function addTree(uint8 regionID, uint8[] memory data) public {
    uint64 cellsLength = treeRegions[regionID].cellsLength;
    uint64 shiftAmount = 64 - TREE_DATA_LENGTH;
    uint64 currentNodeIdx = 0;
    for (uint i = 0; i < data.length; i++) {
      currentNodeIdx &= ~(TREE_DATA_MARK_BITS << shiftAmount);
      if (data[i] == CLOSE_BYTE) {
        shiftAmount += TREE_DATA_LENGTH;
        continue;
      }
      currentNodeIdx |= (uint64(data[i] & TREE_DATA_MARK_BITS) << shiftAmount);
      if ((data[i] & OPEN_BYTE) > 0) {
        shiftAmount -= TREE_DATA_LENGTH;
      } else {
        nodes[currentNodeIdx] = regionID;
        cellsLength++;
      }
    }
    treeRegions[regionID].cellsLength = cellsLength;
  }

  function registerRegionAndAddTree(uint8 id, bytes memory name, uint8[] memory data, uint32 ipv4, uint128 ipv6) public {
    registerRegion(id, name, ipv4, ipv6);
    addTree(id, data);
  }
}
