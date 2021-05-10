// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import './TreeRegions.sol';

contract GeohashTreeRegions is TreeRegions {
  constructor() TreeRegions(
    0x20, // open byte:   001? ????
    0x40, // close byte:  0100 0000
    5,    // level length:      5
    5     // tree data length:  5
  ) {}

  function query(uint64 cellID) public override view returns (Region memory region) {
    uint64 markBits = 0xfffffffffffffff0;
    while (markBits > 0) {
      uint8 regionID = nodes[cellID];
      if (regionID > 0) {
        return regions[regionID];
      }

      cellID &= markBits;
      markBits = markBits << 5;
    }
    return Region({id: 0, registrar: address(0), name: "", ipv4: 0, ipv6: 0, lastUpdatedEpoch: 0});
  }
}
