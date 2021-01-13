// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import './Regions.sol';

contract S2Regions is Regions {
  constructor() Regions(0x40, 0x80) {}
}
