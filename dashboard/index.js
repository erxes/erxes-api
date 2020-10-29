const cubejs = require('@cubejs-client/core');
const express = require('express');
const dotenv = require('dotenv');
const CubejsServer = require('@cubejs-backend/server');

const cubejsApi = cubejs.default('123', { apiUrl: 'http://localhost:4300/cubejs-api/v1' });
const server = new CubejsServer();

const app = express();

dotenv.config();

const { PORT } = process.env;

server
  .listen()
  .then(({ port }) => {
    console.log(`🚀 Cube.js server is listening on ${port}`);
  })
  .catch(e => {
    console.error('Fatal error during server start: ');
    console.error(e.stack || e);
  });

app.listen(4600, () => {
  console.log(`ERXES HELPER RUNNING ON ${4600}`);
});

app.use('/get', async (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  console.log(typeof req.query);

  const response = await cubejsApi.load(req.query);

  response.loadResponse.data.map(xxa => {
    console.log(xxa);
  });

  const result = {
    chartPivot: response.chartPivot(),
    seriesNames: response.seriesNames(),
    tableColumns: response.tableColumns(),
    tablePivot: response.tablePivot(),
  };

  res.send(result);
});
