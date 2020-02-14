import { getEnv, sendRequest } from '../data/utils';

const download = async () => {
  const ENGAGES_API_DOMAIN = getEnv({ name: 'ENGAGES_API_DOMAIN' });

  const argv = process.argv;

  if (argv.length < 3) {
    console.log('Please put taskId after yarn downloadVerifiedEmail');

    process.exit();
  }

  const taskId = argv[2];

  try {
    const response = await sendRequest({
      url: `${ENGAGES_API_DOMAIN}/emailVerifier/bulk/download`,
      method: 'GET',
      params: { taskId },
    });

    console.log('response: ', response);
  } catch (e) {
    console.log(e.message);
  }

  process.exit();
};

download();
