import { getEnv, sendRequest } from '../data/utils';
import { connect, disconnect } from '../db/connection';
import { Customers } from '../db/models';

connect()
  .then(async () => {
    const customers = await Customers.find({ primaryEmail: { $exists: true, $ne: null } }, { primaryEmail: 1 });
    const ENGAGES_API_DOMAIN = getEnv({ name: 'ENGAGES_API_DOMAIN' });

    const emails = customers.map(customer => customer.primaryEmail);
    const firstEmail = [emails[3], emails[4]];

    const response = await sendRequest({
      url: `${ENGAGES_API_DOMAIN}/emailVerifier/bulk`,
      method: 'POST',
      body: { emails: JSON.stringify(firstEmail) },
    });

    console.log('response: ', response);
  })

  .then(() => {
    return disconnect();
  })

  .then(() => {
    process.exit();
  });
