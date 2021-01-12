// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import './Utils.sol';

contract GeohashRegions {

  struct Region {
    RegionMetadata metadata;
    uint64[] geohashes;
    uint64[] unregisteredGeohashes;
  }

  struct RegionMetadata {
    uint8 id;
    address registrar;
    bytes name;
  }

  mapping(uint256 => uint8) public spaces;

  Region[] private regions;

  function getRegionAndIndexFromId(uint8 id) internal view returns (Region memory region, int index) {
    for (uint i = 0; i < regions.length; i++) {
      if (regions[i].metadata.id == id) {
        return (regions[i], int(i));
      }
    }
    return (Region({
      metadata: RegionMetadata({id: 0, registrar: address(0), name: ''}),
      geohashes: new uint64[](0),
      unregisteredGeohashes: new uint64[](0)
    }), -1);
  }

  function getRegionFromId(uint8 id) internal view returns (Region memory region) {
    int idx;
    (region, idx) = getRegionAndIndexFromId(id);
    return region;
  }

  function getRegionIdFromExactGeohash(uint64 geohash) public view returns (uint8 regionId) {
    regionId = spaces[geohash];
    return regionId;
  }

  function addSpace(Region memory region, uint64 geohash) internal returns (bool) {
    uint8 destinationRegionId = spaces[geohash];
    if (destinationRegionId == 0 || destinationRegionId == region.metadata.id) {
      spaces[geohash] = region.metadata.id;
      return true;
    }
    return false;
  }

  function addSpaces(Region memory region, uint64[] memory geohashes) internal returns (Region memory, uint addedCount, uint failedCount) {
    uint64[] memory newGeohashes = Utils.extendUint64Array(region.geohashes, geohashes.length);
    uint256 newGeohashesIdx = region.geohashes.length;

    uint64[] memory newUnregisteredGeohashes = Utils.extendUint64Array(region.unregisteredGeohashes, geohashes.length);
    uint256 newUnregisteredGeohashesIdx = region.unregisteredGeohashes.length;

    for (uint i = 0; i < geohashes.length; i++) {
      if (addSpace(region, geohashes[i])) {
        newGeohashes[newGeohashesIdx++] = geohashes[i];
      } else {
        newUnregisteredGeohashes[newUnregisteredGeohashesIdx++] = geohashes[i];
      }
    }

    region.geohashes = Utils.cutUint64Array(newGeohashes, newGeohashesIdx);
    region.unregisteredGeohashes = Utils.cutUint64Array(newUnregisteredGeohashes, newUnregisteredGeohashesIdx);

    return (region, newGeohashesIdx, newUnregisteredGeohashesIdx);
  }

  function addMySpaces(uint8 id, uint64[] memory geohashes) public returns (uint addedCount, uint failedCount) {
    (Region memory region, int idx) = getRegionAndIndexFromId(id);
    require(region.metadata.registrar == msg.sender && idx > -1);
    (region, addedCount, failedCount) = addSpaces(region, geohashes);

    regions[uint(idx)] = region;

    return (addedCount, failedCount);
  }

  function register(uint8 id, bytes memory name) public {
    Region memory existingRegion = getRegionFromId(id);
    require(existingRegion.metadata.id == 0);

    Region memory newRegion = Region({
      metadata: RegionMetadata({
        id: id,
        registrar: msg.sender,
        name: name
      }),
      geohashes: new uint64[](0),
      unregisteredGeohashes: new uint64[](0)
    });
    regions.push(newRegion);
  }

  function registerAndAddSpaces(uint8 id, bytes memory name, uint64[] memory geohashes) public returns (uint addedCount, uint failedCount) {
    register(id, name);
    return addMySpaces(id, geohashes);
  }

  function getRegionsList() public view returns (RegionMetadata[] memory results) {
    results = new RegionMetadata[](regions.length);
    for (uint256 i = 0; i < regions.length; i++) {
      results[i] = regions[i].metadata;
    }
    return results;
  }

  function getRegionData(uint8 id) public view returns (Region memory region) {
    return getRegionFromId(id);
  }

  function query(uint64 geohash) public view returns (RegionMetadata memory region) {
    uint64 shiftBit = 0xffffffffffffff00;
    while (shiftBit > 0) {
      uint8 regionId = getRegionIdFromExactGeohash(geohash);
      if (regionId > 0) {
        return getRegionFromId(regionId).metadata;
      }

      geohash &= shiftBit;
      shiftBit = shiftBit << 8;
    }
    return RegionMetadata({id: 0, registrar: address(0), name: ""});
  }
}
