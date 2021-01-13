// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

library Utils {
  function extendUint64Array(uint64[] memory array, uint extendSize) public pure returns (uint64[] memory newArray) {
    newArray = new uint64[](array.length + extendSize);
    for (uint i = 0; i < array.length; i++) {
      newArray[i] = array[i];
    }
    return newArray;
  }

  function cutUint64Array(uint64[] memory array, uint wantedSize) public pure returns (uint64[] memory newArray) {
    require(wantedSize <= array.length);
    newArray = new uint64[](wantedSize);
    for (uint i = 0; i < wantedSize; i++) {
      newArray[i] = array[i];
    }
    return newArray;
  }

  function existsInUint64Array(uint64[] memory array, uint64 find) public pure returns (bool found) {
    for (uint i = 0; i < array.length; i++) {
      if (array[i] == find) {
        return true;
      }
    }
    return false;
  }

  function deleteFromAddressArray(address[] memory array, address find) public pure returns (address[] memory newArray) {
    newArray = new address[](array.length - 1);
    uint newIdx = 0;
    for (uint i = 0; i < array.length; i++) {
      if (array[i] != find) {
        newArray[newIdx++] = array[i];
      }
    }

    return newArray;
  }

  function pushUniqueToAddressArray(address[] memory array, address value) public pure returns (address[] memory newArray) {
    newArray = new address[](array.length + 1);
    for (uint i = 0; i < array.length; i++) {
      if (array[i] == value) {
        return array;
      }
      newArray[i] = array[i];
    }
    newArray[newArray.length - 1] = value;
    return newArray;
  }
}
