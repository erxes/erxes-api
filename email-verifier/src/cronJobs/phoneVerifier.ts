import * as schedule from 'node-schedule';
import { downloadAndUpdate, getStatus } from '../apiPhoneVerifier';
import { getArray, setArray } from '../redisClient';
import { debugCrons } from '../utils';

schedule.scheduleJob('1 * * * * *', async () => {
  let listIds = await getArray('erxes_phone_verifier_list_ids');

  if (listIds.length === 0) {
    return;
  }

  for (const { listId, fileName } of listIds) {
    debugCrons(`Getting validation progress status with list_id: ${listId}`);
    const { status, data } = await getStatus(listId);
    if (status === 'success' && data.progress_status === 'completed') {
      await downloadAndUpdate(listId, fileName);
      debugCrons(`Process is finished with list_id: ${listId}`);
      listIds = listIds.filter(item => {
        return item.listId !== listId;
      });

      setArray('erxes_phone_verifier_list_ids', listIds);
    }
  }
});
