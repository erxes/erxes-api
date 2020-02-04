import { client } from '../elasticsearch';

const main = async () => {
  try {
    const response = await client.indices.exists({ index: 'customers' });

    console.log(`Check index response ${response}`);

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

  process.exit();
};

main();
