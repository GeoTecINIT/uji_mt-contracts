// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import './Utils.sol';

abstract contract Regions {
  uint8 internal OPEN_BYTE;
  uint8 internal CLOSE_BYTE;
  uint8 internal DATA_MASK;

  uint64 internal LEVEL_LENGTH;
  uint64 internal TREE_DATA_LENGTH;

  uint64 private TREE_DATA_MARK_BITS;

  struct Region {
    RegionMetadata metadata;
    uint64[] cellIDs;
    uint64[] failedCellIDs;
  }

  struct RegionMetadata {
    uint8 id;
    address registrar;
    bytes name;
    uint32 ipv4;
    uint256 ipv6;
  }

  Region[] private regions;

  mapping(uint64 => uint8) private spaces;

  constructor(
    uint8 openByte,
    uint8 closeByte,
    uint64 levelLength,
    uint64 treeDataLength
  ) {
    OPEN_BYTE = openByte;
    CLOSE_BYTE = closeByte;

    LEVEL_LENGTH = levelLength;
    TREE_DATA_LENGTH = treeDataLength;

    uint64 markBits = 0;
    for (uint64 i = 0; i < TREE_DATA_LENGTH; i++) {
      markBits |= (uint64(1) << i);
    }
    TREE_DATA_MARK_BITS = markBits;
  }

  function getRegionAndIndexFromID(uint8 id) internal view returns (Region memory region, int index) {
    for (uint i = 0; i < regions.length; i++) {
      if (regions[i].metadata.id == id) {
        return (regions[i], int(i));
      }
    }
    return (Region({
      metadata: RegionMetadata({id: 0, registrar: address(0), name: '', ipv4: 0, ipv6: 0}),
      cellIDs: new uint64[](0),
      failedCellIDs: new uint64[](0)
    }), -1);
  }

  function getRegionFromID(uint8 id) internal view returns (Region memory region) {
    int idx;
    (region, idx) = getRegionAndIndexFromID(id);
    return region;
  }

  function getRegionIDFromExactCellID(uint64 cellID) public view returns (uint8 regionID) {
    return spaces[cellID];
  }

  function addRegionCell(Region memory region, uint64 cellID) internal returns (bool) {
    uint8 destinationRegionId = spaces[cellID];
    if (destinationRegionId == 0 || destinationRegionId == region.metadata.id) {
      spaces[cellID] = region.metadata.id;
      return true;
    }
    return false;
  }

  function addRegionCells(Region memory region, uint64[] memory cellIDs) internal returns (Region memory, uint addedCount, uint failedCount) {
    uint64[] memory newCells = Utils.extendUint64Array(region.cellIDs, cellIDs.length);
    uint256 newCellsIdx = region.cellIDs.length;

    uint64[] memory newFailedCells = Utils.extendUint64Array(region.failedCellIDs, cellIDs.length);
    uint256 newFailedCellsIdx = region.failedCellIDs.length;

    for (uint i = 0; i < cellIDs.length; i++) {
      if (addRegionCell(region, cellIDs[i])) {
        newCells[newCellsIdx++] = cellIDs[i];
      } else if (!Utils.existsInUint64Array(newFailedCells, cellIDs[i])) {
        newFailedCells[newFailedCellsIdx++] = cellIDs[i];
      }
    }

    region.cellIDs = Utils.cutUint64Array(newCells, newCellsIdx);
    region.failedCellIDs = Utils.cutUint64Array(newFailedCells, newFailedCellsIdx);

    return (region, newCellsIdx, newFailedCellsIdx);
  }

  function addMyRegionCells(uint8 id, uint64[] memory cellIDs) public returns (uint addedCount, uint failedCount) {
    (Region memory region, int idx) = getRegionAndIndexFromID(id);
    require(region.metadata.registrar == msg.sender && idx > -1);
    (region, addedCount, failedCount) = addRegionCells(region, cellIDs);

    regions[uint(idx)] = region;

    return (addedCount, failedCount);
  }

  function clearMyFailedCells(uint8 id) public {
    (Region memory region, int index) = getRegionAndIndexFromID(id);
    require(index > -1 && region.metadata.registrar == msg.sender);

    regions[uint(index)].failedCellIDs = new uint64[](0);
  }

  function removeMyRegionCells(uint8 id, uint64[] memory cellIDs) public {
    (Region memory region, int index) = getRegionAndIndexFromID(id);
    require(index > -1 && region.metadata.registrar == msg.sender);

    for (uint i = 0; i < cellIDs.length; i++) {
      if (getRegionIDFromExactCellID(cellIDs[i]) == id) {
        spaces[cellIDs[i]] = 0;
      }
    }

    regions[uint(index)].failedCellIDs = Utils.substractFromUint64Array(region.failedCellIDs, cellIDs);
  }

  function registerRegion(uint8 id, bytes memory name, uint32 ipv4, uint256 ipv6) public {
    Region memory existingRegion = getRegionFromID(id);
    require(existingRegion.metadata.id == 0);

    Region memory newRegion = Region({
      metadata: RegionMetadata({
        id: id,
        registrar: msg.sender,
        name: name,
        ipv4: ipv4,
        ipv6: ipv6
      }),
      cellIDs: new uint64[](0),
      failedCellIDs: new uint64[](0)
    });
    regions.push(newRegion);
  }

  function registerRegionAndAddCells(uint8 id, bytes memory name, uint64[] memory cellIDs, uint32 ipv4, uint256 ipv6) public returns (uint addedCount, uint failedCount) {
    registerRegion(id, name, ipv4, ipv6);
    return addMyRegionCells(id, cellIDs);
  }

  function updateRegionName(uint8 regionID, bytes memory newName) public {
    (Region memory region, int index) = getRegionAndIndexFromID(regionID);
    require(index > -1 && region.metadata.registrar == msg.sender);
    regions[uint(index)].metadata.name = newName;
  }

  function updateRegionIPs(uint8 regionID, uint32 ipv4, uint256 ipv6) public {
    (Region memory region, int index) = getRegionAndIndexFromID(regionID);
    require(index > -1 && region.metadata.registrar == msg.sender);

    RegionMetadata memory metadata = region.metadata;
    metadata.ipv4 = ipv4;
    metadata.ipv6 = ipv6;
    regions[uint(index)].metadata = metadata;
  }

  function getRegionsList() public view returns (RegionMetadata[] memory results) {
    results = new RegionMetadata[](regions.length);
    for (uint256 i = 0; i < regions.length; i++) {
      results[i] = regions[i].metadata;
    }
    return results;
  }

  function getRegionData(uint8 id) public view returns (Region memory region) {
    return getRegionFromID(id);
  }

  function countTreeElements(uint8[] memory data) private view returns (uint256 length) {
    length = 0;
    int deep = 0;
    uint8 OPEN_CLOSE_BYTE = OPEN_BYTE | CLOSE_BYTE;
    for (uint i = 0; i < data.length; i++) {
      require(deep > -1 && deep < 8);

      if ((data[i] & OPEN_BYTE) > 0) {
        deep++;
      } else if (data[i] == CLOSE_BYTE) {
        deep--;
      }

      if ((data[i] & OPEN_CLOSE_BYTE) == 0) { // geohash: 011 00000, s2: 11 000000
        length++;
      }
    }
    return length;
  }

  function expandTree(uint8[] memory data) private view returns (uint64[] memory arr) {
    arr = new uint64[](countTreeElements(data));
    uint idx = 0;
    uint64 shiftAmount = 64 - TREE_DATA_LENGTH;
    uint64 currentHash = 0;
    for (uint i = 0; i < data.length; i++) {
      currentHash &= ~(TREE_DATA_MARK_BITS << shiftAmount); // clear bit at current level
      if (data[i] == CLOSE_BYTE) {
        shiftAmount += TREE_DATA_LENGTH;
        continue;
      }
      currentHash |= (uint64(data[i] & TREE_DATA_MARK_BITS) << shiftAmount);
      if ((data[i] & OPEN_BYTE) > 0) {
        shiftAmount -= TREE_DATA_LENGTH;
      } else {
        arr[idx++] = currentHash;
      }
    }
  }


  function addMyTree(uint8 id, uint8[] memory data) public returns (uint addedCount, uint failedCount) {
    uint64[] memory hashes = expandTree(data);
    return addMyRegionCells(id, hashes);
  }

  function registerRegionAndAddTree(uint8 id, bytes memory name, uint8[] memory data, uint32 ipv4, uint256 ipv6) public returns (uint addedCount, uint failedCount) {
    registerRegion(id, name, ipv4, ipv6);
    return addMyTree(id, data);
  }

  function query(uint64 cellID) public virtual view returns (RegionMetadata memory region) {
    uint64 shiftBit = 0xffffffffffffff00;
    while (shiftBit > 0) {
      uint8 regionId = getRegionIDFromExactCellID(cellID);
      if (regionId > 0) {
        return getRegionFromID(regionId).metadata;
      }

      cellID &= shiftBit;
      shiftBit = shiftBit << LEVEL_LENGTH;
    }
    return RegionMetadata({id: 0, registrar: address(0), name: "", ipv4: 0, ipv6: 0});
  }
}
