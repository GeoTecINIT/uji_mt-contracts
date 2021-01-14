// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import './Regions.sol';

contract GeohashRegions is Regions {
  constructor() Regions(
    0x20, // open byte:   001? ????
    0x40, // close byte:  0100 0000
    5,    // level length:      5
    5     // tree data length:  5
  ) {}
}
