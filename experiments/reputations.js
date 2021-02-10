const web3Utils = require('web3-utils');

module.exports = async(outFn, reputationManagement, reputations, reputationQueries) => {
  console.log('== Reputations Add ==');
  let i = 0;
  for (let reputation of reputations) {
    console.log(`${++i} from ${reputations.length}`);
    const timer = new Date();
    const result = await reputationManagement.updateReputation(reputation.regionID, reputation.address, reputation.service, web3Utils.toBN(reputation.reputation));
    outFn('ReputationManagement.updateReputation', '', result.tx, timer);
  }

  console.log('== Reputation Queries ==');
  i = 0;
  for (let reputationQuery of reputationQueries) {
    if (i % 100 === 0) {
      console.log(`  ${i} from ${reputationQueries.length}`);
    }

    const timer = new Date();
    const result = await reputationManagement.getReputationValue(reputationQuery.regionID, reputationQuery.address, reputationQuery.service);
    outFn('ReputationManagement.getReputationValue', result / 0xffffffffffffffff, null, timer);

    i++;
  }
};
