import { KnowledgeBaseArticles, KnowledgeBaseCategories, KnowledgeBaseTopics } from '../../../db/models';
import { ITopic } from '../../../db/models/definitions/knowledgebase';
import { IArticleCreate, ICategoryCreate } from '../../../db/models/KnowledgeBase';
import { MODULE_NAMES } from '../../constants';
import { moduleCheckPermission } from '../../permissions/wrappers';
import { IContext } from '../../types';
import { putCreateLog, putDeleteLog, putUpdateLog } from '../../utils';
import { gatherKbCategoryFieldNames, gatherKbTopicFieldNames, gatherUsernames, LogDesc } from './logUtils';

const knowledgeBaseMutations = {
  /**
   * Create topic document
   */
  async knowledgeBaseTopicsAdd(_root, { doc }: { doc: ITopic }, { user, docModifier }: IContext) {
    const topic = await KnowledgeBaseTopics.createDoc(docModifier(doc), user._id);

    const extraDesc: LogDesc[] = await gatherKbTopicFieldNames(topic);

    await putCreateLog(
      {
        type: MODULE_NAMES.KB_TOPIC,
        newData: JSON.stringify({ ...doc, createdBy: user._id, createdDate: topic.createdDate }),
        object: topic,
        description: `"${topic.title}" has been created`,
        extraDesc: JSON.stringify(extraDesc),
      },
      user,
    );

    return topic;
  },

  /**
   * Updates a topic document
   */
  async knowledgeBaseTopicsEdit(_root, { _id, doc }: { _id: string; doc: ITopic }, { user }: IContext) {
    const topic = await KnowledgeBaseTopics.getTopic(_id);
    const updated = await KnowledgeBaseTopics.updateDoc(_id, doc, user._id);

    let extraDesc: LogDesc[] = await gatherKbTopicFieldNames(topic);

    extraDesc = await gatherKbTopicFieldNames(updated, extraDesc);

    await putUpdateLog(
      {
        type: MODULE_NAMES.KB_TOPIC,
        object: topic,
        newData: JSON.stringify({ ...doc, modifiedBy: user._id, modifiedDate: updated.modifiedDate }),
        description: `"${topic.title}" has been edited`,
        extraDesc: JSON.stringify(extraDesc),
      },
      user,
    );

    return updated;
  },

  /**
   * Remove topic document
   */
  async knowledgeBaseTopicsRemove(_root, { _id }: { _id: string }, { user }: IContext) {
    const topic = await KnowledgeBaseTopics.getTopic(_id);
    const removed = await KnowledgeBaseTopics.removeDoc(_id);

    const extraDesc: LogDesc[] = await gatherKbTopicFieldNames(topic);

    await putDeleteLog(
      {
        type: MODULE_NAMES.KB_TOPIC,
        object: topic,
        description: `"${topic.title}" has been removed`,
        extraDesc: JSON.stringify(extraDesc),
      },
      user,
    );

    return removed;
  },

  /**
   * Create category document
   */
  async knowledgeBaseCategoriesAdd(_root, { doc }: { doc: ICategoryCreate }, { user }: IContext) {
    const kbCategory = await KnowledgeBaseCategories.createDoc(doc, user._id);

    const extraDesc: LogDesc[] = [{ createdBy: user._id, name: user.username || user.email }];

    if (doc.topicIds && doc.topicIds.length > 0) {
      const topics = await KnowledgeBaseTopics.find({ _id: { $in: doc.topicIds } }, { title: 1 });

      for (const topic of topics) {
        extraDesc.push({ topicIds: topic._id, name: topic.title });
      }
    }

    await putCreateLog(
      {
        type: MODULE_NAMES.KB_CATEGORY,
        newData: JSON.stringify({ ...doc, createdBy: user._id, createdDate: kbCategory.createdDate }),
        description: `"${kbCategory.title}" has been created`,
        object: kbCategory,
        extraDesc: JSON.stringify(extraDesc),
      },
      user,
    );

    return kbCategory;
  },

  /**
   * Update category document
   */
  async knowledgeBaseCategoriesEdit(_root, { _id, doc }: { _id: string; doc: ICategoryCreate }, { user }: IContext) {
    const kbCategory = await KnowledgeBaseCategories.getCategory(_id);
    const updated = await KnowledgeBaseCategories.updateDoc(_id, doc, user._id);

    let extraDesc: LogDesc[] = await gatherKbCategoryFieldNames(kbCategory);

    extraDesc = await gatherKbCategoryFieldNames(updated, extraDesc);

    await putUpdateLog(
      {
        type: MODULE_NAMES.KB_CATEGORY,
        object: kbCategory,
        newData: JSON.stringify({ ...doc, modifiedBy: user._id, modifiedDate: updated.modifiedDate }),
        description: `"${kbCategory.title}" has been edited`,
        extraDesc: JSON.stringify(extraDesc),
      },
      user,
    );

    return updated;
  },

  /**
   * Remove category document
   */
  async knowledgeBaseCategoriesRemove(_root, { _id }: { _id: string }, { user }: IContext) {
    const kbCategory = await KnowledgeBaseCategories.getCategory(_id);

    const removed = await KnowledgeBaseCategories.removeDoc(_id);

    const extraDesc: LogDesc[] = await gatherKbCategoryFieldNames(kbCategory);

    await putDeleteLog(
      {
        type: MODULE_NAMES.KB_CATEGORY,
        object: kbCategory,
        description: `"${kbCategory.title}" has been removed`,
        extraDesc: JSON.stringify(extraDesc),
      },
      user,
    );

    return removed;
  },

  /**
   * Create article document
   */
  async knowledgeBaseArticlesAdd(_root, { doc }: { doc: IArticleCreate }, { user }: IContext) {
    const kbArticle = await KnowledgeBaseArticles.createDoc(doc, user._id);

    const extraDesc: LogDesc[] = [{ createdBy: user._id, name: user.username || user.email }];

    await putCreateLog(
      {
        type: MODULE_NAMES.KB_ARTICLE,
        newData: JSON.stringify({ ...doc, createdBy: user._id, createdDate: kbArticle.createdDate }),
        description: `"${kbArticle.title}" has been created`,
        object: kbArticle,
        extraDesc: JSON.stringify(extraDesc),
      },
      user,
    );

    return kbArticle;
  },

  /**
   * Update article document
   */
  async knowledgeBaseArticlesEdit(_root, { _id, doc }: { _id: string; doc: IArticleCreate }, { user }: IContext) {
    const kbArticle = await KnowledgeBaseArticles.getArticle(_id);
    const updated = await KnowledgeBaseArticles.updateDoc(_id, doc, user._id);

    let extraDesc: LogDesc[] = [{ modifiedBy: user._id, name: user.username || user.email }];

    extraDesc = await gatherUsernames({
      idFields: [kbArticle.createdBy],
      foreignKey: 'createdBy',
      prevList: extraDesc,
    });

    await putUpdateLog(
      {
        type: MODULE_NAMES.KB_ARTICLE,
        object: kbArticle,
        newData: JSON.stringify({ ...doc, modifiedBy: user._id, modifiedDate: updated.modifiedDate }),
        description: `"${kbArticle.title}" has been edited`,
        extraDesc: JSON.stringify(extraDesc),
      },
      user,
    );

    return updated;
  },

  /**
   * Remove article document
   */
  async knowledgeBaseArticlesRemove(_root, { _id }: { _id: string }, { user }: IContext) {
    const kbArticle = await KnowledgeBaseArticles.getArticle(_id);
    const removed = await KnowledgeBaseArticles.removeDoc(_id);

    let extraDesc: LogDesc[] = await gatherUsernames({
      idFields: [kbArticle.createdBy],
      foreignKey: 'createdBy',
    });

    if (kbArticle.modifiedBy) {
      extraDesc = await gatherUsernames({
        idFields: [kbArticle.modifiedBy],
        foreignKey: 'modifiedBy',
        prevList: extraDesc,
      });
    }

    await putDeleteLog(
      {
        type: MODULE_NAMES.KB_ARTICLE,
        object: kbArticle,
        description: `"${kbArticle.title}" has been removed`,
        extraDesc: JSON.stringify(extraDesc),
      },
      user,
    );

    return removed;
  },
};

moduleCheckPermission(knowledgeBaseMutations, 'manageKnowledgeBase');

export default knowledgeBaseMutations;
