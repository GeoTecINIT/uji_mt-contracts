// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

library Utils {
  function extendUint64Array(uint64[] memory array, uint256 extendSize) public pure returns (uint64[] memory newArray) {
    newArray = new uint64[](array.length + extendSize);
    for (uint256 i = 0; i < array.length; i++) {
      newArray[i] = array[i];
    }
    return newArray;
  }

  function cutUint64Array(uint64[] memory array, uint256 wantedSize) public pure returns (uint64[] memory newArray) {
    require(wantedSize <= array.length);
    newArray = new uint64[](wantedSize);
    for (uint256 i = 0; i < wantedSize; i++) {
      newArray[i] = array[i];
    }
    return newArray;
  }
}
