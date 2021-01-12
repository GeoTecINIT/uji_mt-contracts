const fs = require('fs');
const path = require('path');
const s2base64tree = require('s2base64tree');

const readFile = filePath => fs.readFileSync(filePath)
  .toString()
  .split('\n')
  .filter(x => x);

fs.readdirSync('./data/out/temp')
  .filter(f => path.extname(f) === '.s2cells-base64')
  .map(f => `./data/out/temp/${f}`)
  .forEach(filePath => {
    console.log(`Making tree of ${filePath}`);
    const fileNameWithoutExt = path.basename(filePath, '.s2cells-base64');

    const s2base64arr = readFile(filePath);
    const tree = s2base64tree.makeTree(s2base64arr);
    
    fs.writeFileSync(
      `./data/out/${fileNameWithoutExt}.s2cells-base64tree`,
      Buffer.from(s2base64tree.encoder.encode(tree))
    );
    fs.rmSync(filePath);
  });

console.log('FINISHED');
