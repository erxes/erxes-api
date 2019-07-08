import { KnowledgeBaseArticles, KnowledgeBaseCategories, KnowledgeBaseTopics } from '../../../db/models';

import { ITopic } from '../../../db/models/definitions/knowledgebase';
import { IUserDocument } from '../../../db/models/definitions/users';
import { IArticleCreate, ICategoryCreate } from '../../../db/models/KnowledgeBase';
import { moduleCheckPermission } from '../../permissions/wrappers';
import { putCreateLog, putDeleteLog, putUpdateLog } from '../../utils';

const knowledgeBaseMutations = {
  /**
   * Create topic document
   */
  async knowledgeBaseTopicsAdd(_root, { doc }: { doc: ITopic }, { user }: { user: IUserDocument }) {
    const topic = await KnowledgeBaseTopics.createDoc(doc, user._id);

    if (topic) {
      await putCreateLog(
        {
          type: 'knowledgeBaseTopic',
          newData: JSON.stringify(doc),
          object: JSON.stringify(topic),
          description: `${topic.title} has been created`,
        },
        user,
      );
    }

    return topic;
  },

  /**
   * Update topic document
   */
  async knowledgeBaseTopicsEdit(_root, { _id, doc }: { _id: string; doc: ITopic }, { user }: { user: IUserDocument }) {
    const topic = await KnowledgeBaseTopics.findOne({ _id });
    const updated = await KnowledgeBaseTopics.updateDoc(_id, doc, user._id);

    if (topic) {
      await putUpdateLog(
        {
          type: 'knowledgeBaseTopic',
          object: JSON.stringify(topic),
          newData: JSON.stringify(doc),
          description: `${topic.title} has been edited`,
        },
        user,
      );
    }

    return updated;
  },

  /**
   * Remove topic document
   */
  async knowledgeBaseTopicsRemove(_root, { _id }: { _id: string }, { user }: { user: IUserDocument }) {
    const topic = await KnowledgeBaseTopics.findOne({ _id });
    const removed = await KnowledgeBaseTopics.removeDoc(_id);

    if (topic) {
      await putDeleteLog(
        {
          type: 'knowledgeBaseTopic',
          object: JSON.stringify(topic),
          description: `${topic.title} has been removed`,
        },
        user,
      );
    }

    return removed;
  },

  /**
   * Create category document
   */
  async knowledgeBaseCategoriesAdd(_root, { doc }: { doc: ICategoryCreate }, { user }: { user: IUserDocument }) {
    const kbCategory = await KnowledgeBaseCategories.createDoc(doc, user._id);

    await putCreateLog(
      {
        type: 'knowledgeBaseCategory',
        newData: JSON.stringify(doc),
        description: `${kbCategory.title} has been created`,
        object: JSON.stringify(kbCategory),
      },
      user,
    );

    return kbCategory;
  },

  /**
   * Update category document
   */
  async knowledgeBaseCategoriesEdit(
    _root,
    { _id, doc }: { _id: string; doc: ICategoryCreate },
    { user }: { user: IUserDocument },
  ) {
    const kbCategory = await KnowledgeBaseCategories.findOne({ _id });
    const updated = await KnowledgeBaseCategories.updateDoc(_id, doc, user._id);

    if (kbCategory) {
      await putUpdateLog(
        {
          type: 'knowledgeBaseCategory',
          object: JSON.stringify(kbCategory),
          newData: JSON.stringify(doc),
          description: `${kbCategory.title} has been edited`,
        },
        user,
      );
    }

    return updated;
  },

  /**
   * Remove category document
   */
  async knowledgeBaseCategoriesRemove(_root, { _id }: { _id: string }, { user }: { user: IUserDocument }) {
    const kbCategory = await KnowledgeBaseCategories.findOne({ _id });
    const removed = await KnowledgeBaseCategories.removeDoc(_id);

    if (kbCategory) {
      await putDeleteLog(
        {
          type: 'knowledgeBaseCategory',
          object: JSON.stringify(kbCategory),
          description: `${kbCategory.title} has been removed`,
        },
        user,
      );
    }

    return removed;
  },

  /**
   * Create article document
   */
  async knowledgeBaseArticlesAdd(_root, { doc }: { doc: IArticleCreate }, { user }: { user: IUserDocument }) {
    const kbArticle = await KnowledgeBaseArticles.createDoc(doc, user._id);

    await putCreateLog(
      {
        type: 'knowledgeBaseArticle',
        newData: JSON.stringify(doc),
        description: `${kbArticle.title} has been created`,
        object: JSON.stringify(kbArticle),
      },
      user,
    );

    return kbArticle;
  },

  /**
   * Update article document
   */
  async knowledgeBaseArticlesEdit(
    _root,
    { _id, doc }: { _id: string; doc: IArticleCreate },
    { user }: { user: IUserDocument },
  ) {
    const kbArticle = await KnowledgeBaseArticles.findOne({ _id });
    const updated = await KnowledgeBaseArticles.updateDoc(_id, doc, user._id);

    if (kbArticle) {
      await putUpdateLog(
        {
          type: 'knowledgeBaseArticle',
          object: JSON.stringify(kbArticle),
          newData: JSON.stringify(doc),
          description: `${kbArticle.title} has been edited`,
        },
        user,
      );
    }

    return updated;
  },

  /**
   * Remove article document
   */
  async knowledgeBaseArticlesRemove(_root, { _id }: { _id: string }, { user }: { user: IUserDocument }) {
    const kbArticle = await KnowledgeBaseArticles.findOne({ _id });
    const removed = await KnowledgeBaseArticles.removeDoc(_id);

    if (kbArticle) {
      await putDeleteLog(
        {
          type: 'knowledgeBaseArticle',
          object: JSON.stringify(kbArticle),
          description: `${kbArticle.title} has been removed`,
        },
        user,
      );
    }

    return removed;
  },
};

moduleCheckPermission(knowledgeBaseMutations, 'manageKnowledgeBase');

export default knowledgeBaseMutations;
