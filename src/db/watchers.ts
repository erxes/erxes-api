import * as telemetry from 'erxes-telemetry';
import { sendRequest } from '../data/utils';
import { Companies, Customers } from './models';

const { ELASTICSEARCH_API_DOMAIN } = process.env;

const sendElkRequest = (data, machineId: string, index: string) => {
  const { operationType, documentKey } = data;

  const body: any = {
    machineId,
    index,
  };

  switch (operationType) {
    case 'delete': {
      body.id = documentKey._id;

      break;
    }
    case 'update': {
      body.doc = {
        ...(data.updateDescription.updatedFields || {}),
        id: documentKey._id,
      };

      break;
    }
    case 'insert': {
      const fullDocument = { ...(data.fullDocument || {}), id: documentKey._id };
      delete fullDocument._id;

      body.doc = fullDocument;

      break;
    }
    default:
  }

  return sendRequest({
    method: 'POST',
    url: `${ELASTICSEARCH_API_DOMAIN}/${operationType}`,
    body,
  });
};

const init = () => {
  const machineId = telemetry.getMachineId().toString();

  Customers.watch().on('change', data => {
    sendElkRequest(data, machineId, 'customers');
  });

  Companies.watch().on('change', data => {
    sendElkRequest(data, machineId, 'companies');
  });
};

export default init;
