import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
// tslint:disable-next-line
import { Worker } from 'worker_threads';
import * as xlsxPopulate from 'xlsx-populate';
import { can } from '../data/permissions/utils';
import { ImportHistory } from '../db/models';
import { IUserDocument } from '../db/models/definitions/users';
import { checkFieldNames } from '../db/models/utils';

/**
 * Receives and saves xls file in private/xlsImports folder
 * and imports customers to the database
 */
export const importXlsFile = async (file: any, type: string, { user }: { user: IUserDocument }) => {
  return new Promise(async (resolve, reject) => {
    if (!(await can('importXlsFile', user._id))) {
      return reject('Permission denied!');
    }

    const readStream = fs.createReadStream(file.path);

    // Directory to save file
    const downloadDir = `${__dirname}/../private/xlsTemplateOutputs/${file.name}`;

    // Converting pipe into promise
    const pipe = stream =>
      new Promise((resolver, rejecter) => {
        stream.on('finish', resolver);
        stream.on('error', rejecter);
      });

    // Creating streams
    const writeStream = fs.createWriteStream(downloadDir);
    const streamObj = readStream.pipe(writeStream);

    pipe(streamObj)
      .then(async () => {
        // After finished saving instantly create and load workbook from xls
        const workbook = await xlsxPopulate.fromFileAsync(downloadDir);

        // Deleting file after read
        fs.unlink(downloadDir, () => {
          return true;
        });

        const usedRange = workbook.sheet(0).usedRange();

        if (!usedRange) {
          return reject(new Error('Invalid file'));
        }

        const usedSheets = usedRange.value();

        // Getting columns
        const fieldNames = usedSheets[0];

        // Removing column
        usedSheets.shift();

        const properties = await checkFieldNames(type, fieldNames);

        const importHistory = await ImportHistory.create({
          contentType: type,
          total: usedSheets.length,
          userId: user._id,
          date: Date.now(),
        });

        const cpuCount = os.cpus().length;

        const results: string[] = [];

        const calc = Math.ceil(usedSheets.length / cpuCount);

        for (let index = 0; index < cpuCount; index++) {
          const start = index * calc;
          const end = start + calc;
          const row = usedSheets.slice(start, end);
          results.push(row);
        }

        const workerFile =
          process.env.NODE_ENV === 'production'
            ? `./dist/workers/bulkInsert.worker.js`
            : './src/workers/bulkInsert.worker.import.js';

        const workerPath = path.resolve(workerFile);

        const percentagePerData = Number(((1 / usedSheets.length) * 100).toFixed(3));

        setImmediate(() => {
          results.forEach(result => {
            try {
              const worker = new Worker(workerPath, {
                workerData: {
                  result,
                  contentType: type,
                  user,
                  properties,
                  importHistoryId: importHistory._id,
                  percentagePerData,
                },
              });

              worker.on('message', () => {
                worker.terminate();
              });

              worker.on('error', e => {
                reject(new Error(e));
              });

              worker.on('exit', code => {
                if (code !== 0) {
                  reject(new Error(`Worker stopped with exit code ${code}`));
                }
              });
            } catch (e) {
              reject(new Error(e));
            }
          });
        });

        return resolve({ id: importHistory.id });
      })
      .catch(e => {
        return reject({ error: e });
      });
  });
};
