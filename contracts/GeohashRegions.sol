// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import './Utils.sol';
import './Regions.sol';

contract GeohashRegions is Regions {
  function expandTree(uint8[] memory data) private pure returns (uint64[] memory arr) {
    arr = new uint64[](countTreeElements(data));
    uint idx = 0;
    uint64 shiftAmount = 56;
    uint64 currentHash = 0;
    for (uint i = 0; i < data.length; i++) {
      currentHash &= ~(uint64(0xFF) << shiftAmount); // clear bit at current level
      if (data[i] == 0x40) {
        shiftAmount += 8;
        continue;
      }
      currentHash |= (data[i] & uint64(0x1F)) << shiftAmount;
      if (data[i] & 0x20 > 0) {
        shiftAmount -= 8;
      } else {
        arr[idx++] = currentHash;
      }
    }
  }

  function countTreeElements(uint8[] memory data) private pure returns (uint256 length) {
    length = 0;
    int deep = 0;
    for (uint i = 0; i < data.length; i++) {
      require(deep > -1 && deep < 8);

      if ((data[i] & 0x20) > 0) {
        deep++;
      } else if (data[i] == 0x40) {
        deep--;
      }

      if ((data[i] & 0x60) == 0) { // 011 00000
        length++;
      }
    }
    return length;
  }

  function addMyTree(uint8 id, uint8[] memory data) public returns (uint addedCount, uint failedCount) {
    uint64[] memory hashes = expandTree(data);
    return addMyCells(id, hashes);
  }

  function registerAndAddTree(uint8 id, bytes memory name, uint8[] memory data) public returns (uint addedCount, uint failedCount) {
    register(id, name);
    return addMyTree(id, data);
  }

  function query(uint64 geohash) public view override returns (RegionMetadata memory region) {
    uint64 shiftBit = 0xffffffffffffff00;
    while (shiftBit > 0) {
      uint8 regionId = getRegionIdFromExactCellID(geohash);
      if (regionId > 0) {
        return getRegionFromId(regionId).metadata;
      }

      geohash &= shiftBit;
      shiftBit = shiftBit << 8;
    }
    return RegionMetadata({id: 0, registrar: address(0), name: ""});
  }
}
