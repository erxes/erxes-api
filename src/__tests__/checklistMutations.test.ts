import { graphqlRequest } from '../db/connection';
import {
  checklistFactory,
  checklistItemFactory,
  dealFactory,
  pipelineFactory,
  stageFactory,
  userFactory,
} from '../db/factories';
import { ChecklistItems, Checklists, Notifications, Users } from '../db/models';

import './setup.ts';

describe('Checklists mutations', () => {
  let _user;
  let _checklist;
  let _checklistItem;
  let context;

  beforeEach(async () => {
    // Creating test data
    _user = await userFactory({});
    _checklist = await checklistFactory({});
    _checklistItem = await checklistItemFactory({ checklistId: _checklist._id });

    context = { user: _user };
  });

  afterEach(async () => {
    // Clearing test data
    await ChecklistItems.deleteMany({});
    await Checklists.deleteMany({});
    await Users.deleteMany({});
  });

  test('Add checklist', async () => {
    const user = await userFactory({});
    const pipeline = await pipelineFactory({});
    const stage = await stageFactory({ pipelineId: pipeline._id });
    const deal = await dealFactory({ stageId: stage._id, assignedUserIds: [user._id] });

    if (!user || !user.details) {
      throw new Error('User not found');
    }

    const args = {
      contentType: 'deal',
      contentTypeId: deal._id,
      title: `Checklist title`,
    };

    const mutation = `
      mutation checklistsAdd(
        $contentType: String
        $contentTypeId: String
        $title: String
      ) {
        checklistsAdd(
          contentType: $contentType
          contentTypeId: $contentTypeId
          title: $title
        ) {
          contentType
          contentTypeId
          title
        }
      }
    `;

    const checklist = await graphqlRequest(mutation, 'checklistsAdd', args, context);

    const notification = await Notifications.findOne({ receiver: user._id });

    if (!notification) {
      throw new Error('Notification not found');
    }

    expect(notification).toBeDefined();

    expect(checklist.contentType).toBe(args.contentType);
    expect(checklist.contentTypeId).toBe(args.contentTypeId);
    expect(checklist.title).toBe(args.title);
  });

  test('Add checklist item', async () => {
    const user = await userFactory({});
    const pipeline = await pipelineFactory({});
    const stage = await stageFactory({ pipelineId: pipeline._id });
    const deal = await dealFactory({ stageId: stage._id });
    const checklist = await checklistFactory({ contentType: 'deal', contentTypeId: deal._id });

    if (!user || !user.details) {
      throw new Error('User not found');
    }

    const args = {
      checklistId: checklist._id,
      isChecked: false,
      content: `@${user.details.fullName}`,
      mentionedUserIds: user._id,
      order: 1,
    };

    const mutation = `
      mutation checklistItemsAdd(
        $checklistId: String,
        $isChecked: Boolean,
        $content: String,
        $mentionedUserIds: [String],
        $order: Int
      ) {
        checklistItemsAdd(
          checklistId: $checklistId,
          isChecked: $isChecked,
          content: $content,
          mentionedUserIds: $mentionedUserIds,
          order: $order
        ) {
          _id
          isChecked
          content
          order
        }
      }
    `;

    const checklistItem = await graphqlRequest(mutation, 'checklistItemsAdd', args, context);

    const notification = await Notifications.findOne({ receiver: user._id });

    if (!notification) {
      throw new Error('Notification not found');
    }

    expect(notification).toBeDefined();

    expect(checklistItem.content).toBe(args.content);
    expect(checklistItem.isChecked).toBe(args.isChecked);
    expect(checklistItem.order).toBe(args.order);
  });

  test('Edit checklist', async () => {
    const { _id, title } = _checklist;
    const args = { _id, title };

    const mutation = `
      mutation checklistsEdit(
        $_id: String!
        $title: String
      ) {
        checklistsEdit(
          _id: $_id
          title: $title
        ) {
          _id
          title
        }
      }
    `;

    const checklist = await graphqlRequest(mutation, 'checklistsEdit', args, context);

    expect(checklist._id).toBe(args._id);
    expect(checklist.title).toBe(args.title);
  });

  test('Edit checklist item', async () => {
    const { _id, content, isChecked } = _checklistItem;
    const args = { _id, content, isChecked };

    const mutation = `
      mutation checklistItemsEdit(
        $_id: String!
        $content: String
        $isChecked: Boolean
      ) {
        checklistItemsEdit(
          _id: $_id
          content: $content
          isChecked: $isChecked
        ) {
          _id
          content
          isChecked
        }
      }
    `;

    const checklist = await graphqlRequest(mutation, 'checklistItemsEdit', args, context);

    expect(checklist._id).toBe(args._id);
    expect(checklist.content).toBe(args.content);
    expect(checklist.isChecked).toBe(args.isChecked);
  });

  test('Remove checklist', async () => {
    await checklistItemFactory({ checklistId: _checklist._id });
    const mutation = `
      mutation checklistsRemove($_id: String!) {
        checklistsRemove(_id: $_id) {
          _id
        }
      }
    `;

    await graphqlRequest(mutation, 'checklistsRemove', { _id: _checklist._id }, context);

    expect(await Checklists.findOne({ _id: _checklist._id })).toBe(null);
    expect(await ChecklistItems.find({ checklistId: _checklist._id })).toEqual([]);
  });

  test('Remove checklist item', async () => {
    const mutation = `
      mutation checklistItemsRemove($_id: String!) {
        checklistItemsRemove(_id: $_id) {
          _id
        }
      }
    `;

    await graphqlRequest(mutation, 'checklistItemsRemove', { _id: _checklistItem._id }, context);

    expect(await ChecklistItems.findOne({ _id: _checklistItem._id })).toBe(null);
  });

  test('update order items', async () => {
    const item1 = await checklistItemFactory({ checklistId: _checklist._id, order: 3 });
    const item2 = await checklistItemFactory({ checklistId: _checklist._id, order: 4 });
    const item3 = await checklistItemFactory({ checklistId: _checklist._id, order: 5 });

    const args = {
      orders: [
        { _id: item2._id, order: 0 },
        { _id: item3._id, order: 1 },
        { _id: item1._id, order: 2 },
        { _id: _checklistItem._id, order: 3 },
      ],
    };

    const mutation = `
      mutation updateOrderItems(
        $orders: [OrderInput]
      ) {
        updateOrderItems (
          orders: $orders
        ) {
          _id
        }
      }
    `;

    await graphqlRequest(mutation, 'updateOrderItems', args, context);

    const items = await ChecklistItems.find({ checklistId: _checklist._id }).sort({ order: 1 });
    expect(items[0]._id).toEqual(item2._id);
    expect(items[1]._id).toEqual(item3._id);
    expect(items[2]._id).toEqual(item1._id);
    expect(items[3]._id).toEqual(_checklistItem._id);
  });
});
