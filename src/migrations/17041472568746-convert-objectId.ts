import { createConnection, Types } from 'mongoose';

module.exports.up = async () => {
  const mongoClient = await createConnection(process.env.MONGO_URL || '', {
    useNewUrlParser: true,
    useCreateIndex: true,
  });

  interface IRelModels {
    coll: string;
    fi: string;
    kind?: string;
  }

  interface IContentTypes {
    coll: string;
    type: string;
  }

  const executer = async (
    mainCollection: string,
    relModels: IRelModels[],
    contentTypes: IContentTypes[],
    conformity: string,
    unique: string = '',
  ) => {
    console.log(mainCollection);
    const objOnDb = mongoClient.db.collection(mainCollection);
    const entries = await objOnDb.find({ oldId: { $exists: false } }).toArray();
    console.log(entries.length);

    for (const entry of entries) {
      const oldId = entry._id;
      let uniqueVal = '';

      const doc = { ...entry, oldId };

      if (unique) {
        uniqueVal = entry[unique];
        delete doc[unique];
      }

      delete doc._id;

      // check duplicate oldId
      const duplicatedNew = await objOnDb.find({ oldId }).toArray();

      let newId = '';

      if (duplicatedNew.length > 0) {
        newId = duplicatedNew[0].oldId;
      } else {
        const response = await objOnDb.insertOne(doc);
        newId = response.insertedId.toString();
      }

      if (!newId) {
        continue;
      }

      if (conformity) {
        await mongoClient.db
          .collection('conformities')
          .updateMany({ $and: [{ mainType: conformity }, { mainTypeId: oldId }] }, { $set: { mainTypeId: newId } });
        await mongoClient.db
          .collection('conformities')
          .updateMany({ $and: [{ relType: conformity }, { relTypeId: oldId }] }, { $set: { relTypeId: newId } });
      }

      if (contentTypes) {
        for (const contentType of contentTypes) {
          const contentTypeColl = mongoClient.db.collection(contentType.coll);

          contentTypeColl.updateMany(
            { contentType: contentType.type, contentTypeId: oldId },
            { $set: { contentTypeId: newId } },
          );
        }
      }

      for (const relModel of relModels) {
        const relCollection = mongoClient.db.collection(relModel.coll);

        switch (relModel.kind) {
          case 'many': {
            const relEntries = await relCollection
              .aggregate([{ $match: { [relModel.fi]: { $in: [oldId] } } }, { $project: { _id: 1, [relModel.fi]: 1 } }])
              .toArray();

            for (const relEntry of relEntries) {
              const oldList = relEntry[relModel.fi];
              const index = oldList.indexOf(oldId);

              if (index !== -1) {
                oldList[index] = newId;
                await relCollection.updateOne({ _id: relEntry._id }, { $set: { [relModel.fi]: oldList } });
              }
            }
            break;
          }

          case 'manyOne': {
            const manyFi = relModel.fi.split('.')[0];
            const oneFi = relModel.fi.split('.')[1];

            const relEntries = await relCollection
              .aggregate([{ $match: { [relModel.fi]: { $in: [oldId] } } }, { $project: { _id: 1, [manyFi]: 1 } }])
              .toArray();

            for (const relEntry of relEntries) {
              const oldList = relEntry[manyFi];

              oldList.forEach((subItem, index) => {
                if (subItem[oneFi] === oldId) {
                  oldList[index][oneFi] = newId;
                }
              });

              await relCollection.updateOne({ _id: relEntry._id }, { $set: { [manyFi]: oldList } });
            }

            break;
          }

          default: {
            await relCollection.updateMany({ [relModel.fi]: oldId }, { $set: { [relModel.fi]: newId } });
            break;
          }
        }
      }

      await objOnDb.deleteOne({ _id: oldId });

      if (unique && uniqueVal) {
        await objOnDb.updateOne({ _id: Types.ObjectId(newId) }, { $set: { [unique]: uniqueVal } });
      }
    }
  };

  const kind = 'many';

  await executer(
    'users',
    [
      { coll: 'brands', fi: 'userId' },
      { coll: 'channels', fi: 'userId' },
      { coll: 'boards', fi: 'userId' },
      { coll: 'pipelines', fi: 'userId' },
      { coll: 'pipelines', fi: 'watchedUserIds', kind },
      { coll: 'stages', fi: 'UserId' },
      { coll: 'deals', fi: 'userId' },
      { coll: 'tasks', fi: 'userId' },
      { coll: 'tickets', fi: 'userId' },
      { coll: 'growth_hacks', fi: 'userId' },
      { coll: 'deals', fi: 'modifiedBy' },
      { coll: 'tasks', fi: 'modifiedBy' },
      { coll: 'tickets', fi: 'modifiedBy' },
      { coll: 'growth_hacks', fi: 'modifiedBy' },
      { coll: 'deals', fi: 'assignedUserIds', kind },
      { coll: 'tasks', fi: 'assignedUserIds', kind },
      { coll: 'tickets', fi: 'assignedUserIds', kind },
      { coll: 'growth_hacks', fi: 'assignedUserIds', kind },
      { coll: 'deals', fi: 'watchedUserIds', kind },
      { coll: 'tasks', fi: 'watchedUserIds', kind },
      { coll: 'tickets', fi: 'watchedUserIds', kind },
      { coll: 'growth_hacks', fi: 'watchedUserIds', kind },
      { coll: 'checklists', fi: 'createdUserId' },
      { coll: 'checklist_items', fi: 'createdUserId' },
      { coll: 'knowledgebase_articles', fi: 'createdBy' },
      { coll: 'knowledgebase_categories', fi: 'createdBy' },
      { coll: 'knowledgebase_topics', fi: 'createdBy' },
      { coll: 'knowledgebase_articles', fi: 'modifiedBy' },
      { coll: 'knowledgebase_categories', fi: 'modifiedBy' },
      { coll: 'knowledgebase_topics', fi: 'modifiedBy' },
      { coll: 'pipeline_labels', fi: 'createdBy' },
      { coll: 'pipeline_templates', fi: 'createdBy' },
      { coll: 'conversation_messages', fi: 'userId' },
      { coll: 'conversation_messages', fi: 'engageData.fromUserId' },
      { coll: 'conversation_messages', fi: 'mentionedUserIds', kind },
      { coll: 'conversations', fi: 'userId' },
      { coll: 'conversations', fi: 'assignedUserId' },
      { coll: 'conversations', fi: 'participatedUserIds', kind },
      { coll: 'conversations', fi: 'readUserIds', kind },
      { coll: 'conversations', fi: 'closedUserId' },
      { coll: 'conversations', fi: 'firstRespondedUserId' },
      { coll: 'email_deliveries', fi: 'userId' },
      { coll: 'engage_messages', fi: 'fromUserId' },
      { coll: 'fields', fi: 'lastUpdatedUserId' },
      { coll: 'fields_groups', fi: 'lastUpdatedUserId' },
      { coll: 'forms', fi: 'createdUserId' },
      { coll: 'growth_hacks', fi: 'votedUserIds', kind },
      { coll: 'import_history', fi: 'userId' },
      { coll: 'integrations', fi: 'createdUserId' },
      { coll: 'internal_notes', fi: 'createdUserId' },
      { coll: 'internal_notes', fi: 'mentionedUserIds', kind },
      { coll: 'permissions', fi: 'userId' },
      { coll: 'onboarding_histories', fi: 'userId' },
    ],
    [{ coll: 'internal_notes', type: 'user' }],
    '',
    'email',
  );

  await executer(
    'brands',
    [
      { coll: 'companies', fi: 'scopeBrandIds', kind },
      { coll: 'conversation_messages', fi: 'brandId' },
      { coll: 'customers', fi: 'scopeBrandIds', kind },
      { coll: 'engage_messages', fi: 'brandIds', kind },
      { coll: 'engage_messages', fi: 'messenger.brandId' },
      { coll: 'integrations', fi: 'brandId' },
      { coll: 'knowledgebase_topics', fi: 'brandId' },
      { coll: 'response_templates', fi: 'brandId' },
      { coll: 'segments', fi: 'conditions.brandId', kind: 'manyOne' },
      { coll: 'users', fi: 'brandIds', kind },
      { coll: 'emailSignature', fi: 'brandId' },
    ],
    [],
    '',
  );

  await executer('activity_logs', [], [], '');

  await executer('channels', [], [{ coll: 'notifications', type: 'channel' }], '');

  await executer('checklist_items', [], [], '');

  await executer('checklists', [{ coll: 'checklist_items', fi: 'checklistId' }], [], '');

  await executer(
    'companies',
    [],
    [
      { coll: 'fields_groups', type: 'company' },
      { coll: 'fields', type: 'company' },
      { coll: 'internal_notes', type: 'company' },
      { coll: 'notifications', type: 'company' },
    ],
    'company',
  );

  await executer('configs', [], [], '');

  await executer('conformities', [], [], '');

  await executer('conversation_messages', [], [], '');

  await executer(
    'conversations',
    [{ coll: 'conversation_messages', fi: 'conversationId' }, { coll: 'users', fi: 'starredConversationIds', kind }],
    [{ coll: 'notifications', type: 'conversation' }],
    '',
  );

  await executer(
    'customers',
    [
      { coll: 'conversation_messages', fi: 'customerId' },
      { coll: 'conversations', fi: 'customerId' },
      { coll: 'engage_messages', fi: 'customerIds', kind },
      { coll: 'engage_messages', fi: 'messengerReceivedCustomerIds', kind },
      { coll: 'forms', fi: 'customerId' },
    ],
    [
      { coll: 'fields_groups', type: 'customer' },
      { coll: 'fields', type: 'customer' },
      { coll: 'internal_notes', type: 'customer' },
      { coll: 'notifications', type: 'customer' },
    ],
    'customer',
  );

  await executer('email_deliveries', [], [], '');

  await executer('email_templates', [{ coll: 'engage_emails', fi: 'templateId' }], [], '');

  await executer('engage_messages', [], [], '');

  await executer('fields', [{ coll: 'pipelines', fi: 'boardId' }], [], '');

  await executer('form_submissions', [], [], '');

  await executer('forms', [], [{ coll: 'fields', type: 'form' }], '');

  await executer('import_history', [], [], '');

  await executer(
    'integrations',
    [
      { coll: 'channels', fi: 'integrationIds', kind },
      { coll: 'conversations', fi: 'integrationId' },
      { coll: 'customers', fi: 'integrationId' },
    ],
    [],
    '',
  );

  await executer('internal_notes', [], [], '');

  await executer('knowledgebase_articles', [{ coll: 'knowledgebase_categories', fi: 'articleIds', kind }], [], '');

  await executer('knowledgebase_categories', [{ coll: 'knowledgebase_topics', fi: 'categoryIds', kind }], [], '');

  await executer('knowledgebase_topics', [{ coll: 'scripts', fi: 'kbTopicId' }], [], '');

  await executer('messenger_apps', [], [], '');

  await executer('notifications', [], [], '');

  await executer('permissions', [], [], '');

  await executer('user_groups', [{ coll: 'permissions', fi: 'groupId' }], [], '', 'name');

  await executer('pipeline_templates', [{ coll: 'pipelines', fi: 'templateId' }], [], '');

  await executer('response_templates', [], [], '');

  await executer('robot_entries', [{ coll: 'robot_entries', fi: 'parentId' }], [], '');

  await executer('onboarding_histories', [], [], '');

  await executer('scripts', [], [], '');

  await executer('segments', [{ coll: 'engage_messages', fi: 'segmentIds', kind }], [], '');

  await executer(
    'tags',
    [
      { coll: 'companies', fi: 'tagIds', kind },
      { coll: 'conversations', fi: 'tagIds', kind },
      { coll: 'customers', fi: 'tagIds', kind },
      { coll: 'products', fi: 'tagIds', kind },
      { coll: 'engages', fi: 'tagIds', kind },
      { coll: 'integrations', fi: 'tagIds', kind },
    ],
    [],
    '',
  );

  await executer('boards', [{ coll: 'pipelines', fi: 'boardId' }], [], '');

  await executer(
    'pipelines',
    [{ coll: 'stages', fi: 'pipelineId' }, { coll: 'pipeline_label', fi: 'pipelineId' }],
    [],
    '',
  );

  await executer(
    'stages',
    [
      { coll: 'deals', fi: 'stageId' },
      { coll: 'tasks', fi: 'stageId' },
      { coll: 'tickets', fi: 'stageId' },
      { coll: 'growth_hacks', fi: 'stageId' },
    ],
    [],
    '',
  );

  await executer(
    'deals',
    [],
    [
      { coll: 'checklists', type: 'deal' },
      { coll: 'internal_notes', type: 'deal' },
      { coll: 'notifications', type: 'deal' },
    ],
    'deal',
  );

  await executer(
    'tickets',
    [],
    [
      { coll: 'checklists', type: 'ticket' },
      { coll: 'internal_notes', type: 'ticket' },
      { coll: 'notifications', type: 'ticket' },
    ],
    'ticket',
  );

  await executer(
    'tasks',
    [],
    [
      { coll: 'checklists', type: 'task' },
      { coll: 'internal_notes', type: 'task' },
      { coll: 'notifications', type: 'task' },
    ],
    'task',
  );

  await executer(
    'growth_hacks',
    [],
    [
      { coll: 'checklists', type: 'growthHack' },
      { coll: 'internal_notes', type: 'growthHack' },
      { coll: 'notifications', type: 'growthHack' },
    ],
    'growthHack',
  );

  await executer('product_categories', [{ coll: 'products', fi: 'categoryId' }], [], '', 'code');

  await executer(
    'products',
    [{ coll: 'deals', fi: 'productsData.productId' }],
    [{ coll: 'fields_groups', type: 'product' }, { coll: 'internal_notes', type: 'product' }],
    '',
  );

  return Promise.resolve('ok');
};
