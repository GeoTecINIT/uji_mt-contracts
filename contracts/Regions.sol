// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import './Utils.sol';

abstract contract Regions {
  uint8 internal OPEN_BYTE;
  uint8 internal CLOSE_BYTE;
  uint8 internal DATA_MASK;

  uint64 internal LEVEL_LENGTH;
  uint64 internal TREE_DATA_LENGTH;

  uint64 internal LEVEL_MARK_BITS;
  uint64 internal TREE_DATA_MARK_BITS;

  struct Region {
    uint8 id;
    address registrar;
    bytes name;
    uint32 ipv4;
    uint128 ipv6;
    uint lastUpdatedEpoch;
  }

  mapping(uint8 => Region) internal regions;
  uint8[] internal ids;

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

    LEVEL_MARK_BITS = 0;
    for (uint64 i = 0; i < LEVEL_LENGTH; i++) {
      LEVEL_MARK_BITS |= (uint64(1) << i);
    }

    TREE_DATA_MARK_BITS = 0;
    for (uint64 i = 0; i < TREE_DATA_LENGTH; i++) {
      TREE_DATA_MARK_BITS |= (uint64(1) << i);
    }
  }

  function query(uint64 cellID) public virtual view returns (Region memory region);

  function updateRegionName(uint8 regionID, bytes memory newName) public {
    require(regions[regionID].registrar == msg.sender);
    Region memory region = regions[regionID];
    region.name = newName;
    region.lastUpdatedEpoch = block.timestamp;
    regions[regionID] = region;
  }

  function updateRegionIPs(uint8 regionID, uint32 ipv4, uint128 ipv6) public {
    require(regions[regionID].registrar == msg.sender);

    Region memory region = regions[regionID];
    region.ipv4 = ipv4;
    region.ipv6 = ipv6;
    region.lastUpdatedEpoch = block.timestamp;
    regions[regionID] = region;
  }

  function getRegionsList() public view returns(Region[] memory) {
    Region[] memory results = new Region[](ids.length);
    for (uint i = 0; i < ids.length; i++) {
      results[i] = regions[ids[i]];
    }
    return results;
  }

  function registerRegion(uint8 id, bytes memory name, uint32 ipv4, uint128 ipv6) public virtual {
    require(id != regions[id].id);

    Region memory newRegion = Region({
      id: id,
      registrar: msg.sender,
      name: name,
      ipv4: ipv4,
      ipv6: ipv6,
      lastUpdatedEpoch: block.timestamp
    });
    regions[id] = newRegion;

    ids.push(id);
  }
}
