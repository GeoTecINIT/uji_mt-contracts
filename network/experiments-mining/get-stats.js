const fs = require('fs');
const Web3 = require('web3');
const web3 = new Web3('http://127.0.0.1:8545');

if (!fs.existsSync('./out')) {
  fs.mkdirSync('./out');
}

const NAME = 'win1';

(async() => {
  const data = [['name', 'blockNumber', 'timestamp', 'timeSpent', 'size', 'difficulty', 'totalDifficulty']];
  const account = (await web3.eth.getAccounts())[0];
  const blockNumber = (await web3.eth.getBlockNumber()) + 1;
  let startTime = JSON.parse(fs.readFileSync('./note.json')).startTime[NAME];
  for (let i = 1; i < blockNumber; i++) {
    console.log(`${i}/${blockNumber - 1}...`);
    const block = await web3.eth.getBlock(i);
    if (!block) {
      continue;
    }
    if (block.miner === account) {
      let timeSpent = block.timestamp - startTime;
      data.push([NAME, block.number, block.timestamp, timeSpent, block.size, block.difficulty, block.totalDifficulty]);
    }
    startTime = block.timestamp;
  }

  fs.writeFileSync(`./out/results-${NAME}.csv`,
    data.map(row => row.join(',')).join('\n'));
  console.log('FINISH');
})();
