import * as os from 'os';

// tslint:disable-next-line
import { Worker } from 'worker_threads';

let workers: any[] = [];

export const createWorkers = (workerPath: string, workerData: any, results: string[]) => {
  const threadIds: number[] = [];

  return new Promise((resolve, reject) => {
    results.forEach(result => {
      try {
        const worker = new Worker(workerPath, {
          workerData: {
            ...workerData,
            result,
          },
        });

        workers.push(worker);
        threadIds.push(worker.threadId);

        worker.on('message', () => {
          workers = workers.filter(workerObj => {
            return worker.threadId !== workerObj.threadId;
          });

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

    resolve(threadIds);
  });
};

export const splitToCore = (datas: any[]) => {
  const cpuCount = os.cpus().length;

  const results: any[] = [];

  const calc = Math.ceil(datas.length / cpuCount);

  for (let index = 0; index < cpuCount; index++) {
    const start = index * calc;
    const end = start + calc;
    const row = datas.slice(start, end);

    results.push(row);
  }

  return results;
};

export const removeWorker = threadIds => {
  workers = workers.filter(worker => {
    const threadId = worker.threadId;

    if (threadIds.includes(worker.threadId)) {
      worker.terminate();
    }

    return !threadIds.includes(threadId);
  });
};
