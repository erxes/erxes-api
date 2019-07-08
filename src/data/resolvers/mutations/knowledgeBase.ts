import { KnowledgeBaseArticles, KnowledgeBaseCategories, KnowledgeBaseTopics } from '../../../db/models';

import { ITopic } from '../../../db/models/definitions/knowledgebase';
import { IUserDocument } from '../../../db/models/definitions/users';
import { IArticleCreate, ICategoryCreate } from '../../../db/models/KnowledgeBase';
import { LOG_ACTIONS } from '../../constants';
import { moduleCheckPermission } from '../../permissions/wrappers';
import { putLog } from '../../utils';

const knowledgeBaseMutations = {
  /**
   * Create topic document
   */
  async knowledgeBaseTopicsAdd(_root, { doc }: { doc: ITopic }, { user }: { user: IUserDocument }) {
    const topic = await KnowledgeBaseTopics.createDoc(doc, user._id);

    if (topic) {
      await putLog(
        {
          type: 'knowledgeBaseTopic',
          action: LOG_ACTIONS.CREATE,
          newData: JSON.stringify(doc),
          objectId: topic._id,
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

    if (topic && updated) {
      await putLog(
        {
          type: 'knowledgeBaseTopic',
          action: LOG_ACTIONS.UPDATE,
          oldData: JSON.stringify(topic),
          newData: JSON.stringify(doc),
          objectId: _id,
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
      await putLog(
        {
          type: 'knowledgeBaseTopic',
          action: LOG_ACTIONS.DELETE,
          oldData: JSON.stringify(topic),
          objectId: _id,
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
  knowledgeBaseCategoriesAdd(_root, { doc }: { doc: ICategoryCreate }, { user }: { user: IUserDocument }) {
    return KnowledgeBaseCategories.createDoc(doc, user._id);
  },

  /**
   * Update category document
   */
  knowledgeBaseCategoriesEdit(
    _root,
    { _id, doc }: { _id: string; doc: ICategoryCreate },
    { user }: { user: IUserDocument },
  ) {
    return KnowledgeBaseCategories.updateDoc(_id, doc, user._id);
  },

  /**
   * Remove category document
   */
  knowledgeBaseCategoriesRemove(_root, { _id }: { _id: string }) {
    return KnowledgeBaseCategories.removeDoc(_id);
  },

  /**
   * Create article document
   */
  knowledgeBaseArticlesAdd(_root, { doc }: { doc: IArticleCreate }, { user }: { user: IUserDocument }) {
    return KnowledgeBaseArticles.createDoc(doc, user._id);
  },

  /**
   * Update article document
   */
  knowledgeBaseArticlesEdit(
    _root,
    { _id, doc }: { _id: string; doc: IArticleCreate },
    { user }: { user: IUserDocument },
  ) {
    return KnowledgeBaseArticles.updateDoc(_id, doc, user._id);
  },

  /**
   * Remove article document
   */
  knowledgeBaseArticlesRemove(_root, { _id }: { _id: string }) {
    return KnowledgeBaseArticles.removeDoc(_id);
  },
};

moduleCheckPermission(knowledgeBaseMutations, 'manageKnowledgeBase');

export default knowledgeBaseMutations;
