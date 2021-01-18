var miningThreads = 4;

function checkMining() {
  if (eth.getBlock('pending').transactions.length) {
    if (eth.mining) {
      return;
    }
    miner.start(miningThreads);
  } else {
    miner.stop();
  }
};

eth.filter('latest', function() { checkMining(); });
eth.filter('pending', function() { checkMining(); });

checkMining();
