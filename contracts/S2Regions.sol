// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import './Regions.sol';

contract S2Regions is Regions {
  // open byte:   01?? ????
  // close byte:  1000 0000
  // data mask:   0011 1111
  constructor() Regions(
    0x40, // open byte:   01?? ????
    0x80, // close byte:  1000 0000
    2,    // level length:        2
    6     // data length in tree: 6
  ) {}

  function query(uint64 cellID) public override view returns (RegionMetadata memory region) {
    uint64 markBits =   0xfffffffffffffff8; // 1111 1111 ... 1111 1000
    uint64 finalMark =  0x0000000000000004; // 0000 0000 ... 0000 0100
    while (markBits > 0) {
      uint8 regionId = getRegionIDFromExactCellID(cellID);
      if (regionId > 0) {
        return getRegionFromID(regionId).metadata;
      }

      cellID = (cellID & markBits) | finalMark;
      markBits = markBits << 2;
      finalMark = finalMark << 2;
    }
    return RegionMetadata({id: 0, registrar: address(0), name: "", ipv4: 0, ipv6: 0});
  }
}
