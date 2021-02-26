const web3Utils = require('web3-utils');

module.exports = async(optFn, regions, regionsArtifactData, idx, mode) => {
  let result, timer;
  for (let region of regionsArtifactData.regions[idx]) {
    console.log(`=== Region ${region.id} - ${region.code} ===`);

    // Measure region registration
    console.log('  Registering...');
    timer = new Date();
    result = await regions.registerRegion(region.id, web3Utils.stringToHex(region.name), 0, 0);
    await optFn('Regions.registerRegion', region.id, result.tx, timer);

    // Measure adding cells to a region through either cells or tree
    if (mode === 'cells') {
      for (let i = 0; i < region.cells.length; i++) {
        console.log(`  Adding cells chunk ${i + 1} from ${region.cells.length}...`);
        timer = new Date();
        result = await regions.addRegionCells(region.id, region.cells[i]);
        await optFn('Regions.addRegionCells', `id=${region.id};length=${region.cells[i].length}`, result.tx, timer);
      }
    } else if (mode === 'tree') {
      for (let i = 0; i < region.tree.length; i++) {
        console.log(`  Adding tree chunk ${i + 1} from ${region.tree.length}...`);
        timer = new Date();
        result = await regions.addTree(region.id, region.tree[i]);
        await optFn('Regions.addTree', `id=${region.id};size=${region.tree[i].length}`, result.tx, timer);
      }
    }
  }
};
