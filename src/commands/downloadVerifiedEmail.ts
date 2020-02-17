import { getEnv, sendRequest } from '../data/utils';
import { Customers } from '../db/models';

const download = async () => {
  const ENGAGES_API_DOMAIN = getEnv({ name: 'ENGAGES_API_DOMAIN' });

  const argv = process.argv;

  if (argv.length < 3) {
    console.log('Please put taskId after yarn downloadVerifiedEmail');

    process.exit();
  }

  const taskId = argv[2];

  try {
    const emails = await sendRequest({
      url: `${ENGAGES_API_DOMAIN}/emailVerifier/bulk/download`,
      method: 'GET',
      params: { taskId },
    });

    for (const row of emails) {
      console.log('email: ', row.email);

      const customer = await Customers.findOne({ primaryEmail: row.email });

      if (customer) {
        customer.hasValidEmail = row.status === 'valid';

        await customer.save();
      }
    }
  } catch (e) {
    console.log(e.message);
  }

  process.exit();
};

download();
