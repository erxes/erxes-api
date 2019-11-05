import * as mongoose from 'mongoose';

module.exports.up = async () => {
  const mongoClient = await mongoose.createConnection(process.env.MONGO_URL || '', {
    useNewUrlParser: true,
    useCreateIndex: true,
  });

  const executer = async (objOnDb, relModels, contentTypes, conformity = '') => {
    const entries = await objOnDb.find().toArray();

    for (const entry of entries) {
      console.log('************************************************');
      const oldId = entry._id;

      const doc = { ...entry, oldId };
      delete doc._id;
      const response = await objOnDb.insertOne(doc);

      if (!response.insertedId) {
        continue;
      }

      const newId = response.insertedId.toString();

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
          contentType.coll.updateMany(
            { contentType: contentType.type, contentTypeId: oldId },
            { $set: { contentTypeId: newId } },
          );
        }
      }

      for (const relModel of relModels) {
        if (relModel.isMany) {
          const relEntries = await relModel.find({ [relModel.fi]: { $in: oldId } }, { _id: 1, [relModel.fi]: 1 });

          for (const relEntry of relEntries) {
            const oldList = relEntry[relModel.fi];
            const index = oldList.indexof(oldId);

            if (index !== -1) {
              oldList[index] = newId;
              await relModel.coll.updateOne({ _id: relEntry._id }, { $set: { [relModel.fi]: oldList } });
            }
          }
        } else {
          await relModel.coll.updateMany({ [relModel.fi]: oldId }, { $set: { [relModel.fi]: newId } });
        }
      }

      await objOnDb.deleteOne({ _id: oldId });
    }
  };

  const isMany = true;

  await executer(
    mongoClient.db.collection('users'),
    [
      { coll: mongoClient.db.collection('brands'), fi: 'userId' },
      { coll: mongoClient.db.collection('channels'), fi: 'userId' },
      { coll: mongoClient.db.collection('boards'), fi: 'userId' },
      { coll: mongoClient.db.collection('pipelines'), fi: 'userId', isMany },
      { coll: mongoClient.db.collection('pipelines'), fi: 'watchedUserIds', isMany },
      { coll: mongoClient.db.collection('stages'), fi: 'UserId' },
      { coll: mongoClient.db.collection('deals'), fi: 'userId' },
      { coll: mongoClient.db.collection('tasks'), fi: 'userId' },
      { coll: mongoClient.db.collection('tickets'), fi: 'userId' },
      { coll: mongoClient.db.collection('growth_hacks'), fi: 'userId' },
      { coll: mongoClient.db.collection('deals'), fi: 'modifiedBy' },
      { coll: mongoClient.db.collection('tasks'), fi: 'modifiedBy' },
      { coll: mongoClient.db.collection('tickets'), fi: 'modifiedBy' },
      { coll: mongoClient.db.collection('growth_hacks'), fi: 'modifiedBy' },
      { coll: mongoClient.db.collection('deals'), fi: 'assignedUserIds', isMany },
      { coll: mongoClient.db.collection('tasks'), fi: 'assignedUserIds', isMany },
      { coll: mongoClient.db.collection('tickets'), fi: 'assignedUserIds', isMany },
      { coll: mongoClient.db.collection('growth_hacks'), fi: 'assignedUserIds', isMany },
      { coll: mongoClient.db.collection('deals'), fi: 'watchedUserIds', isMany },
      { coll: mongoClient.db.collection('tasks'), fi: 'watchedUserIds', isMany },
      { coll: mongoClient.db.collection('tickets'), fi: 'watchedUserIds', isMany },
      { coll: mongoClient.db.collection('growth_hacks'), fi: 'watchedUserIds', isMany },
      { coll: mongoClient.db.collection('checklists'), fi: 'createdUserId' },
      { coll: mongoClient.db.collection('checklist_items'), fi: 'createdUserId' },
      { coll: mongoClient.db.collection('knowledgebase_articles'), fi: 'createdBy' },
      { coll: mongoClient.db.collection('knowledgebase_categories'), fi: 'createdBy' },
      { coll: mongoClient.db.collection('knowledgebase_topics'), fi: 'createdBy' },
      { coll: mongoClient.db.collection('knowledgebase_articles'), fi: 'modifiedBy' },
      { coll: mongoClient.db.collection('knowledgebase_categories'), fi: 'modifiedBy' },
      { coll: mongoClient.db.collection('knowledgebase_topics'), fi: 'modifiedBy' },
      { coll: mongoClient.db.collection('pipeline_labels'), fi: 'createdBy' },
      { coll: mongoClient.db.collection('pipeline_templates'), fi: 'createdBy' },
      { coll: mongoClient.db.collection('conversation_messages'), fi: 'userId' },
      { coll: mongoClient.db.collection('conversation_messages'), fi: 'engageData.fromUserId' },
      { coll: mongoClient.db.collection('conversation_messages'), fi: 'mentionedUserIds', isMany },
      { coll: mongoClient.db.collection('conversations'), fi: 'userId' },
      { coll: mongoClient.db.collection('conversations'), fi: 'assignedUserId' },
      { coll: mongoClient.db.collection('conversations'), fi: 'participatedUserIds', isMany },
      { coll: mongoClient.db.collection('conversations'), fi: 'readUserIds', isMany },
      { coll: mongoClient.db.collection('conversations'), fi: 'closedUserId' },
      { coll: mongoClient.db.collection('conversations'), fi: 'firstRespondedUserId' },
      { coll: mongoClient.db.collection('email_deliveries'), fi: 'userId' },
      { coll: mongoClient.db.collection('engage_messages'), fi: 'fromUserId' },
      { coll: mongoClient.db.collection('fields'), fi: 'lastUpdatedUserId' },
      { coll: mongoClient.db.collection('fields_groups'), fi: 'lastUpdatedUserId' },
      { coll: mongoClient.db.collection('forms'), fi: 'createdUserId' },
      { coll: mongoClient.db.collection('growth_hacks'), fi: 'votedUserIds', isMany },
      { coll: mongoClient.db.collection('import_history'), fi: 'userId' },
      { coll: mongoClient.db.collection('integrations'), fi: 'createdUserId' },
      { coll: mongoClient.db.collection('internal_notes'), fi: 'createdUserId' },
      { coll: mongoClient.db.collection('internal_notes'), fi: 'mentionedUserIds', isMany },
      { coll: mongoClient.db.collection('permissions'), fi: 'userId' },
      { coll: mongoClient.db.collection('onboarding_histories'), fi: 'userId' },
    ],
    [],
    '',
  );

  await executer(
    mongoClient.db.collection('brands'),
    [
      { coll: mongoClient.db.collection('companies'), fi: 'scopeBrandIds', isMany },
      { coll: mongoClient.db.collection('conversation_messages'), fi: 'brandId' },
      { coll: mongoClient.db.collection('customers'), fi: 'scopeBrandIds', isMany },
      { coll: mongoClient.db.collection('engage_messages'), fi: 'brandIds', isMany },
      { coll: mongoClient.db.collection('engage_messages'), fi: 'messenger.brandId' },
      { coll: mongoClient.db.collection('integrations'), fi: 'brandId' },
      { coll: mongoClient.db.collection('knowledgebase_topics'), fi: 'brandId' },
      { coll: mongoClient.db.collection('response_templates'), fi: 'brandId' },
      { coll: mongoClient.db.collection('segments'), fi: 'brandId' },
      { coll: mongoClient.db.collection('users'), fi: 'brandIds', isMany },
      { coll: mongoClient.db.collection('emailSignature'), fi: 'brandId' },
    ],
    [],
    '',
  );

  await executer(mongoClient.db.collection('activity_logs'), [], [], '');

  await executer(mongoClient.db.collection('channels'), [], [], '');

  await executer(mongoClient.db.collection('checklist_items'), [], [], '');

  await executer(
    mongoClient.db.collection('checklists'),
    [{ coll: mongoClient.db.collection('checklist_items'), fi: 'checklistId' }],
    [],
    '',
  );

  await executer(
    mongoClient.db.collection('companies'),
    [],
    [
      { coll: mongoClient.db.collection('fields_groups'), type: 'company' },
      { coll: mongoClient.db.collection('fields'), type: 'company' },
    ],
    'company',
  );

  await executer(mongoClient.db.collection('configs'), [], [], '');

  await executer(mongoClient.db.collection('conformities'), [], [], '');

  await executer(mongoClient.db.collection('conversation_messages'), [], [], '');

  await executer(
    mongoClient.db.collection('conversations'),
    [
      { coll: mongoClient.db.collection('conversation_messages'), fi: 'conversationId' },
      { coll: mongoClient.db.collection('users'), fi: 'starredConversationIds', isMany },
    ],
    [],
    '',
  );

  await executer(
    mongoClient.db.collection('customers'),
    [
      { coll: mongoClient.db.collection('conversation_messages'), fi: 'customerId' },
      { coll: mongoClient.db.collection('conversations'), fi: 'customerId' },
      { coll: mongoClient.db.collection('engage_messages'), fi: 'customerIds', isMany },
      { coll: mongoClient.db.collection('engage_messages'), fi: 'messengerReceivedCustomerIds', isMany },
      { coll: mongoClient.db.collection('forms'), fi: 'customerId' },
    ],
    [
      { coll: mongoClient.db.collection('fields_groups'), type: 'customer' },
      { coll: mongoClient.db.collection('fields'), type: 'customer' },
    ],
    'customer',
  );

  await executer(mongoClient.db.collection('email_deliveries'), [], [], '');

  await executer(
    mongoClient.db.collection('email_templates'),
    [{ coll: mongoClient.db.collection('engage_emails'), fi: 'templateId' }],
    [],
    '',
  );

  await executer(mongoClient.db.collection('engage_messages'), [], [], '');

  await executer(
    mongoClient.db.collection('fields'),
    [{ coll: mongoClient.db.collection('pipelines'), fi: 'boardId' }],
    [],
    '',
  );

  await executer(mongoClient.db.collection('form_submissions'), [], [], '');

  await executer(
    mongoClient.db.collection('forms'),
    [],
    [{ coll: mongoClient.db.collection('fields'), type: 'form' }],
    '',
  );

  await executer(
    mongoClient.db.collection('boards'),
    [{ coll: mongoClient.db.collection('pipelines'), fi: 'boardId' }],
    [],
    '',
  );

  await executer(
    mongoClient.db.collection('pipelines'),
    [
      { coll: mongoClient.db.collection('stages'), fi: 'pipelineId' },
      { coll: mongoClient.db.collection('pipeline_label'), fi: 'pipelineId' },
    ],
    [],
    '',
  );

  await executer(
    mongoClient.db.collection('stages'),
    [
      { coll: mongoClient.db.collection('deals'), fi: 'stageId' },
      { coll: mongoClient.db.collection('tasks'), fi: 'stageId' },
      { coll: mongoClient.db.collection('tickets'), fi: 'stageId' },
      { coll: mongoClient.db.collection('growth_hacks'), fi: 'stageId' },
    ],
    [],
    '',
  );

  await executer(
    mongoClient.db.collection('deals'),
    [],
    [{ coll: mongoClient.db.collection('checklists'), type: 'deal' }],
    'deal',
  );

  await executer(
    mongoClient.db.collection('tickets'),
    [],
    [{ coll: mongoClient.db.collection('checklists'), type: 'ticket' }],
    'ticket',
  );

  await executer(
    mongoClient.db.collection('tasks'),
    [],
    [{ coll: mongoClient.db.collection('checklists'), type: 'task' }],
    'task',
  );

  await executer(
    mongoClient.db.collection('growth_hacks'),
    [],
    [{ coll: mongoClient.db.collection('checklists'), type: 'growthHack' }],
    'growthHack',
  );

  await executer(
    mongoClient.db.collection('product_categories'),
    [{ coll: mongoClient.db.collection('products'), fi: 'categoryId' }],
    [],
    '',
  );

  await executer(
    mongoClient.db.collection('products'),
    [{ coll: mongoClient.db.collection('deals'), fi: 'productsData.productId' }],
    [{ coll: mongoClient.db.collection('fields_groups'), type: 'product' }],
    '',
  );

  return Promise.resolve('ok');
};
