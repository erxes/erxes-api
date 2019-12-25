import { KnowledgeBaseArticles, KnowledgeBaseCategories, KnowledgeBaseTopics } from '../../../db/models';
import { ITopic } from '../../../db/models/definitions/knowledgebase';
import { IArticleCreate, ICategoryCreate } from '../../../db/models/KnowledgeBase';
import { MODULE_NAMES } from '../../constants';
import { moduleCheckPermission } from '../../permissions/wrappers';
import { IContext } from '../../types';
import { putCreateLog, putDeleteLog, putUpdateLog } from '../../utils';
import { gatherBrandNames, gatherKbArticleNames, gatherKbCategoryNames, gatherUsernames, LogDesc } from './logUtils';

const knowledgeBaseMutations = {
  /**
   * Create topic document
   */
  async knowledgeBaseTopicsAdd(_root, { doc }: { doc: ITopic }, { user, docModifier }: IContext) {
    const topic = await KnowledgeBaseTopics.createDoc(docModifier(doc), user._id);

    let extraDesc: LogDesc[] = [{ createdBy: user._id, name: user.username || user.email }];

    if (doc.brandId) {
      extraDesc = await gatherBrandNames({
        idFields: [doc.brandId],
        foreignKey: 'brandId',
        prevList: extraDesc,
      });
    }

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
   * Update topic document
   */
  async knowledgeBaseTopicsEdit(_root, { _id, doc }: { _id: string; doc: ITopic }, { user }: IContext) {
    const topic = await KnowledgeBaseTopics.getTopic(_id);
    const updated = await KnowledgeBaseTopics.updateDoc(_id, doc, user._id);

    let extraDesc: LogDesc[] = [{ modifiedBy: user._id, name: user.username || user.email }];

    extraDesc = await gatherUsernames({
      idFields: [topic.createdBy],
      foreignKey: 'createdBy',
      prevList: extraDesc,
    });

    if (topic.categoryIds && topic.categoryIds) {
      extraDesc = await gatherKbCategoryNames({
        idFields: topic.categoryIds,
        foreignKey: 'categoryIds',
        prevList: extraDesc,
      });
    }

    const brandIds: string[] = [];

    if (topic.brandId) {
      brandIds.push(topic.brandId);
    }

    if (doc.brandId && doc.brandId !== topic.brandId) {
      brandIds.push(doc.brandId);
    }

    if (brandIds.length > 0) {
      extraDesc = await gatherBrandNames({
        idFields: brandIds,
        foreignKey: 'brandId',
        prevList: extraDesc,
      });
    }

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
    // categories are removed alongside
    const categories = await KnowledgeBaseCategories.find({ _id: { $in: topic.categoryIds } }, { title: 1 });

    const removed = await KnowledgeBaseTopics.removeDoc(_id);

    let extraDesc: LogDesc[] = [];

    extraDesc = await gatherUsernames({
      idFields: [topic.createdBy],
      foreignKey: 'createdBy',
    });

    extraDesc = await gatherUsernames({
      idFields: [topic.modifiedBy],
      foreignKey: 'modifiedBy',
      prevList: extraDesc,
    });

    if (topic.brandId) {
      extraDesc = await gatherBrandNames({
        idFields: [topic.brandId],
        foreignKey: 'brandId',
        prevList: extraDesc,
      });
    }

    if (topic.categoryIds && topic.categoryIds.length > 0) {
      for (const cat of categories) {
        extraDesc.push({
          categoryIds: cat._id,
          name: cat.title,
        });
      }
    }

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

    let extraDesc: LogDesc[] = [{ modifiedBy: user._id, name: user.username || user.email }];

    extraDesc = await gatherUsernames({
      idFields: [kbCategory.createdBy],
      foreignKey: 'createdBy',
      prevList: extraDesc,
    });

    if (kbCategory.articleIds && kbCategory.articleIds.length > 0) {
      extraDesc = await gatherKbArticleNames({
        idFields: kbCategory.articleIds,
        foreignKey: 'articleIds',
        prevList: extraDesc,
      });
    }

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

    const articles = await KnowledgeBaseArticles.find({ _id: { $in: kbCategory.articleIds } }, { title: 1 });

    const removed = await KnowledgeBaseCategories.removeDoc(_id);

    let extraDesc: LogDesc[] = await gatherUsernames({
      idFields: [kbCategory.createdBy],
      foreignKey: 'createdBy',
    });

    extraDesc = await gatherUsernames({
      idFields: [kbCategory.modifiedBy],
      foreignKey: 'modifiedBy',
      prevList: extraDesc,
    });

    if (articles.length > 0) {
      for (const article of articles) {
        extraDesc.push({ articleIds: article._id, name: article.title });
      }
    }

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
