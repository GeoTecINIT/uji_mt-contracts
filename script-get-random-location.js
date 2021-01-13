const dataManager = require('./data/data-manager')();

module.exports = (callback) => {
  const cells = dataManager.getS2Cells('UJI');
  callback(cells[Math.floor(Math.random() * cells.length)])
};
