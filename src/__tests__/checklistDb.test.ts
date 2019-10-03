import * as faker from 'faker';
import { checklistFactory, checklistItemFactory, dealFactory, userFactory } from '../db/factories';
import { ChecklistItems, Checklists, Users } from '../db/models';
import { ACTIVITY_CONTENT_TYPES } from '../db/models/definitions/constants';

import './setup.ts';

/*
 * Generate test data
 */
const generateData = () => ({
  contentType: 'deal',
  contentTypeId: 'DFDFAFSFSDDSF',
  title: faker.random.word(),
});

const generateItemData = checklistId => ({
  checklistId,
  content: faker.random.word(),
  isChecked: false,
  order: 0,
});

/*
 * Check values
 */
const checkValues = (checklistObj, doc) => {
  expect(checklistObj.contentType).toBe(doc.contentType);
  expect(checklistObj.contentTypeId).toBe(doc.contentTypeId);
  expect(checklistObj.title).toBe(doc.title);
};

describe('Checklists model test', () => {
  let _user;
  let _checklist;
  let _checklistItem;

  beforeEach(async () => {
    // Creating test data
    _user = await userFactory({});
    _checklist = await checklistFactory({});
    _checklistItem = await checklistItemFactory({ checklistId: _checklist._id });
  });

  afterEach(async () => {
    // Clearing test data
    await ChecklistItems.deleteMany({});
    await Checklists.deleteMany({});
    await Users.deleteMany({});
  });

  test('Create Checklist, item', async () => {
    // valid
    const doc = generateData();

    const checklistObj = await Checklists.createChecklist(doc, _user);

    checkValues(checklistObj, doc);
    expect(checklistObj.createdUserId).toBe(_user._id);

    const docItem = generateItemData(checklistObj._id);

    const checklistItemObj = await ChecklistItems.createChecklistItem(docItem, _user);

    checkValues(checklistItemObj, docItem);
    expect(checklistItemObj.createdUserId).toBe(_user._id);
  });

  test('Edit checklist, item valid', async () => {
    const doc = generateData();

    const checklistObj = await Checklists.updateChecklist(_checklist._id, doc);

    const docItem = generateItemData(checklistObj._id);
    const checklistItemObj = await ChecklistItems.updateChecklistItem(_checklistItem._id, docItem);

    checkValues(checklistObj, doc);
    checkValues(checklistItemObj, docItem);
  });

  test('Remove checklist and item valid', async () => {
    try {
      await Checklists.removeChecklist('DFFFDSFD');
    } catch (e) {
      expect(e.message).toBe('Checklist not found with id DFFFDSFD');
    }

    try {
      await ChecklistItems.removeChecklistItem('DFFFDSFD');
    } catch (e) {
      expect(e.message).toBe("Checklist's item not found with id DFFFDSFD");
    }

    let count = await Checklists.find({ _id: _checklist._id }).countDocuments();

    await checklistItemFactory({ checklistId: _checklist._id });
    await checklistItemFactory({ checklistId: _checklist._id });

    let itemCount = await ChecklistItems.find({ checklistId: _checklist._id }).countDocuments();
    expect(count).toBe(1);
    expect(itemCount).toBe(3);

    await ChecklistItems.removeChecklistItem(_checklistItem._id);

    itemCount = await ChecklistItems.find({ checklistId: _checklist._id }).countDocuments();
    expect(itemCount).toBe(2);

    await Checklists.removeChecklist(_checklist._id);

    count = await Checklists.find({ _id: _checklist._id }).countDocuments();
    itemCount = await ChecklistItems.find({ checklistId: _checklist._id }).countDocuments();
    expect(count).toBe(0);
    expect(itemCount).toBe(0);
  });

  test('remove Deal and to remove Checklists', async () => {
    const deal = await dealFactory({});

    const checklist = await checklistFactory({
      contentType: ACTIVITY_CONTENT_TYPES.DEAL,
      contentTypeId: deal._id,
    });

    await checklistItemFactory({ checklistId: checklist._id });

    await Checklists.removeChecklists(ACTIVITY_CONTENT_TYPES.DEAL, deal._id);

    const checklists = await Checklists.find({
      contentType: ACTIVITY_CONTENT_TYPES.DEAL,
      contentTypeId: deal._id,
    });

    const checklistItems = await ChecklistItems.find({ checklistId: checklist._id });

    expect(checklists).toHaveLength(0);
    expect(checklistItems).toHaveLength(0);
  });

  test('getChecklistsState', async () => {
    const deal = await dealFactory({});
    const checklist = await checklistFactory({ contentType: ACTIVITY_CONTENT_TYPES.DEAL, contentTypeId: deal._id });
    await checklistItemFactory({ checklistId: checklist._id, isChecked: true });
    await checklistItemFactory({ checklistId: checklist._id, isChecked: true });
    await checklistItemFactory({ checklistId: checklist._id });

    const state = await Checklists.getChecklistsState(ACTIVITY_CONTENT_TYPES.DEAL, deal._id);

    expect(state).toEqual({ complete: 2, all: 3 });
  });

  test('updateOrder items', async () => {
    const checklist = await checklistFactory({});
    const item0 = await checklistItemFactory({ checklistId: checklist._id, order: 0 });
    const item1 = await checklistItemFactory({ checklistId: checklist._id, order: 1 });
    const item2 = await checklistItemFactory({ checklistId: checklist._id, order: 2 });

    await Checklists.updateOrderItems([
      { _id: item2._id, order: 0 },
      { _id: item0._id, order: 1 },
      { _id: item1._id, order: 2 },
    ]);

    const items = await ChecklistItems.find({ checklistId: checklist._id }).sort({ order: 1 });

    expect(items[0]._id).toEqual(item2._id);
    expect(items[1]._id).toEqual(item0._id);
    expect(items[2]._id).toEqual(item1._id);
  });
});
