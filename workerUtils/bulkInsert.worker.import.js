const path = require('path');

process.env.TS_NODE_FILES = true;

try {
  require('ts-node').register({
    compilerOptions: {
      experimentalDecorators: false,
    },
    files: ['./bulkerInsert.worker.ts'],
    transpileOnly: true,
  });
} catch (e) {
  console.log('register error', e.message);
}

module.exports = () => {};

try {
  require(path.resolve(__dirname, './bulkInsert.worker.ts'));
} catch (e) {
  console.log(e);
}
