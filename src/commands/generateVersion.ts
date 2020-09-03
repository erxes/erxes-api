import * as fs from 'fs';
import * as path from 'path';

const start = () => {
  const projectPath = process.cwd();
  const packageVersion = require(path.join(projectPath, 'package.json')).version;
  const versionInfo = { packageVersion };

  fs.writeFile('./dist/private/version.json', JSON.stringify(versionInfo), () => {
    console.log('saved');
  });
};

start();
