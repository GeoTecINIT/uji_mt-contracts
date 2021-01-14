// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import './Regions.sol';

contract S2Regions is Regions {
  constructor() Regions(0x40, 0x80) {}

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
