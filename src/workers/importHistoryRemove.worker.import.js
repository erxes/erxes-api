const path = require('path');

try {
  require('ts-node').register({
    compilerOptions: {
      experimentalDecorators: false,
    },
    files: ['./importHistoryRemove.worker.ts'],
    transpileOnly: true,
  });
} catch (e) {
  console.log('register error', e.message);
}

try {
  require(path.resolve(__dirname, './importHistoryRemove.worker.ts'));
} catch (e) {
  console.log(e);
}
