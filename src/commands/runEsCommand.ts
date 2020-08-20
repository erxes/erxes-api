import * as elasticsearch from 'elasticsearch';

const argv = process.argv;
const { ELASTICSEARCH_URL = 'http://localhost:9200' } = process.env;

/*
 * yarn run runEsCommand deleteByQuery  '{"index":"erxes_office__events","body":{"query":{"match":{"customerId":"CX2BFBGDEHFehNT8y"}}}}'
 */
const main = async () => {
  const client = new elasticsearch.Client({
    hosts: [ELASTICSEARCH_URL],
  });

  const getMappings = async (index: string) => {
    return client.indices.getMapping({ index });
  };

  if (argv.length === 4) {
    const body = argv.pop() || '{}';
    const action = argv.pop();

    try {
      if (action === 'getMapping') {
        const mappingResponse = await getMappings(JSON.parse(body).index);
        return console.log(JSON.stringify(mappingResponse));
      }

      const response = await client[action](JSON.parse(body));
      console.log(JSON.stringify(response));
    } catch (e) {
      console.log(e);
    }
  }
};

main()
  .then(() => {
    console.log('done ...');
  })
  .catch(e => {
    console.log(e.message);
  });
