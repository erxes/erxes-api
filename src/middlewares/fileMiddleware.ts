import * as formidable from 'formidable';
import * as request from 'request';
import * as _ from 'underscore';
import { RABBITMQ_QUEUES } from '../data/constants';
import { can } from '../data/permissions/utils';
import { checkFile, frontendEnv, getSubServiceDomain, uploadFile, uploadFileAWS } from '../data/utils';
import { debugExternalApi } from '../debuggers';
import { sendRPCMessage } from '../messageBroker';

export const importer = async (req: any, res, next) => {
  if (!(await can('importXlsFile', req.user))) {
    return next(new Error('Permission denied!'));
  }

  try {
    const scopeBrandIds = JSON.parse(req.cookies.scopeBrandIds || '[]');
    const form = new formidable.IncomingForm();

    form.parse(req, async (_err, fields: any, response) => {
      let status = '';

      try {
        status = await checkFile(response.file);
      } catch (e) {
        return res.json({ status: e.message });
      }

      // if file is not ok then send error
      if (status !== 'ok') {
        return res.json({ status });
      }

      try {
        const fileName = await uploadFileAWS(response.file, true);

        const result = await sendRPCMessage(RABBITMQ_QUEUES.RPC_API_TO_WORKERS, {
          action: 'createImport',
          type: fields.type,
          fileName,
          scopeBrandIds,
          user: req.user,
        });

        return res.json(result);
      } catch (e) {
        return res.json({ status: 'error', message: e.message });
      }
    });
  } catch (e) {
    return res.json({ status: 'error', message: e.message });
  }
};

export const uploader = async (req: any, res, next) => {
  const INTEGRATIONS_API_DOMAIN = getSubServiceDomain({ name: 'INTEGRATIONS_API_DOMAIN' });

  if (req.query.kind === 'nylas') {
    debugExternalApi(`Pipeing request to ${INTEGRATIONS_API_DOMAIN}`);

    return req.pipe(
      request
        .post(`${INTEGRATIONS_API_DOMAIN}/nylas/upload`)
        .on('response', response => {
          if (response.statusCode !== 200) {
            return next(response.statusMessage);
          }

          return response.pipe(res);
        })
        .on('error', e => {
          debugExternalApi(`Error from pipe ${e.message}`);
          next(e);
        }),
    );
  }

  const form = new formidable.IncomingForm();

  form.parse(req, async (_error, _fields, response) => {
    const file = response.file || response.upload;

    // check file ====
    const status = await checkFile(file, req.headers.source);

    if (status === 'ok') {
      try {
        const result = await uploadFile(frontendEnv({ name: 'API_URL', req }), file, response.upload ? true : false);

        return res.send(result);
      } catch (e) {
        return res.status(500).send(filterXSS(e.message));
      }
    }

    return res.status(500).send(status);
  });
};
