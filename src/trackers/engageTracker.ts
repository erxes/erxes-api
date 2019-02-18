import * as AWS from 'aws-sdk';
import { getEnv } from '../data/utils';
import { EngageMessages } from '../db/models';

export const getApi = (type: string): any => {
  const AWS_SES_ACCESS_KEY_ID = getEnv({ name: 'AWS_SES_ACCESS_KEY_ID' });
  const AWS_SES_SECRET_ACCESS_KEY = getEnv({ name: 'AWS_SES_SECRET_ACCESS_KEY' });
  const AWS_REGION = getEnv({ name: 'AWS_REGION' });

  AWS.config.update({
    accessKeyId: AWS_SES_ACCESS_KEY_ID,
    secretAccessKey: AWS_SES_SECRET_ACCESS_KEY,
    region: AWS_REGION,
  });

  if (type === 'ses') {
    return new AWS.SES();
  }

  return new AWS.SNS();
};

/*
 * Receives notification from amazon simple notification service
 * And updates engage message status and stats
 */
const handleMessage = async message => {
  const obj = JSON.parse(message);

  const { eventType, mail } = obj;
  const { headers } = mail;

  const engageMessageId = headers.find(header => header.name === 'Engagemessageid');

  const mailId = headers.find(header => header.name === 'Mailmessageid');

  const customerId = headers.find(header => header.name === 'Customerid');

  const mailHeaders = {
    engageMessageId: engageMessageId.value,
    mailId: mailId.value,
    customerId: customerId.value,
  };

  const type = eventType.toLowerCase();

  await EngageMessages.updateStats(engageMessageId.value, type);

  await EngageMessages.changeDeliveryReportStatus(mailHeaders, type);
};

export const trackEngages = expressApp => {
  expressApp.post(`/service/engage/tracker`, (req, res) => {
    const chunks: any = [];

    req.setEncoding('utf8');

    req.on('data', chunk => {
      chunks.push(chunk);
    });

    req.on('end', async () => {
      const message = JSON.parse(chunks.join(''));

      const { Type = '', Message = {}, Token = '', TopicArn = '' } = message;

      if (Type === 'SubscriptionConfirmation') {
        await getApi('sns')
          .confirmSubscription({ Token, TopicArn })
          .promise();

        return res.end('success');
      }

      handleMessage(Message);
    });

    return res.end('success');
  });
};

export const awsRequests = {
  getVerifiedEmails() {
    return getApi('ses')
      .listVerifiedEmailAddresses()
      .promise();
  },
};
