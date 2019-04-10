const path = require('path');

try {
  require('ts-node/register');
} catch (e) {
  console.log('register error', e.message);
}

module.exports = () => {};

try {
  require(path.resolve(__dirname, './bulkInsert.worker.ts'));
} catch (e) {
  console.log(e);
}
