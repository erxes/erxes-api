import utils from '../data/utils';
import { graphqlRequest } from '../db/connection';
import { conversationFactory, customerFactory, integrationFactory, userFactory } from '../db/factories';
import { Conversations, Customers, Integrations, Users } from '../db/models';

import { IntegrationsAPI } from '../data/dataSources';
import { KIND_CHOICES } from '../db/models/definitions/constants';
import { IConversationDocument } from '../db/models/definitions/conversations';
import { ICustomerDocument } from '../db/models/definitions/customers';
import { IUserDocument } from '../db/models/definitions/users';
import './setup.ts';

const toJSON = value => {
  // sometimes object key order is different even though it has same value.
  return JSON.stringify(value, Object.keys(value).sort());
};

const spy = jest.spyOn(utils, 'sendNotification');

describe('Conversation message mutations', () => {
  let leadConversation: IConversationDocument;
  let user: IUserDocument;
  let customer: ICustomerDocument;
  let context;

  beforeEach(async () => {
    user = await userFactory({});

    const leadIntegration = await integrationFactory({ kind: KIND_CHOICES.LEAD });
    customer = await customerFactory({});

    leadConversation = await conversationFactory({
      integrationId: leadIntegration._id,
      customerId: customer._id,
      assignedUserId: user._id,
    });

    context = {
      user,
      dataSources: {
        IntegrationsAPI: new IntegrationsAPI(),
      },
    };
  });

  afterEach(async () => {
    // Clearing test data
    await Conversations.deleteMany({});
    await Users.deleteMany({});
    await Integrations.deleteMany({});
    await Customers.deleteMany({});

    spy.mockRestore();
  });

  test('Add conversation message', async () => {
    process.env.DEFAULT_EMAIL_SERIVCE = ' ';
    process.env.COMPANY_EMAIL_FROM = ' ';

    const args = {
      conversationId: leadConversation._id,
      content: 'content',
      mentionedUserIds: [user._id],
      internal: false,
      attachments: [{ url: 'url', name: 'name', type: 'doc', size: 10 }],
    };

    const mutation = `
      mutation conversationMessageAdd(
        $conversationId: String
        $content: String
        $mentionedUserIds: [String]
        $internal: Boolean
        $attachments: [AttachmentInput]
      ) {
        conversationMessageAdd(
          conversationId: $conversationId
          content: $content
          mentionedUserIds: $mentionedUserIds
          internal: $internal
          attachments: $attachments
        ) {
          conversationId
          content
          mentionedUserIds
          internal
          attachments {
            url
            name
            type
            size
          }
        }
      }
    `;

    const spySendMobileNotification = jest.spyOn(utils, 'sendMobileNotification').mockReturnValueOnce({});
    const spySendEmail = jest.spyOn(utils, 'sendEmail').mockReturnValueOnce({});

    const leadMessage = await graphqlRequest(mutation, 'conversationMessageAdd', args, context);

    const calledArgs = spySendMobileNotification.mock.calls[0][0];
    expect(calledArgs.title).toBe('Conversation updated');
    expect(calledArgs.body).toBe(args.content);
    expect(calledArgs.receivers).toEqual([leadConversation.assignedUserId]);
    expect(calledArgs.customerId).toEqual(leadConversation.customerId);

    const spySendEmailCalledArgs = spySendEmail.mock.calls[0][0];
    expect(spySendEmailCalledArgs.title).toBe('Reply');
    expect(spySendEmailCalledArgs.toEmails[0]).toBe(customer.primaryEmail);
    expect(spySendEmailCalledArgs.template.data).toBe(args.content);

    expect(leadMessage.content).toBe(args.content);
    expect(leadMessage.attachments[0]).toEqual({ url: 'url', name: 'name', type: 'doc', size: 10 });
    expect(toJSON(leadMessage.mentionedUserIds)).toEqual(toJSON(args.mentionedUserIds));
    expect(leadMessage.internal).toBe(args.internal);
  });

  test('Add conversation reply facebook comment (Connection failed)', async () => {
    process.env.INTEGRATIONS_API_DOMAIN = '';

    const args = {
      conversationId: leadConversation._id,
      commentId: 'commentId',
      content: 'content',
    };

    const mutation = `
      mutation conversationsReplyFacebookComment(
        $conversationId: String
        $commentId: String
        $content: String
      ) {
        conversationsReplyFacebookComment(
          conversationId: $conversationId
          commentId: $commentId
          content: $content
        ) {
          conversationId
        }
      }
    `;

    try {
      await graphqlRequest(mutation, 'conversationsReplyFacebookComment', args, context);
    } catch (e) {
      expect(e[0].message).toEqual('Connection failed');
    }
  });

  test('Assign conversation', async () => {
    process.env.DEFAULT_EMAIL_SERIVCE = ' ';
    process.env.COMPANY_EMAIL_FROM = ' ';

    const args = {
      conversationIds: [leadConversation._id],
      assignedUserId: user._id,
    };

    const mutation = `
      mutation conversationsAssign(
        $conversationIds: [String]!
        $assignedUserId: String
      ) {
        conversationsAssign(
          conversationIds: $conversationIds
          assignedUserId: $assignedUserId
        ) {
          assignedUser {
            _id
          }
        }
      }
    `;

    const [conversation] = await graphqlRequest(mutation, 'conversationsAssign', args, context);

    expect(conversation.assignedUser._id).toEqual(args.assignedUserId);
  });

  test('Unassign conversation', async () => {
    const mutation = `
      mutation conversationsUnassign($_ids: [String]!) {
        conversationsUnassign(_ids: $_ids) {
          assignedUser {
            _id
          }
        }
      }
    `;

    const [conversation] = await graphqlRequest(
      mutation,
      'conversationsUnassign',
      {
        _ids: [leadConversation._id],
      },
      { user },
    );

    expect(conversation.assignedUser).toBe(null);
  });

  test('Change conversation status', async () => {
    process.env.DEFAULT_EMAIL_SERIVCE = ' ';
    process.env.COMPANY_EMAIL_FROM = ' ';

    const args = {
      _ids: [leadConversation._id],
      status: 'closed',
    };

    const mutation = `
      mutation conversationsChangeStatus($_ids: [String]!, $status: String!) {
        conversationsChangeStatus(_ids: $_ids, status: $status) {
          status
        }
      }
    `;

    const [conversation] = await graphqlRequest(mutation, 'conversationsChangeStatus', args);

    expect(conversation.status).toEqual(args.status);
  });

  test('Mark conversation as read', async () => {
    process.env.DEFAULT_EMAIL_SERIVCE = ' ';
    process.env.COMPANY_EMAIL_FROM = ' ';

    const mutation = `
      mutation conversationMarkAsRead($_id: String) {
        conversationMarkAsRead(_id: $_id) {
          _id
          readUserIds
        }
      }
    `;

    const conversation = await graphqlRequest(
      mutation,
      'conversationMarkAsRead',
      { _id: leadConversation._id },
      context,
    );

    expect(conversation.readUserIds).toContain(user._id);
  });
});
