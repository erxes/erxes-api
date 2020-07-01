import * as schedule from 'node-schedule';
import { checkTask, getTrueMailBulk } from '../api';
import { getBulkResult, getStatus } from '../apiPhoneVerifier';
import { getArray, setArray } from '../redisClient';
import { debugCrons } from '../utils';

schedule.scheduleJob('1 * * * * *', async () => {
  let listIds = await getArray('erxes_phone_verifier_list_ids');

  if (listIds.length === 0) {
    return;
  }

  for (const listId of listIds) {
    debugCrons(`Getting validation progress status with list_id: ${listId}`);

    const { status, data } = await getStatus(listId);

    if (status === 'success' && data.progress_status === 'completed') {
      await getBulkResult(listId);
      debugCrons(`Process is finished with list_id: ${listId}`);
      listIds = listIds.filter(item => {
        return item !== listId;
      });

      setArray('erxes_phone_verifier_list_ids', listIds);
    }
  }
});

schedule.scheduleJob('2 * * * * *', async () => {
  let taskIds = await getArray('erxes_email_verifier_task_ids');

  if (taskIds.length === 0) {
    return;
  }

  for (const taskId of taskIds) {
    const result = await checkTask(taskId);

    if (result.status === 'finished') {
      await getTrueMailBulk(taskId);

      taskIds = taskIds.filter(item => {
        return item !== taskId;
      });

      setArray('erxes_email_verifier_task_ids', taskIds);
    }
  }
});
