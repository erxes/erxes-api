import * as elasticsearch from 'elasticsearch';
import { debugBase } from './debuggers';

const { NODE_ENV, ELASTICSEARCH_URL } = process.env;

export const client = new elasticsearch.Client({
  hosts: [ELASTICSEARCH_URL],
});

client.ping({ requestTimeout: 90000 }, error => {
  if (error) {
    console.error('elasticsearch cluster is down!');
  } else {
    console.log('elasticsearch is ready');

    prepareIndexes().catch(e => {
      console.error(e.message);
    });
  }
});

export const getMappings = async (index: string) => {
  return client.indices.getMapping({ index });
};

export const fetchElk = async (action, index: string, body: any) => {
  if (NODE_ENV === 'test') {
    return action === 'search' ? { hits: { total: { value: 0 }, hits: [] } } : 0;
  }

  try {
    const response = await client[action]({
      index,
      body,
    });

    return response;
  } catch (e) {
    debugBase(`Error during elk query ${e}`);
    throw new Error(e);
  }
};

const prepareIndexes = async () => {
  try {
    const response = await client.indices.exists({ index: 'customers' });

    if (response === false) {
      const analysis = {
        analyzer: {
          uax_url_email_analyzer: {
            tokenizer: 'uax_url_email_tokenizer',
          },
        },
        tokenizer: {
          uax_url_email_tokenizer: {
            type: 'uax_url_email',
          },
        },
      };

      try {
        await client.indices.create({
          index: 'customers',
          body: { settings: { analysis } },
        });

        await client.indices.create({
          index: 'companies',
          body: { settings: { analysis } },
        });
      } catch (e) {
        console.log(`Check response error ${e.message}`);
      }
    }
  } catch (e) {
    console.log(e.message);
  }

  try {
    const response = await client.indices.putMapping({
      index: 'customers',
      body: {
        properties: {
          primaryEmail: {
            type: 'text',
            analyzer: 'uax_url_email_analyzer',
          },
          integrationId: {
            type: 'keyword',
          },
          scopeBrandIds: {
            type: 'keyword',
          },
          ownerId: {
            type: 'keyword',
          },
          position: {
            type: 'keyword',
          },
          leadStatus: {
            type: 'keyword',
          },
          lifecycleState: {
            type: 'keyword',
          },
          tagIds: {
            type: 'keyword',
          },
          companyIds: {
            type: 'keyword',
          },
          mergedIds: {
            type: 'keyword',
          },
          status: {
            type: 'keyword',
          },
        },
      },
    });

    const companiesResponse = await client.indices.putMapping({
      index: 'companies',
      body: {
        properties: {
          primaryEmail: {
            type: 'text',
            analyzer: 'uax_url_email_analyzer',
          },
          scopeBrandIds: {
            type: 'keyword',
          },
          plan: {
            type: 'keyword',
          },
          industry: {
            type: 'keyword',
          },
          parentCompanyId: {
            type: 'keyword',
          },
          ownerId: {
            type: 'keyword',
          },
          leadStatus: {
            type: 'keyword',
          },
          lifecycleState: {
            type: 'keyword',
          },
          tagIds: {
            type: 'keyword',
          },
          mergedIds: {
            type: 'keyword',
          },
          status: {
            type: 'keyword',
          },
          businessType: {
            type: 'keyword',
          },
        },
      },
    });

    console.log(`Customers mapping response ${JSON.stringify(response)}`);
    console.log(`Companies mapping response ${JSON.stringify(companiesResponse)}`);
  } catch (e) {
    console.log(`Mapping error ${e.message}`);
  }
};
