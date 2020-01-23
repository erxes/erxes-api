import { client } from '../elasticsearch';

const main = async () => {
  try {
    const response = await client.indices.exists({ index: 'customers' });

    console.log(`Check index response ${response}`);

    if (response === false) {
      try {
        await client.indices.create({
          index: 'customers',
          body: {
            settings: {
              analysis: {
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
              },
            },
          },
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
        },
      },
    });

    console.log(`Mapping response ${JSON.stringify(response)}`);
  } catch (e) {
    console.log(`Mapping error ${e.message}`);
  }

  process.exit();
};

main();
