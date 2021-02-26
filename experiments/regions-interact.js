module.exports = async(optFn, regions, regionsArtifactData, updateData, idx) => {
  console.log('== Interacting with Regions Contract ==');

  console.log('Removing cells...');
  const removingCellIDs = regionsArtifactData.removeCells.cellIDs[idx];
  timer = new Date();
  result = await regions.removeRegionCells(regionsArtifactData.removeCells.regionID, removingCellIDs);
  await optFn('Regions.removeRegionCells', `id=${regionsArtifactData.removeCells.regionID};length=${removingCellIDs.length}`, result.tx, timer);

  console.log('Rolling back...');
  await regions.addRegionCells(regionsArtifactData.removeCells.regionID, removingCellIDs);

  console.log('Updating data...');
  const updateIP = updateData.updateIP;
  timer = new Date();
  result = await regions.updateRegionIPs(updateIP.regionID, updateIP.ipv4, updateIP.ipv6);
  await optFn('Regions.updateRegionIPs', updateIP.regionID, result.tx, timer);

  // Measure region query time
  console.log('Test query...');
  const cellIDs = [...regionsArtifactData.query, ...regionsArtifactData.queryOut];
  console.log(`    ${cellIDs.length} cases`);
  for (let i = 0; i < cellIDs.length; i++) {
    if (i % 100 === 0) {
      console.log(`    ${i}/${cellIDs.length}`)
    }
    timer = new Date();
    result = await regions.query(cellIDs[i]);
    await optFn('Regions.query', result['id'], null, timer);
  }
};
