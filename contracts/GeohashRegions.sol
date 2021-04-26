// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import './RegionsCells.sol';

contract GeohashRegions is RegionsCells {
  constructor() RegionsCells(
    0x20, // open byte:   001? ????
    0x40, // close byte:  0100 0000
    5,    // level length:      5
    5     // tree data length:  5
  ) {}

  function query(uint64 cellID) public override view returns (RegionMetadata memory region) {
    uint64 markBits = 0xfffffffffffffff0;
    while (markBits > 0) {
      uint8 regionId = getRegionIDFromExactCellID(cellID);
      if (regionId > 0) {
        return getRegionFromID(regionId).metadata;
      }

      cellID &= markBits;
      markBits = markBits << 5;
    }
    return RegionMetadata({id: 0, registrar: address(0), name: "", ipv4: 0, ipv6: 0, lastUpdatedEpoch: 0});
  }
}
