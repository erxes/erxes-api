import { getEnv, sendRequest } from '../data/utils';

const checkStatus = async () => {
  const ENGAGES_API_DOMAIN = getEnv({ name: 'ENGAGES_API_DOMAIN' });

  const argv = process.argv;

  if (argv.length < 3) {
    console.log('Please put taskId after yarn checkStatusEmailVerifier');

    process.exit();
  }

  const taskId = argv[2];

  const response = await sendRequest({
    url: `${ENGAGES_API_DOMAIN}/emailVerifier/bulk/status`,
    method: 'GET',
    params: { taskId },
  });

  console.log('response: ', JSON.parse(response).data);

  process.exit();
};

checkStatus();
