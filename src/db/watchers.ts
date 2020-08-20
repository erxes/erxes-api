import { fetchElk } from '../elasticsearch';
import { Companies, Customers } from './models';

const sendElkRequest = (data, index: string) => {
  const { operationType, documentKey } = data;

  switch (operationType) {
    case 'update': {
      const body = {
        doc: {
          ...(data.updateDescription.updatedFields || {}),
          id: documentKey._id,
        },
      };

      return fetchElk('update', index, body, documentKey._id);
    }

    case 'insert': {
      const body = {
        ...(data.fullDocument || {}),
        id: documentKey._id,
      };

      delete body._id;

      return fetchElk('create', index, body, documentKey._id);
    }
  }

  return fetchElk('delete', index, {}, documentKey._id);
};

const init = () => {
  Customers.watch().on('change', data => {
    sendElkRequest(data, 'customers');
  });

  Companies.watch().on('change', data => {
    sendElkRequest(data, 'companies');
  });
};

export default init;
