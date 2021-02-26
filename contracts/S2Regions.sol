// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import './Regions.sol';

contract S2Regions is Regions {
  constructor() Regions(
    0x40, // open byte:   01?? ????
    0x80, // close byte:  1000 0000
    2,    // level length:        2
    6     // data length in tree: 6
  ) {}

  function getLevelMarkBits(uint64 cellID) private pure returns (uint64 levelFinalBits, uint64 levelMarkBits) {
    levelFinalBits = 0x0000000000000001;
    levelMarkBits = 0xffffffffffffffff;
    while (levelFinalBits < 0x0100000000000000) {
      if (cellID & levelFinalBits == levelFinalBits) {
        return (levelFinalBits, levelMarkBits);
      }
      levelFinalBits = levelFinalBits << 2;
      levelMarkBits = levelMarkBits << 2;
    }
  }

  function query(uint64 cellID) public override view returns (RegionMetadata memory region) {
    (uint64 finalMark, uint64 markBits) = getLevelMarkBits(cellID);
    while (markBits > 0) {
      uint8 regionId = getRegionIDFromExactCellID(cellID);
      if (regionId > 0) {
        return getRegionFromID(regionId).metadata;
      }

      markBits = markBits << 2;
      finalMark = finalMark << 2;
      cellID = (cellID & markBits) | finalMark;
    }
    return RegionMetadata({id: 0, registrar: address(0), name: "", ipv4: 0, ipv6: 0, lastUpdatedEpoch: 0});
  }
}
